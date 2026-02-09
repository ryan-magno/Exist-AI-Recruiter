

# Fix: Switch from SSE to NDJSON Format + Fix Double-Accumulation Bug

## Problem

Two issues preventing messages from displaying:

1. **Wrong format parsing**: `chatApi.ts` expects SSE format (`data: ` prefixed lines), but n8n returns newline-delimited JSON (NDJSON) -- plain JSON objects per line, no `data:` prefix.
2. **Double-accumulation bug**: `chatApi.ts` sends the full accumulated text via `onChunk(accumulated)`, but `useStreamingChat.ts` does `contentSoFar += chunk` on each call, causing the text to repeat/double.

## Changes

### File 1: `src/lib/chatApi.ts`

- Change `Accept` header from `text/event-stream` to `application/json`
- Remove the `data: ` prefix stripping logic (lines like `if (!line.startsWith('data: ')) continue`)
- Parse each line directly as JSON
- Handle `{"type":"item","content":"..."}` for text chunks (instead of `{"type":"message","data":"..."}`)
- Handle `{"type":"end"}` as the completion signal (instead of `[DONE]`)
- Ignore `{"type":"begin"}` events
- Remove the SSE-specific buffer flush logic
- Keep the accumulated pattern: `onChunk` receives full accumulated text

### File 2: `src/hooks/useStreamingChat.ts`

- Fix line 85: change `contentSoFar += chunk` to `contentSoFar = chunk` since `chatApi.ts` already accumulates and sends the full snapshot. Currently each chunk gets appended to the previous accumulation, causing doubled/tripled text.

## Technical Details

**NDJSON format from n8n:**
```text
{"type":"begin","metadata":{...}}
{"type":"item","content":"Hello"}
{"type":"item","content":"!"}
{"type":"item","content":" How"}
{"type":"end","metadata":{...}}
```

**chatApi.ts core parsing logic (replacing lines 57-75):**
```typescript
if (!line) continue; // Skip empty lines

try {
  const parsed = JSON.parse(line);
  if (parsed.type === 'item' && parsed.content) {
    accumulated += parsed.content;
    options.onChunk(accumulated);
  } else if (parsed.type === 'end') {
    options.onComplete();
    return;
  }
} catch (e) {
  console.warn('NDJSON: Failed to parse line:', line);
}
```

**useStreamingChat.ts fix (line 85):**
```typescript
// Before (bug - double accumulation):
contentSoFar += chunk;

// After (chunk IS the full accumulated text):
contentSoFar = chunk;
```

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/chatApi.ts` | Switch from SSE to NDJSON parsing; change Accept header; parse `type:"item"` with `content` field; handle `type:"end"` |
| `src/hooks/useStreamingChat.ts` | Fix line 85: `contentSoFar = chunk` instead of `contentSoFar += chunk` |

---
# ADDENDUM: Prevent Escaped JSON from "Respond to Webhook" Node

## Additional Issue
The n8n workflow outputs from TWO nodes:
1. **AI Agent node** - streams individual word chunks (what we want)
2. **Respond to Webhook node** - outputs one large wrapped JSON at the end

Example of the unwanted line:
```json
{"type":"item","content":"{\"output\":\"Hello! How can...\"}"}
```

If parsed, this would display escaped JSON characters like `{\"output\":\"...` in the chat UI.

## Solution
The AI Agent node sends a `{"type":"end"}` event BEFORE the Respond to Webhook output. By returning early when we see `type:"end"`, we naturally skip the wrapped JSON.

## Updated chatApi.ts Parsing Logic

Replace the proposed parsing section with this enhanced version:

```typescript
if (!line) continue; // Skip empty lines

try {
  const parsed = JSON.parse(line);
  
  // Handle AI Agent streaming chunks
  if (parsed.type === 'item' && parsed.content) {
    // ⚠️ CRITICAL: Skip wrapped JSON from "Respond to Webhook" node
    // This content starts with { and contains "output": which indicates
    // it's the final wrapped response, not a streaming chunk
    if (parsed.content.startsWith('{') && parsed.content.includes('"output"')) {
      console.log('Skipping wrapped JSON from Respond to Webhook node');
      continue;
    }
    
    accumulated += parsed.content;
    options.onChunk(accumulated);
  } 
  // Handle stream completion
  else if (parsed.type === 'end') {
    console.log('Stream ended, accumulated:', accumulated.length, 'chars');
    options.onComplete(accumulated);
    return; // Exit immediately, don't process any more lines
  }
  // Ignore 'begin' and other metadata events
  
} catch (e) {
  console.warn('NDJSON: Failed to parse line:', line);
}
```

## Why This Works

**Event sequence from n8n:**
```
1. {"type":"begin"} from AI Agent          ← Ignore
2. {"type":"item","content":"Hello"}       ← Accumulate
3. {"type":"item","content":"!"}           ← Accumulate
4. ... (more chunks)
5. {"type":"end"} from AI Agent            ← STOP HERE ✅
6. {"type":"begin"} from Respond to Webhook ← Never reached
7. {"type":"item","content":"{\"output\":...} ← Never reached
8. {"type":"end"} from Respond to Webhook   ← Never reached
```

By returning at step 5, we never process steps 6-8.

The additional check `if (parsed.content.startsWith('{')...` is **defense in depth** - it catches the wrapped JSON even if somehow the first `type:"end"` is missed.

## Updated Technical Details Section

**Add this to the plan's Technical Details:**

```typescript
// Enhanced parsing with wrapped JSON protection
if (parsed.type === 'item' && parsed.content) {
  // Skip wrapped JSON from Respond to Webhook node
  if (parsed.content.startsWith('{') && parsed.content.includes('"output"')) {
    continue;
  }
  accumulated += parsed.content;
  options.onChunk(accumulated);
} else if (parsed.type === 'end') {
  options.onComplete(accumulated); // ⚠️ Pass accumulated text
  return; // Exit immediately
}
```

## Files to Modify (Updated)

| File | Change |
|------|--------|
| `src/lib/chatApi.ts` | Switch from SSE to NDJSON parsing; change Accept header; parse `type:"item"` with `content` field; **skip wrapped JSON content**; handle `type:"end"` and **return immediately**; pass `accumulated` to `onComplete()` |
| `src/hooks/useStreamingChat.ts` | Fix line 85: `contentSoFar = chunk` instead of `contentSoFar += chunk` |

## Testing This Fix

After implementation, verify:

1. ✅ Message streams word by word
2. ✅ No escaped JSON characters appear in chat (like `{\"output\"...`)
3. ✅ Console shows "Stream ended" log when complete
4. ✅ Message is complete and readable

If you see escaped JSON in the UI, check the console for "Skipping wrapped JSON" log to confirm the filter is working.

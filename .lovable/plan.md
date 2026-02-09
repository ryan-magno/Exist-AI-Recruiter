

# Fix: Defensive NDJSON Parsing with Verbose Logging

## Problem

Console shows "Stream ended, accumulated: 0 chars" -- content chunks are being received but not accumulated. Possible causes:
1. The wrapped JSON filter (`startsWith('{')`) is too aggressive
2. The `parsed.content` truthiness check fails on empty strings
3. The first `type:"end"` event fires before any content is processed

## Changes

### File: `src/lib/chatApi.ts` (lines 57-77)

Replace the parsing block with a defensive version that:

1. **Defensive type checking**: `String(parsed.type || '').trim()` to handle whitespace or unexpected values
2. **Explicit content check**: Use `parsed.hasOwnProperty('content')` and `String(parsed.content)` instead of relying on truthiness
3. **Stricter wrapped JSON filter**: Add `content.includes('\\"')` to the skip condition so only actual escaped-JSON payloads from the Respond to Webhook node are skipped
4. **Only stop on end with content**: Change the `type:"end"` handler to only call `onComplete` and return when `accumulated.length > 0`; otherwise log and continue reading
5. **Verbose logging**: Log every event type, content snippets, and chunk counts to diagnose any remaining issues

### Core logic replacement (lines 57-77):

```typescript
if (!line) continue;

try {
  const parsed = JSON.parse(line);
  const eventType = String(parsed.type || '').trim();

  console.log(`NDJSON event: type="${eventType}", hasContent=${parsed.hasOwnProperty('content')}`);

  if (eventType === 'item' && parsed.hasOwnProperty('content')) {
    const content = String(parsed.content);

    // Skip wrapped JSON ONLY if it's definitely the Respond to Webhook output
    if (content.startsWith('{') && content.includes('"output"') && content.includes('\\"')) {
      console.log('NDJSON: Skipping wrapped JSON from Respond to Webhook');
      continue;
    }

    accumulated += content;
    console.log(`NDJSON chunk: +${content.length} chars, total: ${accumulated.length}`);
    options.onChunk(accumulated);
  } else if (eventType === 'end') {
    console.log('NDJSON: end event, accumulated:', accumulated.length, 'chars');
    if (accumulated.length > 0) {
      options.onComplete();
      return;
    }
    console.log('NDJSON: ignoring end event (no content yet)');
  }
} catch {
  console.warn('NDJSON: Failed to parse line:', line.substring(0, 200));
}
```

No other files need changes.

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/chatApi.ts` | Replace parsing block (lines 57-77) with defensive type/content checks, stricter wrapped-JSON filter, end-only-with-content logic, and verbose logging |


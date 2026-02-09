

# Revert chatApi.ts to SSE Stream Reading

## Problem

The n8n webhook is configured with streaming enabled (`responseMode: "streaming"`, `enableStreaming: true`), returning Server-Sent Events. The current code uses `response.json()` which fails to parse the SSE stream.

## Solution

Replace the JSON parsing in `src/lib/chatApi.ts` with an SSE stream reader that:

1. Sets `Accept: text/event-stream` header
2. Uses `response.body.getReader()` to read the stream incrementally
3. Parses `data:` prefixed lines, handling `data: [DONE]` as the completion signal
4. Parses each `data:` payload as JSON with format `{"type":"message","data":"chunk text"}`
5. Accumulates chunks and calls `options.onChunk()` with the accumulated text on each chunk
6. Calls `options.onComplete()` when `[DONE]` is received or the stream ends
7. Handles a line buffer to deal with chunks split across read boundaries
8. Flushes any remaining buffer content after the read loop ends

No other files need changes -- `useStreamingChat.ts` and the UI components already work with the `onChunk`/`onComplete` callback pattern.

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/chatApi.ts` | Replace `response.json()` with SSE stream reader using `ReadableStream`, parse `data:` lines, handle `[DONE]` sentinel, buffer partial lines across chunks |

## Technical Details

Key implementation in `chatApi.ts`:

```typescript
const response = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  },
  body: JSON.stringify({ chatInput, sessionId }),
  signal: controller.signal,
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let accumulated = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  // Process complete lines
  let newlineIdx;
  while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIdx).trim();
    buffer = buffer.slice(newlineIdx + 1);

    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') { options.onComplete(); return; }

    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'message' && parsed.data) {
        accumulated += parsed.data;
        options.onChunk(accumulated);
      }
    } catch { /* skip malformed */ }
  }
}

// Flush remaining buffer, then complete
options.onComplete();
```

The `onChunk` callback receives the **accumulated** message so far (not just the delta), which matches how `useStreamingChat.ts` uses it -- it replaces the last assistant message's content with the snapshot.


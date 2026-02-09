

# Fix: n8n Webhook Returns JSON, Not SSE

## Problem

The current `chatApi.ts` expects Server-Sent Events (SSE) streaming, but the n8n webhook actually returns a plain JSON response:

```json
[{"output": "I am an intelligent HR assistant..."}]
```

The SSE reader loops forever waiting for `data:` lines that never come, so the assistant message stays empty.

## Solution

Rewrite `src/lib/chatApi.ts` to handle the actual JSON response format while keeping the same `StreamOptions` callback interface so `useStreamingChat.ts` requires no changes.

### Changes in `src/lib/chatApi.ts`

Replace the entire SSE stream-reading logic with:

1. Change `Accept` header from `text/event-stream` to `application/json`
2. Use `response.json()` instead of streaming the body
3. Extract the message from `data[0]?.output`
4. Validate the response structure (array with `output` field)
5. Deliver the full text via `options.onChunk()` then call `options.onComplete()`
6. Add `console.log` statements for debugging (response status, raw data, extracted output)

The function signature and callback contract stay identical, so **no changes needed** in `useStreamingChat.ts`, `ChatbotPage.tsx`, or any other file.

## Technical Details

**Key code change in `chatApi.ts`:**
```typescript
const response = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({ chatInput, sessionId }),
  signal: controller.signal,
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

const data = await response.json();

if (!Array.isArray(data) || !data[0]?.output) {
  throw new Error('Invalid response format from n8n');
}

const aiMessage = data[0].output;
if (!aiMessage || aiMessage.trim() === '') {
  throw new Error('Empty response from AI');
}

options.onChunk(aiMessage);
options.onComplete();
```

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/chatApi.ts` | Replace SSE stream reader with JSON response parsing; change Accept header to `application/json`; extract `data[0].output` |

No other files need changes -- the hook and UI already work with the `onChunk`/`onComplete` callback pattern.


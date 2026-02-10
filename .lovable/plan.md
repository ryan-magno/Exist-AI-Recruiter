

## Fix: Trigger Refresh Only on Webhook "completed" Response

### Problem
The refresh notification appears immediately after CV upload because `emitRefreshPrompt()` is called as soon as the proxy responds with `{ "status": "processing" }`. The user wants the refresh to trigger only when the response is `{ "status": "completed" }` (HTTP 200).

### Solution
1. **In `src/pages/UploadPage.tsx`** (lines ~286-297):
   - Remove the `emitRefreshPrompt(files.length)` call from the `status === 'processing'` block.
   - Add a new condition: if the response is `{ "status": "completed" }` with HTTP 200, call `emitRefreshPrompt(files.length)` there instead.
   - Keep the `processing` path as a silent success (toast only, no refresh prompt).

2. **Specific changes in `handleVectorize`**:
   - After parsing `result` (~line 286), add a check for `result?.status === 'completed'` alongside the existing `processing` check.
   - When `completed`: emit refresh prompt, mark files complete, show success toast.
   - When `processing`: mark files complete, show info toast (no refresh prompt).

### Technical Details

File: `src/pages/UploadPage.tsx`

```
// Current (broken) logic at line 286:
if (result?.status === 'processing') {
  ...
  emitRefreshPrompt(files.length);  // <-- fires too early
  return;
}

// New logic:
if (result?.status === 'completed') {
  // Webhook finished processing — trigger refresh immediately
  setFiles(prev => prev.map(f => ({ ...f, status: 'complete' as const })));
  toast.success('CVs processed successfully!', {
    description: 'Candidates are ready. Refreshing...',
    duration: 3000
  });
  emitRefreshPrompt(files.length);
  // Save uploader name...
  return;
}

if (result?.status === 'processing') {
  // Background processing started — no refresh prompt yet
  setFiles(prev => prev.map(f => ({ ...f, status: 'complete' as const })));
  toast.success('CVs submitted for AI processing!', {
    description: 'Candidates will appear once processing completes.',
    duration: 5000
  });
  // Save uploader name... (no emitRefreshPrompt)
  return;
}
```

The existing polling in `useRealtimeCandidates.ts` already silently refreshes the query cache when candidates transition to "completed" status (line 81), so candidates will still appear even if the webhook takes time -- the user just won't see the manual refresh prompt until the webhook explicitly returns `completed`.


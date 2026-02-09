

# Fix: Upload Page Always Enabled + Minimal Non-Dismissible Refresh Popup

## Problem 1: Upload fields disabled when candidates exist

The upload page uses `isVectorized` (which is `true` when `candidates.length > 0`) to disable the uploader name input, radio group, dropzone, and file settings. This means once any candidates exist in the system, uploading new CVs is blocked. This was likely a leftover from an early demo flow and should be removed entirely.

## Problem 2: Refresh notification is too large and dismissible

The current `RefreshNotification` is a large card with icon, description, and dismiss button. Per the new requirements:
- It should be smaller and more minimal
- It cannot be closed/dismissed -- only disappears when the user clicks "Refresh"
- It should only refresh candidates (not job orders)

## Problem 3: Trigger refresh popup on webhook 200 response

Currently the popup is triggered by the polling hook (`useRealtimeCandidates`). The user wants it triggered when the webhook returns HTTP 200 in the upload flow. The upload page should signal this.

---

## Changes

### File 1: `src/pages/UploadPage.tsx`

**Remove all `isVectorized` disabling logic:**
- Line 53: Remove `isVectorized` from the destructured `useApp()` call
- Line 443: Remove `isVectorized && "opacity-50"` from input className
- Line 445: Remove `isVectorized` from `disabled` prop (keep `loadingUploaders`)
- Line 450: Remove `!isVectorized` from suggestions condition
- Line 513: Remove `disabled={isVectorized}` from RadioGroup
- Lines 533: Remove `isVectorized && 'opacity-50 pointer-events-none'` from dropzone
- Line 574: Remove `isVectorized ||` from FileRow disabled prop (keep `file.status !== 'ready'`)

**Trigger refresh notification on webhook 200:**
- After successful webhook response (around line 290, the `result?.status === 'processing'` block), instead of navigating to dashboard, show the refresh popup
- Import and use a shared state/callback to trigger the notification from the layout level
- Pass a callback from `AppLayout` through context or use a simple event approach

### File 2: `src/components/ui/RefreshNotification.tsx`

**Make it smaller and non-dismissible:**
- Remove the `onDismiss` prop and the X close button
- Shrink padding and remove the icon circle
- Make it a compact toast-like bar with just text + refresh button
- Keep it fixed at bottom-right

### File 3: `src/hooks/useRealtimeCandidates.ts`

**Refresh only candidates (not job orders):**
- In `refreshData`, remove the `job-orders` query invalidation
- Add a `triggerRefreshPrompt` method that can be called externally (e.g., from upload page on 200 response)
- Remove `dismissPrompt` since the notification is no longer dismissible

### File 4: `src/components/layout/AppLayout.tsx`

- Remove `dismissPrompt` from the hook usage
- Remove the `onDismiss` prop from `RefreshNotification`

---

## Technical Details

### Upload page `isVectorized` removal

Every instance of `isVectorized` in `UploadPage.tsx` will be removed. The only disabling conditions that remain are:
- `loadingUploaders` -- while fetching uploader names
- `isProcessing` -- while a batch is actively being sent
- `file.status !== 'ready'` -- per-file status

### Minimal RefreshNotification design

```text
+------------------------------------------+
| New candidates ready.  [Refresh]         |
+------------------------------------------+
```

A compact single-line bar, no icon, no dismiss button. Uses `bg-primary` with small padding.

### Triggering the popup on webhook 200

The upload page already has access to the upload response. On a successful 200 response, it will call a method exposed by `useRealtimeCandidates` to show the refresh prompt with the file count. This will be done by adding a `triggerRefreshPrompt(count)` function to the hook's return value, and making it accessible via a simple module-level event emitter or by lifting it through `AppContext`.

The simplest approach: add the trigger function to `AppContext` so both `AppLayout` (which renders the notification) and `UploadPage` (which triggers it) can coordinate.

### Files to modify

| File | Change |
|------|--------|
| `src/pages/UploadPage.tsx` | Remove all `isVectorized` disabling; trigger refresh prompt on 200 |
| `src/components/ui/RefreshNotification.tsx` | Make smaller, remove dismiss button/X |
| `src/hooks/useRealtimeCandidates.ts` | Add `triggerRefreshPrompt`; refresh only candidates; remove `dismissPrompt` |
| `src/components/layout/AppLayout.tsx` | Remove `onDismiss` prop |


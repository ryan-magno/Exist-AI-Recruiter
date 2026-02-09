

# High-Level Architecture Refactor for Data Persistence

## Root Cause Analysis

The previous fix failed because of **three compounding issues**:

1. **Query key mismatch**: The candidate data lives under the query key `['legacy-candidates']`, but `useRealtimeCandidates` (line 67-68) and `useProcessingStatus` (lines 81-82, 98-99) invalidate `['candidates']` and `['applications']` -- keys that do NOT match `['legacy-candidates']`. The `initializeDatabase` function (line 222) also invalidates `['candidates']` instead of `['legacy-candidates']`. This means background polling creates spurious refetches on non-existent keys while the actual data key is unaffected by legitimate refresh triggers.

2. **`enabled: isInitialized` gate**: The `useQuery` for candidates has `enabled: isInitialized`, and `isInitialized` starts as `false`. Every time `AppProvider` re-renders from scratch (which can happen during navigation if the component tree remounts), `isInitialized` resets to `false`, the query is disabled, and the cached data is not served until `initializeDatabase` runs again. This creates a flash of empty data.

3. **Cache settings are too short**: `staleTime: 5min` and `gcTime: 10min` are not aggressive enough. With `refetchOnMount` still at its default (`true`), every navigation triggers a background refetch that can briefly show stale/empty state.

## Solution (4 Steps)

### Step 1: Move Providers to `main.tsx`

Move `QueryClientProvider`, `TooltipProvider`, and `Toaster`/`Sonner` OUT of `App.tsx` and into `main.tsx`. This ensures the `QueryClient` instance is never destroyed during route changes. `App.tsx` becomes a pure routing component inside `BrowserRouter`.

### Step 2: Aggressive QueryClient Configuration

Set the `QueryClient` defaults in `main.tsx` to:
- `staleTime: 1000 * 60 * 60` (1 hour)
- `gcTime: 1000 * 60 * 60 * 24` (24 hours)
- `refetchOnWindowFocus: false`
- `refetchOnMount: false`
- `retry: 1`

This means data fetched once stays fresh for the entire session. Navigating between pages serves cached data instantly.

### Step 3: Refactor AppContext -- Remove Manual Init Gate

- **Remove the `isInitialized` state** and the `enabled: isInitialized` guard on the candidates query. Instead, call `azureDb.init()` inside the `queryFn` itself (as a one-time call via a module-level flag), so the query is always enabled and the cache is always active.
- **Remove the `useEffect` that calls `initializeDatabase` on mount**. The init call happens lazily inside the first query execution.
- **Fix all query key references**: Change `initializeDatabase`'s invalidation calls from `['candidates']` to `['legacy-candidates']`.

### Step 4: Fix Invalidation in Polling Hooks

- In `useRealtimeCandidates.ts` (lines 67-68, 102): change `queryClient.invalidateQueries({ queryKey: ['candidates'] })` to `queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] })`.
- In `useProcessingStatus.ts` (lines 81, 98): same fix -- invalidate `['legacy-candidates']` instead of `['candidates']`.
- These are the ONLY places that should trigger refetches, and only in response to actual new data arriving (not navigation).

## Files to Modify

| File | Change |
|------|--------|
| `src/main.tsx` | Add `QueryClientProvider`, `TooltipProvider`, `Toaster`, `Sonner` wrapping `<App />` with aggressive cache config |
| `src/App.tsx` | Remove `QueryClientProvider`, `TooltipProvider`, `Toaster`, `Sonner` -- keep only `BrowserRouter` + `AppProvider` + routes |
| `src/context/AppContext.tsx` | Remove `isInitialized` state, remove `initializeDatabase` useEffect, make init lazy inside queryFn, remove `enabled` guard, fix query key references |
| `src/hooks/useRealtimeCandidates.ts` | Fix invalidation key from `['candidates']` to `['legacy-candidates']` |
| `src/hooks/useProcessingStatus.ts` | Fix invalidation key from `['candidates']` to `['legacy-candidates']` |

## Technical Details

**main.tsx** structure:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,       // 1 hour
      gcTime: 1000 * 60 * 60 * 24,     // 24 hours
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <App />
    </TooltipProvider>
  </QueryClientProvider>
);
```

**App.tsx** becomes:
```typescript
const App = () => (
  <BrowserRouter>
    <AppProvider>
      <AppLayout>
        <Routes>...</Routes>
      </AppLayout>
    </AppProvider>
  </BrowserRouter>
);
```

**AppContext.tsx** candidate query (no `enabled` guard):
```typescript
let dbInitialized = false; // module-level flag

async function ensureInit() {
  if (!dbInitialized) {
    await azureDb.init();
    dbInitialized = true;
  }
}

// Inside AppProvider:
const { data: candidates = [] } = useQuery({
  queryKey: ['legacy-candidates'],
  queryFn: async () => {
    await ensureInit();
    return fetchLegacyCandidates();
  },
});
```

This removes the `isInitialized` state, the `initializeDatabase` function, and the auto-init `useEffect` entirely.

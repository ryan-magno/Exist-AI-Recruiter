
# Fix: Robust Data Persistence Across Navigation

## Root Cause

Two issues cause data to disappear when navigating between pages:

1. **React Query default cache settings**: `staleTime` is 0ms by default, meaning queries are immediately considered stale. When navigating away and back, React Query refetches and briefly shows loading/empty state.

2. **Candidates not managed by React Query**: Unlike job orders (which use `useJobOrders` hook with React Query), candidates are fetched via a raw `async` call (`refreshCandidates`) and stored in plain `useState`. This means no caching, no background refetching, and no persistence across re-renders.

## Solution

### 1. Configure QueryClient with sensible defaults

In `src/App.tsx`, set `staleTime` and `gcTime` on the `QueryClient` so all queries retain their data across navigation:

- `staleTime: 5 * 60 * 1000` (5 minutes) -- data won't refetch unless 5 min old
- `gcTime: 10 * 60 * 1000` (10 minutes) -- cached data kept for 10 min after unmount
- `refetchOnWindowFocus: false` -- prevent unexpected refetches when switching tabs

### 2. Convert candidate fetching to React Query

In `src/context/AppContext.tsx`, replace the manual `refreshCandidates` + `useState` pattern with a proper React Query hook. This ensures candidates are cached the same way job orders are.

- Create a `useQuery` call with key `['legacy-candidates']` that runs the existing `refreshCandidates` logic (fetch applications + candidates, convert to legacy format)
- Remove the `candidates` useState and the manual `refreshCandidates` callback
- The `setCandidates` calls for optimistic updates will use `queryClient.setQueryData` instead
- `refreshCandidates` becomes `queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] })`

### 3. Keep initializeDatabase but don't re-run data fetch

The `initializeDatabase` call on mount will remain, but after init completes it will just invalidate query keys rather than manually fetching. React Query handles the rest.

## Files to Modify

- **`src/App.tsx`** -- Configure QueryClient defaults
- **`src/context/AppContext.tsx`** -- Replace manual candidate fetch with React Query, update optimistic update patterns to use `queryClient.setQueryData`

## Technical Details

**QueryClient config:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Candidate query in AppContext:**
```typescript
const { data: legacyCandidates = [] } = useQuery({
  queryKey: ['legacy-candidates'],
  queryFn: async () => {
    // existing refreshCandidates logic, but return the data instead of setState
    const [applicationsData, candidatesData] = await Promise.all([...]);
    // ... transform ...
    return legacyCandidates;
  },
});
```

**Optimistic updates (e.g., pipeline status change):**
```typescript
queryClient.setQueryData(['legacy-candidates'], (old) =>
  old.map(c => c.id === candidateId ? { ...c, pipelineStatus: status } : c)
);
```

This approach ensures all data is cached by React Query, survives navigation, and stays consistent across the entire app.

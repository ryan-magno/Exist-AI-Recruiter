

# Fix: Eliminate Data Flash by Removing useState/useEffect Sync Patterns

## Root Cause

The previous refactors correctly moved providers and configured caching, but the data still disappears because of **synchronous rendering gaps**:

- `jobOrders` is a `useState([])` that gets populated by a `useEffect` watching `dbJobOrders`. On every render cycle, the first render sees `jobOrders = []` before the effect fires.
- `isVectorized` is a `useState(false)` that gets set to `true` by a `useEffect` watching `candidates`. On the first render, it's `false`, which causes `getMatchesForJo()` and `getAllCandidates()` to return empty arrays.
- Multiple pages (`DashboardPage`, `CandidatesPage`, `AnalyticsPage`) check `isVectorized` and show "No Candidates Yet" placeholder when it's `false`.

Even with cached React Query data available instantly, `useState` + `useEffect` introduces a one-frame delay where the UI renders with empty/default state.

## Solution

Replace all `useState` + `useEffect` sync patterns with `useMemo`, which computes derived values **synchronously** on the same render that receives the cached data.

### Changes in `src/context/AppContext.tsx`

1. **Replace `jobOrders` useState + useEffect with `useMemo`**:
   - Remove: `const [jobOrders, setJobOrders] = useState([])`
   - Remove: the `useEffect` that maps `dbJobOrders` to legacy format
   - Add: `const jobOrders = useMemo(() => dbJobOrders.map(...), [dbJobOrders])`

2. **Replace `isVectorized` useState + useEffect with `useMemo`**:
   - Remove: `const [isVectorized, setIsVectorized] = useState(false)`
   - Remove: the `useEffect` that sets `isVectorized` when candidates arrive
   - Add: `const isVectorized = useMemo(() => candidates.length > 0, [candidates])`

3. **Remove `isVectorized` gates from data functions**:
   - `getMatchesForJo`: Remove the `if (!isVectorized) return []` check -- just filter candidates directly
   - `getAllCandidates`: Remove the `if (!isVectorized) return []` check -- just return candidates

4. **Update context type**: Remove `setIsVectorized` and `setJobOrders` from the context interface since they are no longer needed as external setters (the data is derived, not manually set).

### Changes in `src/pages/UploadPage.tsx`

- Remove references to `setIsVectorized` -- it's no longer a setter. The `isVectorized` flag will automatically become `true` when candidates appear in the query cache after CV processing completes.

## Technical Details

**Before (broken)**:
```text
Render 1: jobOrders=[], isVectorized=false --> UI shows empty
useEffect fires: setJobOrders(data), setIsVectorized(true)
Render 2: jobOrders=data, isVectorized=true --> UI shows data
```

**After (fixed)**:
```text
Render 1: jobOrders=useMemo(dbJobOrders), isVectorized=useMemo(candidates.length>0) --> UI shows data immediately
```

**AppContext key changes**:
```typescript
// BEFORE:
const [jobOrders, setJobOrders] = useState([]);
const [isVectorized, setIsVectorized] = useState(false);
useEffect(() => { if (dbJobOrders.length > 0) setJobOrders(mapped) }, [dbJobOrders]);
useEffect(() => { if (candidates.length > 0) setIsVectorized(true) }, [candidates]);

// AFTER:
const jobOrders = useMemo(() => dbJobOrders.map(jo => ({...legacy format...})), [dbJobOrders]);
const isVectorized = candidates.length > 0;
```

## Files to Modify

| File | Change |
|------|--------|
| `src/context/AppContext.tsx` | Replace useState+useEffect sync with useMemo for jobOrders and isVectorized; remove gates from getMatchesForJo/getAllCandidates; remove setIsVectorized/setJobOrders from context |
| `src/pages/UploadPage.tsx` | Remove `setIsVectorized` usage (no longer available) |

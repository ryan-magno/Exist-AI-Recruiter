

# Add Internal/External Filter and Score Sort

## Overview
Add two new controls to the candidate filter bar: a filter for Internal/External applicant type, and a sort dropdown for score (ascending/descending).

## Changes

### File: `src/pages/DashboardPage.tsx`

**1. New state variables (after line 18)**
- `applicantTypeFilter`: `'all' | 'internal' | 'external'` (default `'all'`)
- `scoreSort`: `'none' | 'asc' | 'desc'` (default `'none'`)

**2. Update `filteredMatches` memo (lines 70-82)**
- Add applicant type filtering: `candidate.applicantType === applicantTypeFilter`
- After filtering, apply sorting: if `scoreSort` is `'asc'` or `'desc'`, sort by `candidate.qualificationScore`
- Add new state variables to the dependency array

**3. Update `hasActiveFilters` and `clearFilters` (lines 84-90)**
- Include `applicantTypeFilter !== 'all'` and `scoreSort !== 'none'` in `hasActiveFilters`
- Reset both new states in `clearFilters`

**4. Add new filter controls in the filter bar (after the status Select, around line 202)**

Add an Internal/External select:
```
<Select value={applicantTypeFilter} onValueChange={setApplicantTypeFilter}>
  <SelectTrigger className="w-[140px] h-8 text-sm">
    <SelectValue placeholder="Applicant Type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Types</SelectItem>
    <SelectItem value="internal">Internal</SelectItem>
    <SelectItem value="external">External</SelectItem>
  </SelectContent>
</Select>
```

Add a Score sort select (with `ArrowUpDown` icon imported from lucide-react):
```
<Select value={scoreSort} onValueChange={setScoreSort}>
  <SelectTrigger className="w-[160px] h-8 text-sm">
    <SelectValue placeholder="Sort by Score" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">No Sort</SelectItem>
    <SelectItem value="desc">Score: High to Low</SelectItem>
    <SelectItem value="asc">Score: Low to High</SelectItem>
  </SelectContent>
</Select>
```

**5. Import update (line 3)**
- Add `ArrowUpDown` to the lucide-react import (optional, only if used as an icon prefix)

## Summary
- Two new dropdowns added inline with existing filter controls
- Filtering logic extended in the existing `filteredMatches` memo
- Clear button resets all filters including the new ones
- No new files or dependencies needed

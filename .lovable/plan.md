

# Kanban Card Legacy Design Corrections

## 5 Targeted Changes in `src/components/dashboard/DashboardKanban.tsx`

### 1. Green Border on Card Container for Internal Candidates
- Move the green border from the "Internal" label (line 195) to the card container (line 121-124)
- Card `className` gets conditional: `isInternal && 'border-2 border-green-500'`
- The "Internal" label (line 195) loses `border-2 border-green-500` and becomes plain bold green text: `font-bold text-green-600 text-xs` with logo, no border

### 2. Full-Width Status Bars
- Change the status pills container (lines 158-188) from `flex items-center gap-1 flex-wrap` to stacked full-width bars
- Each status becomes a `w-full` bar styled like the age bar: `rounded-md px-3 py-1.5 text-xs font-medium` with appropriate background colors
- Tech and offer statuses render as individual full-width rows (not inline pills)

### 3. Darker Inner Borders
- Age bar (line 145): change `border-green-100` to `border-green-200`
- Status bars: use `border-gray-300` (or `border-emerald-300`/`border-red-300` for pass/fail) instead of `border-gray-200`/`border-emerald-200`

### 4. Larger Action Icons
- Lines 210, 218, 226: change icon size from `w-3.5 h-3.5` to `w-5 h-5`

### 5. Compact Padding
- Card container (line 122): change `p-4` to `px-3 py-3`

## Technical Summary

All changes are in one file: `src/components/dashboard/DashboardKanban.tsx`, lines 117-237 (the `CompactKanbanCard` normal render section).

**Line 121-124** -- Card container class:
```
cn(
  'kanban-card bg-white shadow-sm rounded-lg px-3 py-3 cursor-pointer hover:shadow-md transition-shadow',
  isInternal ? 'border-2 border-green-500' : 'border border-gray-200',
  isDragging && 'shadow-lg ring-2 ring-primary opacity-90'
)
```

**Line 145** -- Age bar border:
```
border-green-200  (was border-green-100)
```

**Lines 158-188** -- Status bars become full-width stacked:
```
{isInTechInterview && (
  <div className={cn('mt-2 w-full rounded-md px-3 py-1.5 text-xs font-medium border', ...)}>
    Tech: Pass/Fail/Pending
  </div>
)}
{isInOffer && (
  <div className={cn('mt-2 w-full rounded-md px-3 py-1.5 text-xs font-medium border', ...)}>
    Offer: Accepted/Rejected/Pending
  </div>
)}
```
With darker borders: `border-emerald-300` for pass/accepted, `border-red-300` for fail/rejected, `border-gray-300` for pending.

**Lines 194-199** -- Internal label simplified:
```
<div className="inline-flex items-center gap-1 text-green-600 font-bold text-xs">
  <img src={existLogo} alt="Internal" className="w-3.5 h-3.5 object-contain" />
  Internal
</div>
```

**Lines 210, 218, 226** -- Icons enlarged:
```
w-5 h-5  (was w-3.5 h-3.5)
```

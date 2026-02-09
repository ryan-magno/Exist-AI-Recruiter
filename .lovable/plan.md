

# Kanban Card Redesign -- "Legacy" Layout

## Overview
Completely restyle the `CompactKanbanCard` component to follow the specified hierarchy and visual design. The `getStageAge` helper will also be split to return separate "age text" and "date text" values for the two-column green bar.

## Changes

### File: `src/components/dashboard/DashboardKanban.tsx`

**1. Update `getStageAge` helper (lines 37-50)**
Split it to return an object `{ ageText, dateText }` instead of a single string, so the green bar can show "Moved today" on the left and "Since Feb 8" on the right separately.

```text
{ ageText: "Moved today" | "2d ago" | ..., dateText: "Since Feb 8" | "" }
```

**2. Import `Calendar` icon (line 14)**
Add `Calendar` to the lucide-react import for the right side of the green bar.

**3. Redesign `CompactKanbanCard` normal render (lines 118-235)**

New layout structure:

```text
+--------------------------------------------------+
| [::] Drag Handle  |  Candidate Name  |  [73]     |  <-- Header row
+--------------------------------------------------+
| [Clock] Moved today          [Cal] Since Feb 8   |  <-- Green bar (full-width)
+--------------------------------------------------+
| [Tech: Pending]                                   |  <-- Status pill (conditional)
+--------------------------------------------------+
| [Internal] tag             [Clock] [Mail] [Trash] |  <-- Footer row
+--------------------------------------------------+
```

Specific styling changes:
- **Card container**: Always `bg-white border border-gray-200 shadow-sm rounded-lg p-4` regardless of internal/external status. Remove the green tint for internal candidates.
- **Header row**: `flex items-center gap-2` with drag handle (`text-gray-400`), name (`font-semibold text-gray-900 truncate`), and score badge using existing `match-score-*` classes.
- **Green bar**: `bg-green-50 border border-green-100 text-green-700 rounded-md px-3 py-1.5 flex items-center justify-between text-xs mt-2`. Left: Clock icon + age text. Right: Calendar icon + date label.
- **Status pills** (tech/offer): Kept as-is with conditional logic, rendered below the green bar with `mt-2`.
- **Footer row**: `flex items-center justify-between mt-3 pt-2 border-t border-gray-100`.
  - Left: Internal tag styled as `bg-white border-2 border-green-500 text-green-600 font-bold text-xs px-2 py-0.5 rounded` with Exist logo. External candidates show no tag.
  - Right: 3 icon buttons with `gap-3` -- History (Clock), Email (Mail), Delete (Trash with `text-red-400 hover:text-red-600`).

**4. Keep all existing functionality intact**
- Drag-and-drop behavior unchanged
- Timeline expandable section unchanged
- Processing/failed states unchanged
- Tech interview badge in tech_interview column, offer badge in offer column
- Score color classes (`match-score-high/medium/low`) still applied

## Technical Details

- Modify `getStageAge` return type from `string` to `{ ageText: string; dateText: string }`
- Update all usages of `stageAge` (in `CompactKanbanCard`) to destructure the new object
- Add `Calendar` to lucide-react imports
- Replace lines 118-227 with the new card layout
- No new files or dependencies needed


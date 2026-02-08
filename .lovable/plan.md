

# Kanban Card Redesign with Tech/Offer Status Display

## Problem
1. Tech interview and offer statuses are not visible on kanban cards because the current code filters out "pending" results, meaning only pass/fail are shown
2. The card layout doesn't match the reference design (stage age should be in a styled pill, action buttons in a different arrangement)

## Changes

### File: `src/components/dashboard/DashboardKanban.tsx`

**1. Show tech/offer status badges including "pending" state**
- Remove the `!== 'pending'` filter so tech interview status always shows when in the tech_interview column
- Show offer status always when in the offer column (already works but may have no data)
- Add a fallback: if `techInterviewResult` is undefined or pending, show "Tech: Pending" in a neutral style
- Similarly for offer: show "Offer: Pending" if in offer stage but no offer status set

**2. Redesign card layout to match reference image**
- Row 1: Drag handle + Name + Score badge (with color classes)
- Row 2: Stage age in a green-tinted pill with clock and calendar icons (matching the reference)
- Row 3: Internal/External badge + Tech/Offer status badge (stage-specific) + Action buttons (timeline, email, chat placeholder area, trash)
- Action buttons displayed inline in a row, trash on the right with `ml-auto`

**3. Stage-specific status badge logic**
- In `tech_interview` column: Always show tech interview result (pending/pass/fail/conditional)
- In `offer` column: Only show offer status (pending/accepted/rejected/withdrawn), hide tech result
- In other columns: No status badges shown

## Technical Details

The `CompactKanbanCard` component (lines 61-228) will be updated:

- **Lines 149-183** (Row 2 section): Restructure to show stage age as a styled pill with icons, matching the green background in the reference
- **Lines 152-153**: Remove `candidate.techInterviewResult !== 'pending'` condition; instead always show when `isInTechInterview` is true
- **Lines 164**: Add fallback for undefined offerStatus when in offer stage
- Stage age display (lines 185-188): Move into the styled green pill row
- Action buttons row: Keep timeline, email, trash; laid out horizontally matching the reference


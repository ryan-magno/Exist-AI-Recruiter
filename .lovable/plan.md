

# Reduce Internal Candidate Kanban Card Border Intensity

## What Changes
One small styling tweak in `src/components/dashboard/DashboardKanban.tsx`:

Change the internal candidate card border from `border-2 border-green-500` (thick, intense green) to `border border-green-400` (standard 1px width, slightly softer green) -- matching the weight of the selected job order's `border-primary` style.

## Technical Detail

In the `CompactKanbanCard` component, update the card container's conditional class:

**Before:** `isInternal ? 'border-2 border-green-500' : 'border border-gray-200'`

**After:** `isInternal ? 'border border-green-400' : 'border border-gray-200'`

This makes both borders use the same `border` (1px) width, with a softer green tone (`green-400` instead of `green-500`).

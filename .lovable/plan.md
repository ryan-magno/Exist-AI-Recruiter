
# Candidate Profile: Full-Pane, Edge-to-Edge Display

## Problem
When opening a candidate profile from the Kanban board, the "X Matched Candidates" header and filter/sort bar remain visible above the profile. The profile also has gaps/padding around it instead of stretching edge-to-edge.

## Solution
Lift the selected candidate state from `DashboardKanban` up to `DashboardPage`. When a candidate is selected, render the `CandidateProfileView` directly in the right pane, replacing everything (JO detail, filters, and kanban) -- with no padding, borders, or gaps.

## Changes

### File: `src/pages/DashboardPage.tsx`

1. **Add state and import**: Import `CandidateProfileView` and `Candidate` type. Add `selectedCandidate` state.

2. **Conditional rendering in right pane**: When `selectedCandidate` is set, render `CandidateProfileView` directly (no wrapper padding, no border) instead of the JO detail + filters + kanban. The profile fills the entire right pane edge-to-edge.

3. **Pass callback to DashboardKanban**: Pass an `onSelectCandidate` prop so the kanban can notify the parent when a candidate is clicked.

### File: `src/components/dashboard/DashboardKanban.tsx`

1. **Accept `onSelectCandidate` prop**: Add an optional `onSelectCandidate` callback prop.

2. **Remove inline profile rendering**: Remove the `if (selectedCandidate) return <CandidateProfileView ...>` block (lines 353-355). Instead, when a candidate is clicked, call `onSelectCandidate` if provided (falling back to internal state if not).

3. **Remove internal `selectedCandidate` state** since it's now managed by the parent.

## Result
- Clicking a kanban card opens the candidate profile covering the entire right pane (over the "Matched Candidates" header and filters)
- The profile has zero padding/gaps -- it sticks to all edges of the pane
- The back button returns to the normal JO detail + kanban view

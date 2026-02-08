

# Fix All Legacy String References to Match New Database Schema

## Overview
All errors stem from one root cause: the frontend code still uses old enum string values (e.g., `'new-match'`, `'hr-interview'`, `'in-progress'`, `'draft'`, `'fulfilled'`, `'proceed-to-tech'`, `'reject'`, `'hold'`) while the types were updated to match the new database enums. This plan fixes every affected file.

## Files to Update

### 1. `src/context/AppContext.tsx` (11 errors)
- **Lines 19-28**: Remove the `dbStatusToLegacy` mapping entirely. Use DB status values directly since `PipelineStatus` is now `'hr_interview' | 'tech_interview' | 'offer' | 'hired' | 'rejected'`.
- **Line 137**: Change fallback from `'new-match'` to `'hr_interview'`
- **Line 155**: Change `'full-time'` to `'full_time'`
- **Line 159**: Replace `currentOccupation` with `currentPosition` and `currentCompany` fields (from `current_position` and `current_company`)
- **Line 225**: Change `'regular'` to `'full_time'` in employment type mapping
- **Line 249**: Remove `'fulfilled'` -- use `'closed'` instead
- **Lines 282-288**: Update `legacyToDbStatus` mapping to identity map (since legacy = DB now): `hr_interview -> hr_interview`, `tech_interview -> tech_interview`, etc.
- **Line 385, 411**: Change `'full-time'` to `'full_time'` in employment type checks
- **Line 409**: Change default status from `'draft'` to `'open'`
- **Line 435**: Change `'in-progress'` to `'open'` in unarchive

### 2. `src/components/dashboard/DashboardKanban.tsx` (5 errors)
- **Lines 31, 33-48**: Update `OfferStatus` type to match new enum: remove `'negotiating'`/`'unresponsive'`, add `'withdrawn'`/`'expired'`
- **Lines 52-58**: Update column IDs: `'new-match'` -> `'hr_interview'`, `'hr-interview'` -> `'tech_interview'`
- **Line 131**: Update `'new-match'` check to `'hr_interview'`

### 3. `src/components/dashboard/KanbanBoard.tsx` (2 errors)
- **Lines 24-25**: Update column IDs: `'new-match'` -> `'hr_interview'`, `'hr-interview'` -> `'tech_interview'`

### 4. `src/components/dashboard/KanbanCard.tsx` (1 error)
- **Line 182**: Change `'negotiating'` to `'withdrawn'` in offer status color check

### 5. `src/components/dashboard/JobOrderDetail.tsx` (4 errors)
- **Lines 95-98**: Update status color mapping: `'in-progress'` -> `'open'`, `'fulfilled'` -> `'closed'` (or remove), `'draft'` -> `'on_hold'` or remove
- **Line 166**: Change `'fulfilled'` check to `'closed'`

### 6. `src/components/dashboard/JobOrderList.tsx` (2 errors)
- **Line 47**: Change `'new-match'` to `'hr_interview'`
- **Line 48**: Change `'hr-interview'` to `'tech_interview'`

### 7. `src/components/candidate/CandidateProfileView.tsx` (6 errors)
- **Line 33**: Update `isTechStageOrBeyond` check: `'hr-interview'` -> `'tech_interview'`
- **Line 218**: Change `'in-progress'` -> `'open'`, `'draft'` -> `'open'` or `'pooling'`
- **Lines 330-331**: Replace `candidate.currentOccupation` with `candidate.currentPosition` and `candidate.currentCompany`
- **Line 392**: Replace `experience.startDate`/`experience.endDate` with `experience.duration`

### 8. `src/components/candidate/HRInterviewFormTab.tsx` (7 errors)
- **Line 63**: Change verdict `'proceed-to-tech'` to `'pass'`, status `'new-match'` to `'hr_interview'`
- **Line 64**: Change `'hr-interview'` to `'tech_interview'`
- **Line 66**: Change `'reject'` to `'fail'`
- **Lines 339-341**: Update verdict color checks: `'proceed-to-tech'` -> `'pass'`, `'hold'` -> `'conditional'`, `'reject'` -> `'fail'`

### 9. `src/components/candidate/TechInterviewFormTab.tsx` (6 errors)
- **Line 57**: Change verdict `'proceed-to-offer'` to `'pass'`, status `'hr-interview'` to `'tech_interview'`
- **Line 61**: Change `'reject'` to `'fail'`
- **Lines 239-241**: Update verdict color checks: `'proceed-to-offer'` -> `'pass'`, `'hold'` -> `'conditional'`, `'reject'` -> `'fail'`

### 10. `src/components/dashboard/CandidateTimeline.tsx` (6 errors)
- **Lines 11-22**: Update `pipelineStatusLabels` record to use new enum values: remove `'new'`, `'screening'`, `'for_hr_interview'`, `'for_tech_interview'`, `'withdrawn'`; use `'hr_interview'`, `'tech_interview'`, etc.
- **Lines 29-44**: Update `getStatusColor` switch cases to match new enum values

### 11. `src/pages/AnalyticsPage.tsx` (4 errors)
- **Line 55**: Change `'in-progress'`/`'draft'` to `'open'`/`'pooling'`
- **Lines 73-74**: Change `'new-match'` to `'hr_interview'`, `'hr-interview'` to `'tech_interview'`

### 12. `src/pages/ArchivePage.tsx` (2 errors)
- **Line 12**: Change `'fulfilled'` to `'archived'` in the filter
- **Line 58**: Update status badge check for `'fulfilled'` -> `'archived'` or `'closed'`

### 13. `src/pages/CandidatesPage.tsx` (1 error)
- **Line 48**: Change `'draft'`/`'in-progress'` to `'open'`/`'pooling'`/`'on_hold'`

### 14. `src/components/candidate/OfferFormTab.tsx` (minor)
- **Line 16**: Update `OfferStatus` type: remove `'negotiating'`/`'unresponsive'`, add `'withdrawn'`/`'expired'`
- **Lines 30+**: Update labels and colors to match

## Technical Notes

- The `Candidate` interface in `mockData.ts` already has `currentPosition` and `currentCompany` fields. The `currentOccupation` property was removed.
- The `WorkExperience` interface already uses `duration` (string) instead of `startDate`/`endDate`.
- The `dbStatusToLegacy` / `legacyToDbStatus` mappings in AppContext become identity mappings and can be simplified since frontend types now match DB enums directly.
- The `employmentType` mapping `'full-time'` / `'regular'` is replaced with `'full_time'` / `'part_time'` / `'contract'` throughout.


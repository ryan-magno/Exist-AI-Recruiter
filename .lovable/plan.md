

# Database Recreation and Frontend Alignment Plan

## Overview
Run the provided SQL script on the Azure PostgreSQL database to recreate all tables with updated schema, then update the edge function and frontend code to align with the new enum values, column names, and table structure.

## Key Schema Changes (Old vs New)

| Area | Old | New |
|------|-----|-----|
| Pipeline status enum | `pipeline_status` with values: new, screening, for_hr_interview, for_tech_interview, offer, hired, rejected, withdrawn | `pipeline_status_enum` with values: hr_interview, tech_interview, offer, hired, rejected |
| Job status enum | `job_order_status`: draft, in-progress, fulfilled, closed | `job_status_enum`: open, closed, on_hold, pooling, archived |
| Employment type enum | `employment_type`: consultant, project-based, regular | `employment_type_enum`: full_time, part_time, contract |
| HR/Tech verdict enum | `hr_verdict` / `tech_verdict` (separate) | `interview_verdict_enum` (unified): pass, fail, conditional, pending |
| Offer status enum | `offer_status`: pending, accepted, rejected, negotiating, unresponsive | `offer_status_enum`: pending, accepted, rejected, withdrawn, expired |
| Tech interview result | `tech_interview_result` enum on applications | Uses `interview_verdict_enum` on applications |
| Candidate columns | `current_occupation` (single field), `target_role`, `target_role_source` | `current_position`, `current_company` (split), plus new fields: `qualification_score`, `batch_id`, `batch_created_at`, `google_drive_file_id`, `google_drive_file_url`, `preferred_employment_type`, `internal_upload_reason`, `internal_from_date`, `internal_to_date` |
| Work experience | Has `start_date`, `end_date`, `is_current` columns | Has `duration` (text), `key_projects` (JSONB instead of TEXT[]), no start/end/is_current |
| Applications | `status_changed_date` present | `status_changed_date` present but nullable |

## Implementation Steps

### Step 1: Run the SQL Script on Azure PostgreSQL
- Add a new `/recreate-db` endpoint to the edge function that executes the full SQL script
- Call this endpoint to drop and recreate all tables
- This will DELETE ALL existing data (user must be aware)

### Step 2: Update Edge Function (`supabase/functions/azure-db/index.ts`)

**2a. Update `initTables()` function**
- Replace old enum definitions with new ones (`pipeline_status_enum`, `job_status_enum`, `employment_type_enum`, `interview_verdict_enum`, `offer_status_enum`, `applicant_type_enum`, `job_level_enum`)
- Update all CREATE TABLE statements to match new schema

**2b. Update column whitelists**
- `ALLOWED_CANDIDATE_COLUMNS`: Replace `current_occupation` with `current_position`, `current_company`; remove `target_role`, `target_role_source`; add `qualification_score`, `preferred_employment_type`, `internal_upload_reason`, `internal_from_date`, `internal_to_date`, `google_drive_file_id`, `google_drive_file_url`, `batch_id`, `batch_created_at`
- `ALLOWED_APPLICATION_COLUMNS`: Add `employment_type`; change `tech_interview_result` to use `interview_verdict_enum` values
- `ALLOWED_JOB_ORDER_COLUMNS`: Update for new enum values

**2c. Update all SQL queries**
- Job Orders: Default status `'open'` instead of `'draft'`; employment type values `full_time/part_time/contract` instead of `consultant/project-based/regular`
- Applications: Default pipeline status `'hr_interview'` instead of `'new'`; `tech_interview_result` uses `interview_verdict_enum` values
- Candidates: Split `current_occupation` into `current_position` and `current_company`
- Work Experience: Remove `start_date`, `end_date`, `is_current`; use `duration` (text) and `key_projects` (JSONB)
- HR Interviews: verdict uses `interview_verdict_enum` instead of `hr_verdict`
- Tech Interviews: verdict uses `interview_verdict_enum` instead of `tech_verdict`
- Offers: status uses `offer_status_enum` with values `pending/accepted/rejected/withdrawn/expired`
- Timeline: uses `pipeline_status_enum` values

**2d. Update webhook callback handler**
- Update candidate insert/update queries for new column names
- Update work experience inserts (no `is_current`, `key_projects` as JSONB)
- Update application creation to use `'hr_interview'` default status

**2e. Update seed data**
- Job orders use `'open'` status and `'full_time'`/`'contract'` employment types

### Step 3: Update Frontend Hooks

**3a. `src/hooks/useJobOrders.ts`**
- Change `JobOrder.employment_type` to `'full_time' | 'part_time' | 'contract'`
- Change `JobOrder.status` to `'open' | 'closed' | 'on_hold' | 'pooling' | 'archived'`

**3b. `src/hooks/useApplications.ts`**
- Change `PipelineStatus` to `'hr_interview' | 'tech_interview' | 'offer' | 'hired' | 'rejected'`
- Change `TechInterviewResult` to `'pending' | 'pass' | 'fail' | 'conditional'`
- Add `employment_type` to `Application` interface

**3c. `src/hooks/useInterviews.ts`**
- Unify `HRVerdict` and `TechVerdict` to use `'pass' | 'fail' | 'conditional' | 'pending'`

**3d. `src/hooks/useOffers.ts`**
- Change `OfferStatus` to `'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired'`

**3e. `src/hooks/useCandidates.ts`**
- Replace `current_occupation` with `current_position` and `current_company`
- Remove `target_role`, `target_role_source`
- Add `qualification_score`, `preferred_employment_type`, `internal_upload_reason`, `internal_from_date`, `internal_to_date`, `google_drive_file_id`, `google_drive_file_url`

**3f. `src/hooks/useTimeline.ts`**
- Update `PipelineStatus` type to match new enum

### Step 4: Update Frontend Data Layer

**4a. `src/data/mockData.ts`**
- Update `PipelineStatus` type: remove `'new-match'`, `'hr-interview'`; use `'hr_interview'`, `'tech_interview'`
- Update `EmploymentType`: `'full_time' | 'part_time' | 'contract'`
- Update `HRVerdict` and `TechVerdict` to use unified `'pass' | 'fail' | 'conditional' | 'pending'`
- Update `JobOrder.status` to `'open' | 'closed' | 'on_hold' | 'pooling' | 'archived'`
- Update all label maps and color maps
- Update or remove mock data arrays to match new types

**4b. `src/lib/azureDb.ts`**
- No structural changes needed (just passes data through)

### Step 5: Update Frontend Context

**5a. `src/context/AppContext.tsx`**
- Remove the `dbStatusToLegacy` / `legacyToDbStatus` mapping -- use DB status values directly throughout
- Update `refreshCandidates` to map `current_position`/`current_company` instead of `current_occupation`
- Update job order status mappings: `'open'` instead of `'in-progress'`, `'archived'` instead of `'closed'` for archive
- Update `unarchiveJobOrder` to restore to `'open'` instead of `'in-progress'`

### Step 6: Update UI Components

**6a. `src/components/dashboard/KanbanBoard.tsx`**
- Update column IDs to match new pipeline statuses: `hr_interview`, `tech_interview`, `offer`, `hired`, `rejected`

**6b. `src/components/dashboard/KanbanCard.tsx`**
- Update tech interview result display for new verdict values
- Update offer status display for `withdrawn`/`expired` instead of `negotiating`/`unresponsive`

**6c. `src/components/candidate/CandidateProfileView.tsx`**
- Update any status checks to use new enum values
- Display `current_position` and `current_company` separately

**6d. `src/components/candidate/HRInterviewFormTab.tsx`**
- Update verdict options to use unified `interview_verdict_enum` values

**6e. `src/components/candidate/TechInterviewFormTab.tsx`**
- Update verdict options to use unified `interview_verdict_enum` values

**6f. `src/components/candidate/OfferFormTab.tsx`**
- Update status options: replace `negotiating`/`unresponsive` with `withdrawn`/`expired`

**6g. `src/pages/CreateJOPage.tsx`**
- Update employment type options to `full_time`, `part_time`, `contract`
- Update default status to `'open'`

**6h. `src/components/modals/EditJobOrderModal.tsx`**
- Update status and employment type options

**6i. `src/pages/CandidatesPage.tsx`**
- Update filtering logic for new job order statuses (`'open'` instead of `'in-progress'`/`'draft'`)

**6j. `src/pages/ArchivePage.tsx`**
- Update archive status to use `'archived'` and `'closed'`

**6k. `src/components/dashboard/JobOrderList.tsx` and `JobOrderDetail.tsx`**
- Update status labels and colors for new statuses (`open`, `on_hold`, `pooling`, `archived`, `closed`)

## Technical Considerations

- **Data loss warning**: The script drops all tables with CASCADE. All existing data will be lost. This is a full reset.
- **Enum type naming**: The new script uses `_enum` suffix (e.g., `pipeline_status_enum`), which differs from the old bare names. The edge function SQL must reference these new type names.
- **Work experience simplification**: The new schema drops `start_date`/`end_date`/`is_current` in favor of a single `duration` text field and `key_projects` as JSONB instead of TEXT[].
- **Unified interview verdict**: Both HR and Tech interviews now share the same `interview_verdict_enum`, simplifying form logic.
- **Application employment_type**: Each application can now have its own `employment_type`, independent of the job order.

## Order of Execution
1. Run the SQL recreation script via edge function endpoint
2. Deploy updated edge function with new schema alignment
3. Update all frontend hooks and types
4. Update all UI components
5. Test end-to-end: create JO, view candidates, drag kanban, fill forms, check timeline


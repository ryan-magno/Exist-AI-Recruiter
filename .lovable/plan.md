

# Database Integration Plan

This plan will connect your application to the database so that all data (job orders, candidates, interviews, etc.) is persisted and any new data is automatically saved.

## Current State

The app currently uses:
- **Mock data** stored in `src/data/mockData.ts` (hardcoded candidates and job orders)
- **React Context** (`AppContext.tsx`) that loads mock data into state on app start
- All changes are lost on page refresh since nothing is saved to the database

## What Will Change

After implementation:
- Data will be loaded from the database on app start
- All create/update/delete operations will save to the database immediately
- Data persists across sessions and page refreshes

---

## Implementation Steps

### Step 1: Create Database Hook Files

Create custom React hooks to interact with each database table:

| Hook File | Purpose |
|-----------|---------|
| `src/hooks/useJobOrders.ts` | Fetch, create, update, delete job orders |
| `src/hooks/useCandidates.ts` | Fetch, create, update candidates |
| `src/hooks/useApplications.ts` | Manage candidate-job application links |
| `src/hooks/useInterviews.ts` | HR and Tech interview CRUD operations |
| `src/hooks/useDepartments.ts` | Fetch department options |
| `src/hooks/useCVUploaders.ts` | Fetch and add CV uploader names |

Each hook will use **TanStack React Query** (already installed) for:
- Automatic caching
- Background refetching
- Loading and error states

### Step 2: Update the App Context

Modify `src/context/AppContext.tsx` to:
1. Remove mock data initialization
2. Use the database hooks to fetch real data
3. Update all mutation functions (e.g., `addJobOrder`, `updateCandidatePipelineStatus`) to call database operations
4. Add loading states for the initial data fetch

### Step 3: Update Create Job Order Page

Modify `src/pages/CreateJOPage.tsx`:
- Generate JO numbers based on database count (not local array length)
- Call database insert when form is submitted
- Fetch departments from the database for the dropdown

### Step 4: Update CV Upload Page

Modify `src/pages/UploadPage.tsx`:
- Fetch existing uploader names from `cv_uploaders` table
- Save new uploader names to the database
- When CVs are processed, create candidate records in the database

### Step 5: Update Candidate Forms

Modify `HRInterviewFormTab.tsx` and `TechInterviewFormTab.tsx`:
- Save interview forms to `hr_interviews` and `tech_interviews` tables
- Update candidate profile fields when HR form is saved
- Update pipeline status in the database when verdict is selected

### Step 6: Update Kanban Board

Modify `KanbanBoard.tsx` and related components:
- Drag-and-drop status changes update the `candidate_job_applications` table
- Pipeline status changes create timeline entries in `candidate_timeline` table
- Candidate cards display real-time database data

### Step 7: Seed Initial Data (Optional)

If you want the existing mock data to appear:
- Create a one-time migration to insert the mock candidates and job orders
- This gives you sample data to work with immediately

---

## Technical Details

### Database Table Mappings

```text
+----------------------+     +---------------------------+
|     job_orders       |     |        candidates         |
+----------------------+     +---------------------------+
| id, jo_number, title |     | id, full_name, email      |
| department_name      |     | skills[], cv_url          |
| level, quantity      |     | educational_background    |
| status, hired_count  |     | years_of_experience       |
+----------------------+     +---------------------------+
          |                            |
          |   +------------------------+
          |   |
          v   v
+----------------------------------+
|   candidate_job_applications     |
+----------------------------------+
| id, candidate_id, job_order_id   |
| pipeline_status, match_score     |
| tech_interview_result, remarks   |
+----------------------------------+
          |
          v
+-------------------+     +-------------------+
|   hr_interviews   |     |  tech_interviews  |
+-------------------+     +-------------------+
| application_id    |     | application_id    |
| candidate_id      |     | candidate_id      |
| ratings (1-5)     |     | ratings (1-5)     |
| verdict           |     | verdict           |
+-------------------+     +-------------------+
```

### Example Hook Structure

```typescript
// src/hooks/useJobOrders.ts
export function useJobOrders() {
  return useQuery({
    queryKey: ['job-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateJobOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newJO) => {
      const { data, error } = await supabase
        .from('job_orders')
        .insert(newJO)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
    }
  });
}
```

### Data Type Mapping

| Mock Data Type | Database Enum |
|----------------|---------------|
| `PipelineStatus` | `pipeline_status` |
| `EmploymentType` | `employment_type` |
| `Level` | `job_level` |
| `HRVerdict` | `hr_verdict` |
| `TechVerdict` | `tech_verdict` |

---

## Files to Create

1. `src/hooks/useJobOrders.ts`
2. `src/hooks/useCandidates.ts`
3. `src/hooks/useApplications.ts`
4. `src/hooks/useInterviews.ts`
5. `src/hooks/useDepartments.ts`
6. `src/hooks/useCVUploaders.ts`
7. `src/hooks/useTimeline.ts`

## Files to Modify

1. `src/context/AppContext.tsx` - Use database hooks instead of mock data
2. `src/pages/CreateJOPage.tsx` - Database integration
3. `src/pages/UploadPage.tsx` - Database integration
4. `src/components/candidate/HRInterviewFormTab.tsx` - Save to database
5. `src/components/candidate/TechInterviewFormTab.tsx` - Save to database
6. `src/components/dashboard/KanbanBoard.tsx` - Database status updates
7. `src/data/mockData.ts` - Keep only type definitions and labels (remove mock data arrays)

---

## Expected Outcome

After implementation:
- Opening the app loads data from the database
- Creating a job order saves it to `job_orders` table
- Uploading CVs creates records in `candidates` table
- Moving candidates on the Kanban board updates `candidate_job_applications`
- Saving HR/Tech forms creates records in respective interview tables
- All data persists across browser sessions


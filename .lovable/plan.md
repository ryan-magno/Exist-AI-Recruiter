

# Store and Display Webhook Candidate Data

## Summary
Extend the Azure PostgreSQL database to store the rich AI-extracted candidate data from the n8n webhook, then populate the existing frontend views with real data instead of mock data. The UI structure remains unchanged - we're just connecting it to actual data.

---

## Data Mapping: Webhook → Database → Frontend

| Webhook Field | Database Column | Frontend Field |
|---------------|-----------------|----------------|
| `candidate_info.full_name` | `candidates.full_name` | `candidate.name` |
| `candidate_info.email` | `candidates.email` | `candidate.email` |
| `candidate_info.phone` | `candidates.phone` | `candidate.phone` |
| `candidate_info.linkedin` | `candidates.linkedin` *(new)* | `candidate.linkedIn` |
| `candidate_info.years_of_experience` | `candidates.years_of_experience_text` *(new)* | `experienceDetails.breakdown` |
| `candidate_info.current_occupation.title/company` | `candidates.current_occupation` *(new)* | `candidate.currentOccupation` |
| `target_role.position` | `candidates.target_role` *(new)* | `positionApplied` |
| `target_role.source` | `candidates.target_role_source` *(new)* | (internal use) |
| `qualification_score` | `candidate_job_applications.match_score` | `matchScore` |
| `overall_summary` | `candidates.overall_summary` *(new)* | `matchAnalysis.summary` |
| `strengths[]` | `candidates.strengths` *(new, TEXT[])* | `matchAnalysis.strengths` |
| `weaknesses[]` | `candidates.weaknesses` *(new, TEXT[])* | `matchAnalysis.weaknesses` |
| `key_skills[]` | `candidates.skills` | `keySkills` |
| `education[]` | `candidate_education` *(new table)* | `educationalBackground` |
| `certifications[]` | `candidate_certifications` *(new table)* | (displayed in profile) |
| `work_history.work_experience[]` | `candidate_work_experience` | `workExperiences` |

---

## Database Changes

### 1. Add columns to `candidates` table

```sql
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS current_occupation TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS years_of_experience_text TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS target_role TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS target_role_source TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS overall_summary TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS strengths TEXT[];
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS weaknesses TEXT[];
```

### 2. Add columns to `candidate_work_experience` table

```sql
ALTER TABLE candidate_work_experience ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE candidate_work_experience ADD COLUMN IF NOT EXISTS key_projects TEXT[];
```

### 3. Create `candidate_education` table

```sql
CREATE TABLE IF NOT EXISTS candidate_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Create `candidate_certifications` table

```sql
CREATE TABLE IF NOT EXISTS candidate_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## API Changes (azure-db Edge Function)

### New Endpoint: `POST /candidates/from-webhook`

Receives the full webhook output and creates:
1. Candidate record with all extracted fields
2. Education records
3. Certification records  
4. Work experience records
5. Job application (if job order was specified)

**Request:**
```json
{
  "webhook_output": { /* the output object from webhook */ },
  "uploader_name": "Gabriel Magno",
  "applicant_type": "external",
  "job_order_id": "uuid-or-null",
  "internal_metadata": { /* from_date, to_date, department, upload_reason */ }
}
```

**Processing Flow:**
1. Insert into `candidates` with AI-extracted data
2. For each `education[]` entry → insert into `candidate_education`
3. For each `certifications[]` entry → insert into `candidate_certifications`
4. For each `work_history.work_experience[]` entry → insert into `candidate_work_experience`
5. If `job_order_id` provided → create `candidate_job_applications` with `qualification_score`
6. Return the created candidate with all related data

### Update: `GET /candidates/:id`

Return candidate joined with education, certifications, and work experiences for profile display.

---

## Frontend Changes

### 1. `src/pages/UploadPage.tsx`

After webhook responds, iterate and store each candidate:

```typescript
const result = await response.json();

for (let i = 0; i < result.length; i++) {
  const output = result[i].output;
  const fileMeta = metadata[i];
  
  await azureDb.candidates.createFromWebhook({
    webhook_output: output,
    uploader_name: uploaderName,
    applicant_type: fileMeta.applicant_type,
    job_order_id: fileMeta.applying_for?.job_order_id || null,
    internal_metadata: fileMeta.applicant_type === 'internal' ? {
      from_date: fileMeta.from_date,
      to_date: fileMeta.to_date,
      department: fileMeta.department,
      upload_reason: fileMeta.upload_reason
    } : null
  });
}
```

### 2. `src/lib/azureDb.ts`

Add new API method:

```typescript
candidates: {
  // ... existing
  createFromWebhook: (data: any) => 
    apiCall<any>('/candidates/from-webhook', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
}
```

### 3. `src/hooks/useCandidates.ts`

Update `Candidate` interface to include new fields:

```typescript
export interface Candidate {
  // ... existing fields
  linkedin: string | null;
  current_occupation: string | null;
  years_of_experience_text: string | null;
  target_role: string | null;
  overall_summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  education: CandidateEducation[];
  certifications: CandidateCertification[];
  work_experiences: CandidateWorkExperience[];
}
```

### 4. `src/context/AppContext.tsx`

Map database fields to the existing `Candidate` type used by UI:

```typescript
// Transform DB candidate to UI candidate
const mapDbToUiCandidate = (dbCandidate: DbCandidate): Candidate => ({
  id: dbCandidate.id,
  name: dbCandidate.full_name,
  email: dbCandidate.email || '',
  phone: dbCandidate.phone || '',
  linkedIn: dbCandidate.linkedin || '',
  matchScore: dbCandidate.match_score || 0,  // From application
  // ... map other fields
  matchAnalysis: {
    summary: dbCandidate.overall_summary || '',
    strengths: dbCandidate.strengths || [],
    weaknesses: dbCandidate.weaknesses || [],
  },
  keySkills: dbCandidate.skills || [],
  workExperiences: dbCandidate.work_experiences || [],
  // etc.
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/azure-db/index.ts` | Add new columns in `initTables()`, add `POST /candidates/from-webhook` endpoint, update `GET /candidates/:id` |
| `src/lib/azureDb.ts` | Add `createFromWebhook` method |
| `src/hooks/useCandidates.ts` | Update interfaces with new fields |
| `src/pages/UploadPage.tsx` | Process webhook response, call `createFromWebhook` for each candidate |
| `src/context/AppContext.tsx` | Map database fields to UI `Candidate` type |

---

## Nullable Field Handling

Since webhook data is dynamic:
- All new columns are nullable
- Frontend already shows "Not provided" for null values
- Arrays default to empty `[]` if null
- Sections only render if array has items


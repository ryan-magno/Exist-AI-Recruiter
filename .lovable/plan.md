## Overview
The database schema and backend are already aligned from previous work. The remaining gap is in **data fetching** (the `refreshCandidates` function doesn't pull all new fields from the DB) and **UI display** (the candidate profile doesn't show qualification score, internal fields, education, certifications, or Google Drive links). This plan closes those gaps.

**IMPORTANT CONTEXT:** The application does NOT have candidate-facing forms. All candidate data originates from CV uploads processed by AI, or manual entry by recruiters. There are no "Apply Now" flows or public job application forms.

---

## What's Already Done (No Changes Needed)
- Edge function schema, enums, and column whitelists
- All React Query hooks (types match the new DB schema)
- Pipeline status labels, colors, and kanban columns
- Interview verdict enums (unified)
- Work experience schema (duration text, JSONB key_projects)
- Timeline/history display functionality

---

## CRITICAL: Database Schema Changes

### Score Field Consolidation
**IMPORTANT:** There is only ONE score per candidate: `qualification_score` (AI-generated from CV evaluation).

The `match_score` field in `candidate_job_applications` table is **redundant and should be ignored**.

**What you MUST do:**
- When displaying scores, ONLY use `candidates.qualification_score`
- IGNORE `candidate_job_applications.match_score` completely
- Do NOT fetch or display match_score anywhere in the UI
- All score references should point to qualification_score

**Database query:**
```sql
-- Correct: Only fetch qualification_score
SELECT 
  c.qualification_score  -- This is the ONLY score
FROM candidates c;

-- Wrong: Do NOT use this
SELECT app.match_score FROM candidate_job_applications app;  -- IGNORE THIS FIELD
```

### Removed Field: current_occupation
**BREAKING CHANGE:** The `current_occupation` field no longer exists in the candidates table.

**What you MUST do:**
- Remove ALL references to `current_occupation`
- Fetch `current_position` and `current_company` as separate fields
- Combine them in the UI as: `"{current_position} at {current_company}"`

**Example:**
```typescript
// OLD (will break):
const occupation = candidate.current_occupation;

// NEW (correct):
const occupation = `${candidate.current_position} at ${candidate.current_company}`;
```

---

## What Needs to Be Done

### 1. Enrich `refreshCandidates` in `AppContext.tsx`

The `refreshCandidates` function currently builds `LegacyCandidate` objects but misses several new fields.

**Complete Field Mapping Checklist:**

Map these fields from database to LegacyCandidate interface:

```typescript
// Basic fields (already working)
id: candidate.id
fullName: candidate.full_name
email: candidate.email
phone: candidate.phone

// REMOVE this (field no longer exists):
// currentOccupation: candidate.current_occupation  ❌ DELETE THIS

// ADD these NEW fields:
currentPosition: candidate.current_position              // NEW
currentCompany: candidate.current_company                // NEW
qualificationScore: candidate.qualification_score        // NEW (this is THE score)
overallSummary: candidate.overall_summary                // NEW
strengths: candidate.strengths || []                     // NEW (array)
weaknesses: candidate.weaknesses || []                   // NEW (array)
internalUploadReason: candidate.internal_upload_reason   // NEW
internalFromDate: candidate.internal_from_date           // NEW
internalToDate: candidate.internal_to_date               // NEW
googleDriveFileUrl: candidate.google_drive_file_url      // NEW
googleDriveFileId: candidate.google_drive_file_id        // NEW
preferredEmploymentType: candidate.preferred_employment_type  // NEW
batchId: candidate.batch_id                              // NEW
batchCreatedAt: candidate.batch_created_at               // NEW

// Position applied logic:
positionApplied: app.job_title || candidate.positions_fit_for?.[0] || 'Not specified'
```

**Work Experience, Education, Certifications - Lazy Loading Strategy:**

**CRITICAL:** Do NOT fetch work experiences, education, or certifications in `refreshCandidates()`. This would be too expensive for list views.

**Strategy:**
1. `refreshCandidates()` only fetches candidate + application data (fast for list views)
2. When user opens individual candidate detail view, fetch full data using `azureDb.candidates.getFull(id)`
3. If `getFull` endpoint doesn't exist, create it now

**Create or verify `azureDb.candidates.getFull(id)` endpoint:**

This endpoint should return:
```typescript
{
  candidate: {
    // All candidate fields
    id, full_name, email, current_position, current_company,
    qualification_score, overall_summary, strengths, weaknesses,
    internal_upload_reason, internal_from_date, internal_to_date,
    google_drive_file_url, google_drive_file_id,
    preferred_employment_type, batch_id, batch_created_at,
    // ... all other candidate fields
  },
  education: [
    { degree: "BS Computer Science", institution: "MIT", year: "2020" }
  ],
  certifications: [
    { name: "AWS Certified", issuer: "Amazon", year: "2023" }
  ],
  work_experience: [
    {
      company_name: "Tech Corp",
      job_title: "Senior Developer", 
      duration: "Jan 2020 - Present",  // Text field, NOT dates
      description: "Led development team...",
      key_projects: ["Project A", "Project B"]  // JSONB, returns as array
    }
  ]
}
```

**SQL for getFull endpoint:**
```sql
-- Main candidate data
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.phone,
  c.current_position,           -- NEW: split field
  c.current_company,            -- NEW: split field
  c.qualification_score,        -- NEW: THE score
  c.overall_summary,            -- NEW
  c.strengths,                  -- NEW: array
  c.weaknesses,                 -- NEW: array
  c.internal_upload_reason,     -- NEW (internal only)
  c.internal_from_date,         -- NEW (internal only)
  c.internal_to_date,           -- NEW (internal only)
  c.google_drive_file_url,      -- NEW
  c.google_drive_file_id,       -- NEW
  c.preferred_employment_type,  -- NEW
  c.batch_id,                   -- NEW
  c.batch_created_at,           -- NEW
  c.applicant_type,
  c.skills,
  c.positions_fit_for,
  c.years_of_experience,
  c.years_of_experience_text,
  c.educational_background,
  c.cv_url,
  c.linkedin,
  c.availability,
  c.preferred_work_setup,
  c.expected_salary,
  c.earliest_start_date
FROM candidates c
WHERE c.id = $1;

-- Education records
SELECT 
  degree,
  institution,
  year
FROM candidate_education
WHERE candidate_id = $1
ORDER BY created_at DESC;

-- Certifications
SELECT 
  name,
  issuer,
  year
FROM candidate_certifications
WHERE candidate_id = $1
ORDER BY created_at DESC;

-- Work experience (with JSONB key_projects)
SELECT 
  company_name,
  job_title,
  duration,              -- Text field like "Dec 2024 - Present"
  description,
  key_projects           -- JSONB: returns as JavaScript array directly
FROM candidate_work_experience
WHERE candidate_id = $1
ORDER BY created_at DESC;
```

---

### 2. Extend `Candidate` Interface in `mockData.ts`

Add missing fields to the `Candidate` interface:

```typescript
interface Candidate {
  // Existing fields...
  
  // NEW fields to add:
  currentPosition?: string;           // Replaces current_occupation
  currentCompany?: string;            // Replaces current_occupation
  qualificationScore?: number;        // The ONLY score (0-100)
  overallSummary?: string;            // AI evaluation summary
  strengths?: string[];               // Array of strength points
  weaknesses?: string[];              // Array of weakness points
  internalUploadReason?: string;      // For internal candidates only
  internalFromDate?: string;          // For internal candidates only
  internalToDate?: string;            // For internal candidates only
  googleDriveFileUrl?: string;        // Public Drive link
  googleDriveFileId?: string;         // Drive file ID
  preferredEmploymentType?: string;   // Candidate's employment preference
  batchId?: string;                   // Processing batch UUID
  batchCreatedAt?: string;            // Batch timestamp
  positionsFitFor?: string[];         // Roles candidate qualifies for
  education?: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    year?: string;
  }>;
  
  // REMOVE this field (no longer exists):
  // currentOccupation?: string;  ❌ DELETE THIS
}
```

---

### 3. Update `CandidateProfileView.tsx` - Profile Tab

**IMPORTANT:** Adapt these changes to fit the existing UI structure. Do NOT rebuild the entire profile page. Only add new sections where they fit naturally into the current layout.

**A. Qualification Score Badge**
- Display prominently next to candidate name in the header area
- Show as a colored badge: `XX/100`
- Color coding:
  - Green (80-100): Excellent match
  - Amber (60-79): Good match
  - Red (0-59): Needs review
- If `qualification_score` is null, show "Not evaluated" or hide the badge

**A.1. AI Overall Summary**
- Display below or near the qualification score
- Show as a text paragraph in an info card or section
- Only render if `candidate.overallSummary` exists
- Label: "AI Evaluation Summary" or "Summary"
- Style: Standard text paragraph, not a list

**B. Internal Candidate Section (Conditional)**
- **CRITICAL:** Only render when `candidate.applicantType === 'internal'`
- Must be completely hidden for external candidates
- Display in a distinct info card with blue accent or border
- Show three fields:
  1. **Upload Reason:** `{internal_upload_reason}`
  2. **Available From:** `{formatted internal_from_date}`
  3. **Available To:** `{formatted internal_to_date}`
- **Date Format:** Display as range: "February 20, 2026 to February 27, 2026" or "Feb 20 - Feb 27, 2026"

**Conditional Logic Example:**
```typescript
{candidate.applicant_type === 'internal' && (
  <div className="internal-candidate-section">
    <h3>Internal Candidate Details</h3>
    <p>Upload Reason: {candidate.internal_upload_reason || 'Not specified'}</p>
    <p>Available: {formatDate(candidate.internal_from_date)} to {formatDate(candidate.internal_to_date)}</p>
  </div>
)}
```

**C. Education Section**
- Display each education record as a card or list item
- Show: Degree, Institution, Year
- Styled similarly to existing work experience cards
- Only display section if `candidate.education` array has items
- If array is empty, show "No education records" or hide section entirely

**Example:**
```
Bachelor of Science in Computer Science
Massachusetts Institute of Technology
2020
```

**D. Certifications Section**
- Display each certification as a compact tag or card
- Show: Name, Issuer, Year
- Example: "AWS Certified Solutions Architect - Amazon - 2023"
- Only display if `candidate.certifications` array has items

**E. Google Drive CV Preview**

**CRITICAL IMPLEMENTATION:** You already have a CV preview component in the candidates profile page. Use that as the basis.

**Google Drive Preview Strategy:**

Since the CV files are stored in Google Drive with public access ("Anyone with the link"), you can directly embed them using Google's built-in preview mode.

**Key Concept:**
- Share Link: `https://drive.google.com/file/d/ABC12345/view?usp=sharing` (full Drive UI)
- **Embed Link:** `https://drive.google.com/file/d/ABC12345/preview` (document only)

**Step 1: Extract File ID and Generate Preview URL**

JavaScript helper function:
```javascript
function getDriveEmbedUrl(fileId) {
  // If you have the full share link instead of just ID:
  // const match = shareLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
  // const fileId = match ? match[1] : null;
  
  if (!fileId) {
    console.error("Invalid Google Drive File ID");
    return null;
  }

  // Construct the Preview URL
  return `https://drive.google.com/file/d/fileId}/preview`;
}
```

**Step 2: Display in Iframe**

React component example:
```typescript
const DriveViewer = ({ driveFileId }) => {
  if (!driveFileId) return <div>No CV uploaded</div>;

  const embedUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

  return (
    <div className="w-full h-screen">
      <iframe
        src={embedUrl}
        title="CV Preview"
        width="100%"
        height="100%"
        className="border-none rounded-lg shadow-lg"
        allow="autoplay"
      />
    </div>
  );
};
```

**Integration into CV Tab:**
- Check if `candidate.googleDriveFileId` exists
- If yes: Use `getDriveEmbedUrl(candidate.googleDriveFileId)` to generate iframe src
- If no: Fall back to existing `cv_url` download button
- Both can coexist: Show "View CV in Drive" button AND "Download CV" button if both URLs exist

**Important Notes:**
- This only works if the Drive file is set to "General Access: Anyone with the link"
- This is read-only (users cannot edit)
- Works for both PDF and DOCX files
- Mobile users may be prompted to "Open in App"

**F.1. Preferred Employment Type Display**
- Add to the existing info grid alongside other employment-related fields
- Display as: "Preferred Type: Full-time" (use enum label, not raw value)

**F.2. Employment Type - Three-Level Comparison**

Display all three employment types when they exist:
1. **Position requires:** `jobOrder.employment_type` (from job_orders table)
2. **Candidate prefers:** `candidate.preferred_employment_type` (from candidates table)
3. **Applied as:** `application.employment_type` (from candidate_job_applications table)

**Display Logic:**
```typescript
<div className="employment-comparison">
  <p>Position requires: <strong>{formatEmploymentType(jobOrder.employment_type)}</strong></p>
  <p>Candidate prefers: <strong>{candidate.preferred_employment_type ? formatEmploymentType(candidate.preferred_employment_type) : 'Not specified'}</strong></p>
  <p>Applied as: <strong>{application.employment_type ? formatEmploymentType(application.employment_type) : 'To be determined'}</strong></p>
</div>
```

If any level is missing, show "Not specified" or "To be determined" for that level.

**G. AI Evaluation - Strengths & Weaknesses**

**Strengths List:**
- Display `candidate.strengths` array as bulleted list
- Each item prefixed with green checkmark icon (✓)
- Only show section if array exists and has items
- Label: "Strengths"

**Weaknesses List:**
- Display `candidate.weaknesses` array as bulleted list
- Each item prefixed with caution/warning icon (⚠)
- Only show section if array exists and has items
- Label: "Areas for Development" or "Weaknesses"

**Example:**
```tsx
{candidate.strengths && candidate.strengths.length > 0 && (
  <div className="strengths-section">
    <h3>Strengths</h3>
    <ul>
      {candidate.strengths.map((strength, idx) => (
        <li key={idx}>
          <span className="text-green-600">✓</span> {strength}
        </li>
      ))}
    </ul>
  </div>
)}

{candidate.weaknesses && candidate.weaknesses.length > 0 && (
  <div className="weaknesses-section">
    <h3>Areas for Development</h3>
    <ul>
      {candidate.weaknesses.map((weakness, idx) => (
        <li key={idx}>
          <span className="text-amber-600">⚠</span> {weakness}
        </li>
      ))}
    </ul>
  </div>
)}
```

**H. Enum Value Display Labels**

Use human-readable labels for all enum fields throughout the UI:

**Pipeline Status:**
- `hr_interview` → "HR Interview"
- `tech_interview` → "Technical Interview"
- `offer` → "Offer Extended"
- `hired` → "Hired"
- `rejected` → "Rejected"

**Employment Type:**
- `full_time` → "Full-time"
- `part_time` → "Part-time"
- `contract` → "Contract"

**Applicant Type:**
- `internal` → "Internal"
- `external` → "External"

**Interview Verdict:**
- `pass` → "Pass"
- `fail` → "Fail"
- `conditional` → "Conditional"
- `pending` → "Pending"

**Create a helper function:**
```typescript
function formatEnumLabel(value: string, type: 'pipeline' | 'employment' | 'applicant' | 'verdict'): string {
  const labels = {
    pipeline: {
      hr_interview: 'HR Interview',
      tech_interview: 'Technical Interview',
      offer: 'Offer Extended',
      hired: 'Hired',
      rejected: 'Rejected'
    },
    employment: {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract'
    },
    applicant: {
      internal: 'Internal',
      external: 'External'
    },
    verdict: {
      pass: 'Pass',
      fail: 'Fail',
      conditional: 'Conditional',
      pending: 'Pending'
    }
  };
  
  return labels[type][value] || value;
}
```

**J. Positions Fit For Display**

**IMPORTANT:** The `positions_fit_for` field is STILL being used and displayed in the UI.

- Display as tags/badges if array has values
- Shows which roles the candidate is qualified for
- Located near skills section or in the header area
- Example: ["Backend Developer", "DevOps Engineer"]

**Display Logic:**
```typescript
{candidate.positionsFitFor && candidate.positionsFitFor.length > 0 && (
  <div className="positions-fit-section">
    <h4>Qualified For:</h4>
    <div className="flex gap-2">
      {candidate.positionsFitFor.map((position, idx) => (
        <span key={idx} className="badge">{position}</span>
      ))}
    </div>
  </div>
)}
```

**Work Experience Display (Existing - Just Verify):**
- Duration displays as-is: "Dec 2024 - Present" (text, not parsed dates)
- Do NOT calculate or parse date ranges
- Display format: `"{job_title} at {company_name}"`
- Duration shown below title
- Key projects from JSONB displayed as bulleted list

**Key Projects from JSONB:**
```typescript
// key_projects returns as JavaScript array directly (no parsing needed)
{experience.key_projects && experience.key_projects.length > 0 && (
  <ul>
    {experience.key_projects.map((project, idx) => (
      <li key={idx}>{project}</li>
    ))}
  </ul>
)}
```

---

### 4. Update `CandidatesPage.tsx` - Table Columns

**Score Column Update:**

Currently, the table shows "Match Score". Update this to show "Qualification Score" instead.

- Column header: "Score" or "AI Score"
- Display: `candidate.qualification_score` (ignore match_score)
- If qualification_score is null, show "Not evaluated" or "-"
- Sort by qualification_score when clicking column header

**No other major changes needed for the candidates table.**

---

### 5. Update `KanbanCard.tsx` (Minor)

Show qualification score as a secondary indicator if available.

- Display near or alongside existing match score badge
- Format: `{qualification_score}/100`
- If null, don't display or show "Not evaluated"

---

### 6. Status Change Handling - Timeline Entries

**This functionality already exists and is working. No changes needed.**

The existing implementation already:
- Creates `candidate_timeline` records when status changes
- Tracks from_status → to_status transitions
- Records changed_date and changed_by

**Verify it's doing this correctly:**
```sql
INSERT INTO candidate_timeline (
  application_id,
  candidate_id,
  from_status,
  to_status,
  changed_date,
  changed_by
) VALUES (
  $1,  -- application_id
  $2,  -- candidate_id
  $3,  -- previous status (can be NULL for first entry)
  $4,  -- new status
  NOW(),
  $5   -- user_id or NULL
);
```

---

### 7. Data Validation & Error Handling

**Null/Undefined Field Handling:**

All new fields are optional. Use defensive coding:

```typescript
// Safe access with optional chaining
const score = candidate.qualification_score ?? null;
const summary = candidate.overall_summary ?? 'No summary available';
const strengths = candidate.strengths ?? [];
const weaknesses = candidate.weaknesses ?? [];

// Conditional rendering
{candidate.qualification_score && (
  <Badge>{candidate.qualification_score}/100</Badge>
)}

// Display fallback for missing data
<p>Position: {candidate.current_position || 'Not provided'}</p>
<p>Company: {candidate.current_company || 'Not provided'}</p>
```

**Applicant Type Conditional Logic:**

**CRITICAL:** Internal fields MUST only show for internal candidates:

```typescript
// Correct way to conditionally render internal fields
{candidate.applicant_type === 'internal' && (
  <InternalCandidateSection 
    reason={candidate.internal_upload_reason}
    fromDate={candidate.internal_from_date}
    toDate={candidate.internal_to_date}
  />
)}

// WRONG - do not render for external candidates:
{candidate.internal_upload_reason && <div>...</div>}  // ❌ INCORRECT
```

**JSONB Handling:**

`key_projects` is stored as JSONB and returns as a JavaScript array directly:

```typescript
// Correct - it's already an array
experience.key_projects.map(project => ...)

// If you encounter issues, safe parsing:
const projects = Array.isArray(experience.key_projects) 
  ? experience.key_projects 
  : [];
```

**Empty Arrays:**

```typescript
// Hide section if array is empty
{candidate.strengths && candidate.strengths.length > 0 && (
  <StrengthsList items={candidate.strengths} />
)}

// Or show "No items" message
{candidate.education?.length > 0 ? (
  <EducationList items={candidate.education} />
) : (
  <p>No education records</p>
)}
```

**Invalid Dates:**

```typescript
// Safe date formatting
function formatDate(dateString) {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return 'Invalid date';
  }
}
```

---

### 8. Testing Checklist

After implementation, verify all of these:

**Data Fetching:**
- [ ] `refreshCandidates()` fetches all new fields correctly
- [ ] `current_occupation` is NOT fetched (field doesn't exist)
- [ ] `current_position` and `current_company` are fetched separately
- [ ] `qualification_score` is fetched (match_score is ignored)
- [ ] `getFull()` endpoint exists and returns education, certifications, work experience
- [ ] Work experience lazy-loads only when viewing candidate detail

**Score Display:**
- [ ] Qualification score displays correctly as "XX/100"
- [ ] Score shows "Not evaluated" if null
- [ ] Match score is NOT displayed anywhere (it's ignored)
- [ ] Score badge has correct color coding (green 80+, amber 60-79, red <60)

**Current Occupation:**
- [ ] Displays as "Position at Company" format
- [ ] Shows "Not provided" if either field is missing
- [ ] No errors about undefined `current_occupation`

**AI Evaluation:**
- [ ] Overall summary displays as paragraph
- [ ] Strengths render as bulleted list with green checkmarks (✓)
- [ ] Weaknesses render as bulleted list with caution icons (⚠)
- [ ] Sections hidden if arrays are empty

**Internal Candidates:**
- [ ] Internal fields ONLY show when `applicant_type === 'internal'`
- [ ] External candidates don't see internal sections at all
- [ ] Upload reason displays correctly
- [ ] Availability dates display as formatted range

**Google Drive CV:**
- [ ] Drive file ID converts to preview URL correctly
- [ ] Iframe displays PDF/DOCX files
- [ ] Falls back to download button if Drive URL missing
- [ ] Both "View in Drive" and "Download" buttons can coexist

**Employment Types:**
- [ ] Three-level comparison shows all types correctly
- [ ] Missing types show "Not specified"
- [ ] Enum values display as human-readable labels

**Work Experience:**
- [ ] Duration shows as text (not parsed dates)
- [ ] Key projects display as bulleted list
- [ ] JSONB array handled correctly (no parsing errors)

**Education & Certifications:**
- [ ] Cards/list items render properly
- [ ] Hidden when arrays are empty
- [ ] All fields display correctly

**Positions Fit For:**
- [ ] Displays as tags/badges
- [ ] Shows multiple positions correctly
- [ ] Hidden if array is empty

**General:**
- [ ] No console errors about undefined fields
- [ ] Enum values show as human-readable labels everywhere
- [ ] Timeline functionality still works
- [ ] Null/undefined fields handled gracefully
- [ ] Page doesn't crash with missing data

---

## Technical Details

### File Changes Summary

| File | Changes |
|------|---------|
| `src/data/mockData.ts` | Add 15+ new optional fields to `Candidate` interface; remove `currentOccupation` |
| `src/context/AppContext.tsx` | Enrich `refreshCandidates()` mapping with all new fields; remove `current_occupation` reference |
| `src/lib/azureDb.ts` or equivalent | Create/verify `candidates.getFull(id)` endpoint to fetch education, certifications, work_experience |
| `src/components/candidate/CandidateProfileView.tsx` | Add: qualification score badge, overall summary, internal fields section (conditional), education cards, certifications cards, Google Drive CV preview, preferred employment type, three-level employment comparison, strengths/weaknesses lists, positions fit for display |
| `src/pages/CandidatesPage.tsx` | Update score column to show `qualification_score` instead of `match_score` |
| `src/components/KanbanCard.tsx` | Show qualification score if available |
| Utility files | Add enum formatting helper function |

### Data Flow

The candidate data flows as:
1. **List View (CandidatesPage, Kanban):**
   - `azureDb.applications.list()` returns applications with joined candidate/JO fields
   - `azureDb.candidates.list()` returns candidate records with NEW fields
   - `refreshCandidates()` merges these into `LegacyCandidate[]` objects
   - Displays basic info + qualification score

2. **Detail View (CandidateProfileView):**
   - User clicks candidate → opens detail view
   - Calls `azureDb.candidates.getFull(id)` to fetch:
     - Full candidate record (with all new fields)
     - Education array
     - Certifications array
     - Work experience array (with JSONB key_projects)
   - Displays complete profile with all sections

This approach keeps the initial list load fast while providing rich detail on demand.

### Edge Cases

**Handle these scenarios gracefully:**

- **Empty arrays**: If strengths/weaknesses/skills/education/certifications are `[]`, hide section or show "No {field} specified"
- **Null vs empty string**: Treat both as "Not provided"
- **Invalid dates**: If internal_from_date/to_date are malformed, show "Invalid date" instead of crashing
- **Missing job order**: If application exists but job_order was deleted, show "Position no longer available"
- **JSONB null**: If key_projects is null (not `[]`), treat as empty array
- **Very long text**: If overall_summary exceeds ~500 characters, consider truncating with "Read more" toggle
- **Missing Google Drive ID**: Fall back to cv_url download button
- **Drive file not public**: Iframe will show "You need access" - catch this scenario if possible
- **Both Drive and cv_url exist**: Show both buttons ("View in Drive" + "Download")
- **External candidate with internal fields**: Should never happen, but conditionally hide anyway
- **Null qualification_score**: Show "Not evaluated" badge or hide score entirely
- **positions_fit_for empty**: Hide section completely

---

## Summary of All Schema Changes

### Removed Fields:
- `candidates.current_occupation` → Split into `current_position` + `current_company`
- `candidate_work_experience.start_date` → Use `duration` text instead
- `candidate_work_experience.end_date` → Use `duration` text instead
- `candidate_work_experience.is_current` → Not needed

### Added Fields:
- `candidates.current_position` (text)
- `candidates.current_company` (text)
- `candidates.qualification_score` (integer 0-100) - **THE ONLY SCORE**
- `candidates.overall_summary` (text)
- `candidates.strengths` (text array)
- `candidates.weaknesses` (text array)
- `candidates.preferred_employment_type` (enum)
- `candidates.internal_upload_reason` (text)
- `candidates.internal_from_date` (date)
- `candidates.internal_to_date` (date)
- `candidates.google_drive_file_id` (text)
- `candidates.google_drive_file_url` (text)
- `candidates.batch_id` (uuid)
- `candidates.batch_created_at` (timestamp)
- `candidate_job_applications.employment_type` (enum)

### Changed Data Types:
- `candidate_work_experience.key_projects`: TEXT[] → JSONB

### Ignored Fields:
- `candidate_job_applications.match_score` - **DO NOT USE** (qualification_score is the only score)

### New Enum Types:
- `pipeline_status_enum`: hr_interview, tech_interview, offer, hired, rejected
- `employment_type_enum`: full_time, part_time, contract
- `applicant_type_enum`: internal, external
- `job_level_enum`: L1, L2, L3, L4, L5
- `interview_verdict_enum`: pass, fail, conditional, pending
- `offer_status_enum`: pending, accepted, rejected, withdrawn, expired

---

## Final Notes

**Adapt to existing UI:** Do not rebuild components from scratch. Integrate these new fields and sections into the existing UI structure wherever they fit naturally.

**Mobile responsiveness:** Ensure all new sections (education, certifications, strengths/weaknesses) work on mobile viewports.

**Performance:** Lazy-load detailed data (education, certifications, work experience) only when viewing individual profiles, not in list views.

**Error handling:** All new fields are optional. Use defensive coding with optional chaining and fallback values.

**Google Drive preview:** This is the cleanest solution for CV display. Follow the exact implementation provided (extract ID → generate preview URL → embed in iframe).

---

**This plan is complete and ready for implementation. Follow it systematically, starting with data fetching (Section 1), then interface updates (Section 2), then UI components (Sections 3-5), and finally testing (Section 8).**
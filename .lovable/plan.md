
# Overhaul: Form-Driven Pipeline Movement, Remove Drag-and-Drop, Simplify Offer Form, Internal Sort, Email Webhook

This is a large change spanning multiple files across the Kanban board, candidate profile, interview forms, offer form, email system, and sorting logic.

---

## 1. Remove Drag-and-Drop from Kanban

**Files:** `src/components/dashboard/DashboardKanban.tsx`, `src/components/dashboard/KanbanBoard.tsx`, `src/components/dashboard/KanbanCard.tsx`, `src/components/dashboard/KanbanColumn.tsx`

- Remove all `@dnd-kit` imports (`DndContext`, `DragOverlay`, `useDraggable`, `useDroppable`, sensors, etc.)
- Remove the `GripVertical` drag handle from cards
- Remove `DragOverlay` component
- Remove `DragStartEvent`/`DragEndEvent` handlers
- Replace `DndContext` wrapper with a plain `div`
- Remove `isOver` ring styling from columns
- Remove `useDroppable`/`setNodeRef` from columns
- Cards remain clickable to open candidate profile

---

## 2. Verdict Options: Remove "conditional" from HR and Tech Forms

**Files:** `src/data/mockData.ts`, `src/components/candidate/HRInterviewFormTab.tsx`, `src/components/candidate/TechInterviewFormTab.tsx`

- In `mockData.ts`, update `hrVerdictLabels` and `techVerdictLabels` to only include `pass`, `fail`, and `pending` (remove `conditional`)
- The `HRVerdict` and `TechVerdict` types keep `conditional` for backward compatibility but the dropdown will only show 3 options
- HR form verdict: Pass (moves to tech), Fail (moves to rejected), Pending
- Tech form verdict: Pass (moves to offer), Fail (moves to rejected), Pending

---

## 3. Candidate Profile Header Changes

**File:** `src/components/candidate/CandidateProfileView.tsx`

**Replace the status dropdown with a read-only badge:**
- Remove the `Select`/`SelectTrigger`/`SelectContent` for pipeline status
- Replace with a static styled badge showing the current status (using `pipelineStatusColors`)

**Replace the "Move to Next Round" button with context-aware form opener:**
- When `hr_interview`: Show "Open HR Form" button that switches to `hr-form` tab
- When `tech_interview`: Show "Open Tech Form" button that switches to `tech-form` tab  
- When `offer`: Show "Open Offer Form" button that switches to `offer-form` tab
- When `hired` or `rejected`: No button shown

**Always show Tech Form tab** (currently hidden when not at tech stage):
- Remove the `isTechStageOrBeyond` condition from the tabs array
- In the tech-form tab content, show "Not yet at Tech Interview stage" placeholder when not at tech stage or beyond (similar to the offer form's existing behavior)

---

## 4. Simplify Offer Form

**File:** `src/components/candidate/OfferFormTab.tsx`

**Remove fields:**
- Expiry Date
- Benefits Package  
- Negotiation Notes

**Remove from the `OfferForm` interface:** `expiryDate`, `benefits`, `negotiationNotes`

**Default offer date to today** when creating a new offer (no existing data):
- Initialize `offerDate` to `new Date().toISOString().split('T')[0]`

**Remove from the save payload:** `expiry_date`, `benefits`, `negotiation_notes`

**Remaining fields:** Offer Date (default today), Offer Amount, Position (pre-selected), Start Date, Status, Remarks

---

## 5. Database: Drop Columns from `offers` Table

**Migration SQL:**
```sql
ALTER TABLE offers DROP COLUMN IF EXISTS expiry_date;
ALTER TABLE offers DROP COLUMN IF EXISTS benefits;
ALTER TABLE offers DROP COLUMN IF EXISTS negotiation_notes;
```

**File:** `src/hooks/useOffers.ts` - Remove `expiry_date`, `benefits`, `negotiation_notes` from the `Offer` and `OfferInsert` interfaces.

---

## 6. Internal Candidates Sort to Top in Kanban

**File:** `src/components/dashboard/DashboardKanban.tsx`

Update the `getCandidatesForColumn` sort function:
- Primary sort: internal candidates first (`applicantType === 'internal'` before `external`)
- Secondary sort: by score descending (existing behavior)

```typescript
const getCandidatesForColumn = (status: PipelineStatus) =>
  candidates.filter(c => c.pipelineStatus === status).sort((a, b) => {
    // Internal first
    if (a.applicantType === 'internal' && b.applicantType !== 'internal') return -1;
    if (a.applicantType !== 'internal' && b.applicantType === 'internal') return 1;
    // Then by score
    return (b.qualificationScore ?? b.matchScore) - (a.qualificationScore ?? a.matchScore);
  });
```

---

## 7. Email Webhook Integration

**File:** `src/components/modals/EmailModal.tsx`

On "Send Email", call the webhook:
```
POST https://workflow.exist.com.ph/webhook/81f944ac-1805-4de0-aec6-248bc04c535d
Body: { email: candidate.email, name: candidate.name, email_type: "composed" }
```

**File:** `src/context/AppContext.tsx`

When `updateCandidatePipelineStatus` successfully moves a candidate to a new stage, fire the same webhook with the appropriate `email_type`:
- `hr_interview` to `tech_interview`: `email_type = "tech"`
- `tech_interview` to `offer`: `email_type = "offer"`
- `offer` to `hired`: `email_type = "hired"`
- Any to `rejected`: `email_type = "rejected"`

The webhook call will be a fire-and-forget `fetch` POST (no blocking).

---

## 8. Tech Form: Show "Not Yet" Placeholder

**File:** `src/components/candidate/TechInterviewFormTab.tsx`

Add a guard at the top (similar to `OfferFormTab`):
- If `pipelineStatus` is `hr_interview`, show a placeholder: "Not yet at Tech Interview stage. This form will be available once the candidate passes the HR interview."

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardKanban.tsx` | Remove all dnd-kit; update sort for internal-first |
| `src/components/dashboard/KanbanBoard.tsx` | Remove dnd-kit (or mark unused if not imported elsewhere) |
| `src/components/dashboard/KanbanCard.tsx` | Remove drag handle and `useDraggable` |
| `src/components/dashboard/KanbanColumn.tsx` | Remove `useDroppable` |
| `src/components/candidate/CandidateProfileView.tsx` | Read-only status badge; context-aware form button; always show tech tab |
| `src/components/candidate/HRInterviewFormTab.tsx` | Remove "conditional" from verdict dropdown |
| `src/components/candidate/TechInterviewFormTab.tsx` | Remove "conditional"; add "not yet" guard |
| `src/components/candidate/OfferFormTab.tsx` | Remove expiry/benefits/negotiation; default offerDate to today |
| `src/hooks/useOffers.ts` | Remove dropped fields from interfaces |
| `src/data/mockData.ts` | Update verdict labels (remove conditional) |
| `src/components/modals/EmailModal.tsx` | Fire webhook on send |
| `src/context/AppContext.tsx` | Fire email webhook on stage transition |
| **DB Migration** | Drop 3 columns from `offers` table |

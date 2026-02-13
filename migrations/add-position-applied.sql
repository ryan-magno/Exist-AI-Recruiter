-- ============================================
-- MIGRATION: Add position_applied column &
--            Change positions_fit_for to jsonb
-- ============================================
-- Purpose: Support "AI decides position fit" feature
--   - position_applied: what the user/candidate selected during upload (nullable = "let AI decide")
--   - positions_fit_for: AI-determined best-fitting positions with structured data
--     Format: [{"jo_number": "...", "job_title": "...", "match_score": 85, "match_reasoning": "..."}]

-- 1. Change positions_fit_for from text[] to jsonb
ALTER TABLE candidates 
  ALTER COLUMN positions_fit_for TYPE jsonb 
  USING CASE 
    WHEN positions_fit_for IS NULL THEN NULL
    ELSE to_jsonb(positions_fit_for)
  END;

-- 2. Add position_applied column (what user selected, nullable = "let AI decide")
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS position_applied text;

-- 3. Add index on positions_fit_for for GIN queries (jsonb)
CREATE INDEX IF NOT EXISTS idx_candidates_positions_fit_for ON candidates USING GIN (positions_fit_for);

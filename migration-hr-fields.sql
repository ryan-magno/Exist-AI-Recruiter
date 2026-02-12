-- Migration: Add HR form sync fields
-- Date: 2026-02-12
-- Description: Adds fields for HR form data synchronization with candidate profiles

-- Add columns to candidates table
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS employment_status_preference text,
  ADD COLUMN IF NOT EXISTS relocation_willingness text;

-- Add column to hr_interviews table
ALTER TABLE hr_interviews 
  ADD COLUMN IF NOT EXISTS earliest_start_date date;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidates' 
  AND column_name IN ('employment_status_preference', 'relocation_willingness')
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hr_interviews' 
  AND column_name = 'earliest_start_date';

-- ============================================
-- MULTI-SCHEMA ARCHITECTURE (v2 - Future)
-- ============================================
-- This version organizes tables into separate schemas for better scalability,
-- role-based access control, and maintainability.
--
-- Schemas:
--   - recruitment:  Core recruitment domain (candidates, JOs, interviews, offers, applications)
--   - processing:   CV uploads and data processing
--   - audit:        Activity logs and timeline tracking
--   - integration:  Webhooks and external integrations
--
-- NOTE: Requires updating server code to use schema-qualified table names
-- Example: query("SELECT * FROM recruitment.candidates WHERE id = $1", [id])
--
-- ============================================

-- =====================================================
-- 1. CREATE SCHEMAS
-- =====================================================
CREATE SCHEMA IF NOT EXISTS recruitment;
CREATE SCHEMA IF NOT EXISTS processing;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS integration;

-- =====================================================
-- 2. CREATE ENUMS (in recruitment schema as primary domain)
-- =====================================================
CREATE TYPE recruitment.applicant_type_enum AS ENUM ('internal', 'external');
CREATE TYPE recruitment.employment_type_enum AS ENUM ('full_time', 'part_time', 'contract');
CREATE TYPE recruitment.interview_verdict_enum AS ENUM ('pass', 'fail', 'conditional', 'pending');
CREATE TYPE recruitment.job_level_enum AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5');
CREATE TYPE recruitment.job_status_enum AS ENUM ('open', 'closed', 'on_hold', 'pooling', 'archived');
CREATE TYPE recruitment.offer_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');
CREATE TYPE recruitment.pipeline_status_enum AS ENUM ('applied', 'hr_interview', 'tech_interview', 'offer', 'hired', 'rejected');

-- =====================================================
-- 3. RECRUITMENT SCHEMA - Core tables
-- =====================================================

-- Departments (reference for organization structure)
CREATE TABLE recruitment.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Candidates (sourced from CV uploads or internal transfers)
CREATE TABLE recruitment.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  applicant_type recruitment.applicant_type_enum NOT NULL DEFAULT 'external',
  
  -- Experience & Skills
  years_of_experience INT,
  current_position TEXT,
  current_company TEXT,
  key_skills JSONB DEFAULT '[]'::jsonb, -- ["Skill1", "Skill2", ...]
  
  -- Education & Certifications (stored as JSON for flexibility)
  education JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  work_history JSONB DEFAULT '{}'::jsonb,
  
  -- Assessment Scores
  qualification_score INT,
  match_score INT,
  overall_summary TEXT,
  
  -- Job Assignment
  assigned_jo_id UUID,
  
  -- Pipeline Status
  pipeline_status recruitment.pipeline_status_enum NOT NULL DEFAULT 'applied',
  status_changed_date TIMESTAMP DEFAULT now(),
  
  -- Interview Results
  hr_interview_scheduled BOOLEAN DEFAULT false,
  tech_interview_scheduled BOOLEAN DEFAULT false,
  
  -- Audit
  created_by_user_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP, -- Soft delete support
  
  CONSTRAINT check_score_range CHECK (qualification_score IS NULL OR (qualification_score >= 0 AND qualification_score <= 100)),
  CONSTRAINT check_match_score CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100))
);

-- Job Orders (open positions)
CREATE TABLE recruitment.job_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  jo_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES recruitment.departments(id) ON DELETE SET NULL,
  department_name TEXT,
  
  -- Job Details
  level recruitment.job_level_enum NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  employment_type recruitment.employment_type_enum NOT NULL,
  
  -- Requestor Info
  requestor_name TEXT,
  
  -- Status & Dates
  status recruitment.job_status_enum NOT NULL DEFAULT 'open',
  required_date DATE,
  
  -- Tracking
  hired_count INT DEFAULT 0,
  created_by_user_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP, -- Soft delete support
  
  CONSTRAINT check_quantity_positive CHECK (quantity > 0),
  CONSTRAINT check_hired_count CHECK (hired_count >= 0)
);

-- Job Applications (candidate + JO relationship)
CREATE TABLE recruitment.candidate_job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  candidate_id UUID NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
  job_order_id UUID NOT NULL REFERENCES recruitment.job_orders(id) ON DELETE CASCADE,
  
  -- Application Details
  applied_date TIMESTAMP DEFAULT now(),
  fit_score INT,
  notes TEXT,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP,
  
  UNIQUE(candidate_id, job_order_id),
  CONSTRAINT check_fit_score CHECK (fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100))
);

-- HR Interviews
CREATE TABLE recruitment.hr_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  candidate_id UUID NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
  job_order_id UUID REFERENCES recruitment.job_orders(id) ON DELETE SET NULL,
  application_id UUID UNIQUE NOT NULL REFERENCES recruitment.candidate_job_applications(id) ON DELETE CASCADE,
  
  -- Interview Details
  interview_date TIMESTAMP,
  interviewer_name TEXT,
  interview_notes TEXT,
  verdict recruitment.interview_verdict_enum DEFAULT 'pending',
  verdict_details TEXT,
  
  -- Audit
  created_by_user_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tech Interviews
CREATE TABLE recruitment.tech_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  candidate_id UUID NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
  job_order_id UUID REFERENCES recruitment.job_orders(id) ON DELETE SET NULL,
  application_id UUID UNIQUE NOT NULL REFERENCES recruitment.candidate_job_applications(id) ON DELETE CASCADE,
  
  -- Interview Details
  interview_date TIMESTAMP,
  interviewer_name TEXT,
  interview_notes TEXT,
  verdict recruitment.interview_verdict_enum DEFAULT 'pending',
  verdict_details TEXT,
  
  -- Tech Assessment
  languages_tested TEXT, -- comma-separated: "Java,Python,SQL"
  score INT,
  
  -- Audit
  created_by_user_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT check_tech_score CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

-- Offers
CREATE TABLE recruitment.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  candidate_id UUID NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
  job_order_id UUID NOT NULL REFERENCES recruitment.job_orders(id) ON DELETE CASCADE,
  
  -- Offer Details
  salary_offered TEXT,
  start_date DATE,
  employment_type recruitment.employment_type_enum,
  
  -- Status
  status recruitment.offer_status_enum DEFAULT 'pending',
  sent_date TIMESTAMP,
  response_date TIMESTAMP,
  
  -- Audit
  created_by_user_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- 4. PROCESSING SCHEMA - CV uploads and data processing
-- =====================================================

-- CV Uploaders (tracks who uploaded CVs)
CREATE TABLE processing.cv_uploaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  uploader_name TEXT NOT NULL,
  email TEXT,
  upload_batch_id UUID,
  created_at TIMESTAMP DEFAULT now()
);

-- Processing Status (tracks CV batch processing)
CREATE TABLE processing.processing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  uploader_id UUID NOT NULL REFERENCES processing.cv_uploaders(id) ON DELETE CASCADE,
  batch_name TEXT,
  
  -- Processing Status
  status TEXT DEFAULT 'queued', -- queued, processing, completed, failed
  processed_count INT DEFAULT 0,
  total_count INT,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- 5. AUDIT SCHEMA - Activity logging and timeline
-- =====================================================

-- Activity Log (comprehensive audit trail)
CREATE TABLE audit.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened
  activity_type TEXT NOT NULL, -- jo_created, candidate_applied, interview_scheduled, offer_sent, etc.
  entity_type TEXT NOT NULL, -- job_order, candidate, interview, offer
  entity_id UUID NOT NULL,
  
  -- Who did it
  user_id UUID,
  
  -- Additional context (flexible JSON)
  details JSONB DEFAULT '{}'::jsonb, -- { "jo_number": "JO-2026-001", "title": "....", etc. }
  
  -- Timestamp
  action_date TIMESTAMP DEFAULT now(),
  
  INDEX idx_activity_entity (entity_type, entity_id),
  INDEX idx_activity_date (action_date DESC),
  INDEX idx_activity_type (activity_type)
);

-- Candidate Timeline (specific to candidate milestones)
CREATE TABLE audit.candidate_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  candidate_id UUID NOT NULL REFERENCES recruitment.candidates(id) ON DELETE CASCADE,
  
  -- Event
  event_type TEXT NOT NULL, -- applied, interview_scheduled, interview_completed, offer_sent, hired, rejected
  job_order_id UUID REFERENCES recruitment.job_orders(id) ON DELETE SET NULL,
  
  -- Details
  description TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  event_date TIMESTAMP DEFAULT now(),
  
  INDEX idx_candidate_timeline (candidate_id, event_date DESC)
);

-- Application History (tracks status changes)
CREATE TABLE audit.application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  application_id UUID NOT NULL REFERENCES recruitment.candidate_job_applications(id) ON DELETE CASCADE,
  
  -- Status Change
  previous_status TEXT,
  new_status TEXT,
  
  -- Who changed it
  changed_by_user_id UUID,
  changed_at TIMESTAMP DEFAULT now(),
  
  INDEX idx_app_history_application (application_id, changed_at DESC)
);

-- =====================================================
-- 6. INTEGRATION SCHEMA - External webhooks & integrations
-- =====================================================

-- Webhook Log (tracks all outgoing webhooks)
CREATE TABLE integration.webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Webhook Details
  webhook_type TEXT NOT NULL, -- job_order, candidate, interview, etc.
  action TEXT NOT NULL, -- create, update, delete
  target_url TEXT NOT NULL,
  
  -- Request/Response
  request_body JSONB,
  response_status INT,
  response_body TEXT,
  
  -- Timing
  sent_at TIMESTAMP DEFAULT now(),
  INDEX idx_webhook_type_date (webhook_type, sent_at DESC)
);

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Recruitment Schema Indexes
CREATE INDEX idx_candidates_pipeline_status ON recruitment.candidates(pipeline_status);
CREATE INDEX idx_candidates_assigned_jo_id ON recruitment.candidates(assigned_jo_id);
CREATE INDEX idx_candidates_created_at ON recruitment.candidates(created_at DESC);
CREATE INDEX idx_candidates_applicant_type ON recruitment.candidates(applicant_type);
CREATE INDEX idx_candidates_full_name_tsvector ON recruitment.candidates USING GIN(to_tsvector('english', full_name));

CREATE INDEX idx_job_orders_status ON recruitment.job_orders(status);
CREATE INDEX idx_job_orders_department_id ON recruitment.job_orders(department_id);
CREATE INDEX idx_job_orders_created_at ON recruitment.job_orders(created_at DESC);

CREATE INDEX idx_applications_candidate_id ON recruitment.candidate_job_applications(candidate_id);
CREATE INDEX idx_applications_job_order_id ON recruitment.candidate_job_applications(job_order_id);
CREATE INDEX idx_applications_applied_date ON recruitment.candidate_job_applications(applied_date DESC);

CREATE INDEX idx_hr_interviews_candidate_id ON recruitment.hr_interviews(candidate_id);
CREATE INDEX idx_hr_interviews_verdict ON recruitment.hr_interviews(verdict);

CREATE INDEX idx_tech_interviews_candidate_id ON recruitment.tech_interviews(candidate_id);
CREATE INDEX idx_tech_interviews_verdict ON recruitment.tech_interviews(verdict);

CREATE INDEX idx_offers_candidate_id ON recruitment.offers(candidate_id);
CREATE INDEX idx_offers_status ON recruitment.offers(status);

-- Processing Schema Indexes
CREATE INDEX idx_processing_batches_status ON processing.processing_batches(status);
CREATE INDEX idx_processing_batches_created_at ON processing.processing_batches(created_at DESC);

-- =====================================================
-- 8. CREATE UPDATED_AT TRIGGERS (for all tables with updated_at)
-- =====================================================

-- Generic trigger function (can be reused)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all schema tables with updated_at
CREATE TRIGGER update_candidates_timestamp BEFORE UPDATE ON recruitment.candidates
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_job_orders_timestamp BEFORE UPDATE ON recruitment.job_orders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_applications_timestamp BEFORE UPDATE ON recruitment.candidate_job_applications
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hr_interviews_timestamp BEFORE UPDATE ON recruitment.hr_interviews
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tech_interviews_timestamp BEFORE UPDATE ON recruitment.tech_interviews
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_offers_timestamp BEFORE UPDATE ON recruitment.offers
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_departments_timestamp BEFORE UPDATE ON recruitment.departments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_batches_timestamp BEFORE UPDATE ON processing.processing_batches
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- 9. CREATE ROLE-BASED ACCESS CONTROL (RBAC) SETUP
-- =====================================================

-- Create roles (uncomment and adapt for your org)
/*
CREATE ROLE recruiter LOGIN PASSWORD 'password_here';
CREATE ROLE hiring_manager LOGIN PASSWORD 'password_here';
CREATE ROLE admin LOGIN PASSWORD 'password_here';

-- Grant recruiter access to recruitment & audit schemas only
GRANT USAGE ON SCHEMA recruitment, audit, processing TO recruiter;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA recruitment TO recruiter;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO recruiter;

-- Grant hiring_manager access to view only
GRANT USAGE ON SCHEMA recruitment, audit TO hiring_manager;
GRANT SELECT ON ALL TABLES IN SCHEMA recruitment TO hiring_manager;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO hiring_manager;

-- Grant admin full access
GRANT USAGE ON SCHEMA recruitment, processing, audit, integration TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA recruitment TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA processing TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA integration TO admin;
*/

-- =====================================================
-- NOTES FOR IMPLEMENTATION
-- =====================================================
--
-- 1. Update server queries to use schema-qualified names:
--    OLD: query("SELECT * FROM candidates WHERE id = $1", [id])
--    NEW: query("SELECT * FROM recruitment.candidates WHERE id = $1", [id])
--
-- 2. For migrations, run this script in order:
--    - psql -U existpostgres -d postgres -h exist-ai-recruiter.postgres.database.azure.com < schema-multi-schema.sql
--
-- 3. Soft deletes: Always add WHERE deleted_at IS NULL to queries
--    Example: SELECT * FROM recruitment.candidates WHERE deleted_at IS NULL
--
-- 4. Full-text search on candidates:
--    SELECT * FROM recruitment.candidates 
--    WHERE to_tsvector('english', full_name) @@ plainto_tsquery('english', 'search_term')
--
-- 5. For backups, you can now backup specific schemas:
--    pg_dump -U existpostgres -n recruitment -d postgres -h exist-ai-recruiter.postgres.database.azure.com > recruitment_backup.sql
--

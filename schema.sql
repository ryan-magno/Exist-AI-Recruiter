-- ============================================
-- COMPLETE SCHEMA RECREATION SCRIPT
-- ============================================

-- Drop existing objects if they exist (safe re-run)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS candidate_timeline CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS tech_interviews CASCADE;
DROP TABLE IF EXISTS hr_interviews CASCADE;
DROP TABLE IF EXISTS candidate_job_applications CASCADE;
DROP TABLE IF EXISTS candidate_work_experience CASCADE;
DROP TABLE IF EXISTS candidate_certifications CASCADE;
DROP TABLE IF EXISTS candidate_education CASCADE;
DROP TABLE IF EXISTS application_history CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS job_orders CASCADE;
DROP TABLE IF EXISTS cv_uploaders CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

DROP TYPE IF EXISTS applicant_type_enum CASCADE;
DROP TYPE IF EXISTS employment_type_enum CASCADE;
DROP TYPE IF EXISTS interview_verdict_enum CASCADE;
DROP TYPE IF EXISTS job_level_enum CASCADE;
DROP TYPE IF EXISTS job_status_enum CASCADE;
DROP TYPE IF EXISTS offer_status_enum CASCADE;
DROP TYPE IF EXISTS pipeline_status_enum CASCADE;

-- 1. CREATE ENUMS
CREATE TYPE applicant_type_enum AS ENUM ('internal', 'external');
CREATE TYPE employment_type_enum AS ENUM ('full_time', 'part_time', 'contract');
CREATE TYPE interview_verdict_enum AS ENUM ('pass', 'fail', 'conditional', 'pending');
CREATE TYPE job_level_enum AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5');
CREATE TYPE job_status_enum AS ENUM ('open', 'closed', 'on_hold', 'pooling', 'archived');
CREATE TYPE offer_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');
CREATE TYPE pipeline_status_enum AS ENUM ('hr_interview', 'tech_interview', 'offer', 'hired', 'rejected');

-- 2. CREATE TABLES
CREATE TABLE activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  performed_by_name text,
  action_date timestamp with time zone NOT NULL DEFAULT now(),
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE departments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (name)
);

CREATE TABLE cv_uploaders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  applicant_type applicant_type_enum,
  skills text[],
  positions_fit_for text[],
  years_of_experience_text text,
  current_position text,
  current_company text,
  preferred_work_setup text,
  preferred_employment_type employment_type_enum,
  employment_status_preference text,
  relocation_willingness text,
  expected_salary text,
  earliest_start_date date,
  internal_upload_reason text,
  internal_from_date date,
  internal_to_date date,
  linkedin text,
  qualification_score integer,
  overall_summary text,
  strengths text[],
  weaknesses text[],
  batch_id uuid,
  batch_created_at timestamp with time zone,
  processing_status text,
  google_drive_file_id text,
  google_drive_file_url text,
  uploaded_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  notice_period text,
  PRIMARY KEY (id)
);

CREATE TABLE job_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  jo_number text NOT NULL,
  title text NOT NULL,
  description text,
  department_name text,
  department_id uuid,
  level job_level_enum NOT NULL,
  quantity integer,
  hired_count integer DEFAULT 0,
  employment_type employment_type_enum NOT NULL,
  requestor_name text,
  required_date date,
  status job_status_enum DEFAULT 'open'::job_status_enum,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (jo_number),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE application_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  job_order_id uuid,
  jo_number text,
  jo_title text,
  applied_date date NOT NULL,
  furthest_stage pipeline_status_enum,
  outcome text,
  historical_notes text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE candidate_certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  name text NOT NULL,
  issuer text,
  year text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE candidate_education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  degree text NOT NULL,
  institution text NOT NULL,
  year text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE candidate_work_experience (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  company_name text NOT NULL,
  job_title text NOT NULL,
  duration text,
  description text,
  key_projects jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE candidate_job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  job_order_id uuid NOT NULL,
  pipeline_status pipeline_status_enum NOT NULL DEFAULT 'hr_interview'::pipeline_status_enum,
  match_score numeric,
  employment_type employment_type_enum,
  tech_interview_result interview_verdict_enum,
  working_conditions text,
  remarks text,
  applied_date timestamp with time zone DEFAULT now(),
  status_changed_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (candidate_id, job_order_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
);

CREATE TABLE candidate_timeline (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  from_status pipeline_status_enum,
  to_status pipeline_status_enum NOT NULL,
  changed_date timestamp with time zone DEFAULT now(),
  changed_by uuid,
  duration_days integer,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (application_id) REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE hr_interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  interview_date date,
  interviewer_name text,
  interview_mode text,
  availability text,
  expected_salary text,
  earliest_start_date date,
  preferred_work_setup text,
  notice_period text,
  communication_rating integer,
  motivation_rating integer,
  cultural_fit_rating integer,
  professionalism_rating integer,
  strengths text,
  concerns text,
  verdict interview_verdict_enum,
  verdict_rationale text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (application_id),
  FOREIGN KEY (application_id) REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE tech_interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  interview_date date,
  interviewer_name text,
  interview_mode text,
  technical_knowledge_rating integer,
  problem_solving_rating integer,
  code_quality_rating integer,
  system_design_rating integer,
  coding_challenge_score integer,
  coding_challenge_notes text,
  technical_strengths text,
  areas_for_improvement text,
  verdict interview_verdict_enum,
  verdict_rationale text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (application_id),
  FOREIGN KEY (application_id) REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  offer_date date,
  offer_amount text,
  position text,
  start_date date,
  status offer_status_enum DEFAULT 'pending'::offer_status_enum,
  remarks text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (application_id),
  FOREIGN KEY (application_id) REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- 3. CREATE INDEXES
CREATE INDEX idx_activity_log_action_date ON activity_log (action_date DESC);
CREATE INDEX idx_activity_log_activity_type ON activity_log (activity_type);
CREATE INDEX idx_activity_log_entity ON activity_log (entity_type, entity_id);
CREATE INDEX idx_certifications_candidate_id ON candidate_certifications (candidate_id);
CREATE INDEX idx_education_candidate_id ON candidate_education (candidate_id);
CREATE INDEX idx_applications_candidate_id ON candidate_job_applications (candidate_id);
CREATE INDEX idx_applications_job_order_id ON candidate_job_applications (job_order_id);
CREATE INDEX idx_applications_pipeline_status ON candidate_job_applications (pipeline_status);
CREATE INDEX idx_timeline_application_id ON candidate_timeline (application_id);
CREATE INDEX idx_timeline_candidate_id ON candidate_timeline (candidate_id);
CREATE INDEX idx_work_exp_candidate_id ON candidate_work_experience (candidate_id);
CREATE INDEX idx_candidates_applicant_type ON candidates (applicant_type);
CREATE INDEX idx_candidates_batch_id ON candidates (batch_id);
CREATE INDEX idx_candidates_email ON candidates (email);
CREATE INDEX idx_hr_interviews_application_id ON hr_interviews (application_id);
CREATE INDEX idx_job_orders_department_id ON job_orders (department_id);
CREATE INDEX idx_job_orders_status ON job_orders (status);
CREATE INDEX idx_offers_application_id ON offers (application_id);
CREATE INDEX idx_offers_status ON offers (status);
CREATE INDEX idx_tech_interviews_application_id ON tech_interviews (application_id);

-- 4. CREATE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 5. CREATE TRIGGERS
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON candidate_job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_interviews_updated_at
  BEFORE UPDATE ON hr_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_orders_updated_at
  BEFORE UPDATE ON job_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tech_interviews_updated_at
  BEFORE UPDATE ON tech_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

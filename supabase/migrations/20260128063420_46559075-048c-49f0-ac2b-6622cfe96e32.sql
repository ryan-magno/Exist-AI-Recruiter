-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'recruiter', 'hiring_manager');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pipeline_status AS ENUM ('new', 'screening', 'for_hr_interview', 'for_tech_interview', 'offer', 'hired', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.job_order_status AS ENUM ('draft', 'in-progress', 'fulfilled', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_type AS ENUM ('consultant', 'project-based', 'regular');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.job_level AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tech_interview_result AS ENUM ('pending', 'passed', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.hr_verdict AS ENUM ('proceed_to_tech', 'hold', 'reject');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tech_verdict AS ENUM ('recommend_hire', 'consider', 'do_not_hire');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.applicant_type AS ENUM ('internal', 'external');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Departments lookup table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Job Orders table
CREATE TABLE IF NOT EXISTS public.job_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jo_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id),
  department_name TEXT,
  level job_level NOT NULL,
  employment_type employment_type NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  hired_count INTEGER NOT NULL DEFAULT 0,
  required_date DATE,
  status job_order_status NOT NULL DEFAULT 'draft',
  requestor_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  applicant_type applicant_type NOT NULL DEFAULT 'external',
  
  -- Education & Skills
  educational_background TEXT,
  skills TEXT[],
  years_of_experience INTEGER,
  
  -- CV/Resume
  cv_url TEXT,
  cv_filename TEXT,
  
  -- Position preferences
  positions_fit_for TEXT[],
  
  -- Logistics (nullable - filled by HR)
  expected_salary TEXT,
  earliest_start_date DATE,
  preferred_work_setup TEXT,
  availability TEXT,
  
  -- Uploader info
  uploaded_by TEXT,
  uploaded_by_user_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Work Experience table (one-to-many with candidates)
CREATE TABLE IF NOT EXISTS public.candidate_work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Candidate Job Applications (junction table)
CREATE TABLE IF NOT EXISTS public.candidate_job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  job_order_id UUID REFERENCES public.job_orders(id) ON DELETE CASCADE NOT NULL,
  
  pipeline_status pipeline_status NOT NULL DEFAULT 'new',
  tech_interview_result tech_interview_result DEFAULT 'pending',
  match_score DECIMAL(5,2),
  
  status_changed_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Notes
  remarks TEXT,
  working_conditions TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(candidate_id, job_order_id)
);

-- 8. HR Interview Forms
CREATE TABLE IF NOT EXISTS public.hr_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.candidate_job_applications(id) ON DELETE CASCADE NOT NULL UNIQUE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  
  -- Interviewer info
  interviewer_name TEXT,
  interview_date DATE,
  interview_mode TEXT,
  
  -- Logistics
  availability TEXT,
  expected_salary TEXT,
  preferred_work_setup TEXT,
  notice_period TEXT,
  
  -- Behavioral assessment (1-5 ratings)
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  motivation_rating INTEGER CHECK (motivation_rating >= 1 AND motivation_rating <= 5),
  cultural_fit_rating INTEGER CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  
  -- Assessment notes
  strengths TEXT,
  concerns TEXT,
  
  -- Verdict
  verdict hr_verdict,
  verdict_rationale TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Tech Interview Forms
CREATE TABLE IF NOT EXISTS public.tech_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.candidate_job_applications(id) ON DELETE CASCADE NOT NULL UNIQUE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  
  -- Interviewer info
  interviewer_name TEXT,
  interview_date DATE,
  interview_mode TEXT,
  
  -- Technical assessment (1-5 ratings)
  technical_knowledge_rating INTEGER CHECK (technical_knowledge_rating >= 1 AND technical_knowledge_rating <= 5),
  problem_solving_rating INTEGER CHECK (problem_solving_rating >= 1 AND problem_solving_rating <= 5),
  code_quality_rating INTEGER CHECK (code_quality_rating >= 1 AND code_quality_rating <= 5),
  system_design_rating INTEGER CHECK (system_design_rating >= 1 AND system_design_rating <= 5),
  
  -- Coding challenge
  coding_challenge_score INTEGER,
  coding_challenge_notes TEXT,
  
  -- Assessment notes
  technical_strengths TEXT,
  areas_for_improvement TEXT,
  
  -- Verdict
  verdict tech_verdict,
  verdict_rationale TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Candidate Timeline (tracks all status movements)
CREATE TABLE IF NOT EXISTS public.candidate_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.candidate_job_applications(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  
  from_status pipeline_status,
  to_status pipeline_status NOT NULL,
  changed_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_days INTEGER,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Application History (tracks past applications across JOs)
CREATE TABLE IF NOT EXISTS public.application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  job_order_id UUID REFERENCES public.job_orders(id) ON DELETE SET NULL,
  jo_number TEXT,
  jo_title TEXT,
  
  applied_date DATE NOT NULL,
  furthest_stage pipeline_status,
  outcome TEXT,
  historical_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Activity Logs (audit trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. CV Uploaders (for autocomplete)
CREATE TABLE IF NOT EXISTS public.cv_uploaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_orders_status ON public.job_orders(status);
CREATE INDEX IF NOT EXISTS idx_job_orders_created_at ON public.job_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_status ON public.candidate_job_applications(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_job_order ON public.candidate_job_applications(job_order_id);
CREATE INDEX IF NOT EXISTS idx_candidate_timeline_application ON public.candidate_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_application_history_candidate ON public.application_history(candidate_id);

-- Insert default departments
INSERT INTO public.departments (name) VALUES
  ('Engineering'),
  ('Product'),
  ('Design'),
  ('Marketing'),
  ('Sales'),
  ('HR'),
  ('Finance'),
  ('Operations'),
  ('Legal'),
  ('Customer Support')
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_orders_updated_at ON public.job_orders;
CREATE TRIGGER update_job_orders_updated_at BEFORE UPDATE ON public.job_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_applications_updated_at ON public.candidate_job_applications;
CREATE TRIGGER update_candidate_applications_updated_at BEFORE UPDATE ON public.candidate_job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_interviews_updated_at ON public.hr_interviews;
CREATE TRIGGER update_hr_interviews_updated_at BEFORE UPDATE ON public.hr_interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tech_interviews_updated_at ON public.tech_interviews;
CREATE TRIGGER update_tech_interviews_updated_at BEFORE UPDATE ON public.tech_interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_uploaders ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Departments: readable by all authenticated
CREATE POLICY "Departments are viewable by authenticated users" ON public.departments
  FOR SELECT TO authenticated USING (true);

-- Job Orders: readable by all authenticated, writable by authenticated
CREATE POLICY "Job orders are viewable by authenticated users" ON public.job_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create job orders" ON public.job_orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update job orders" ON public.job_orders
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete job orders" ON public.job_orders
  FOR DELETE TO authenticated USING (true);

-- Candidates: full access for authenticated users
CREATE POLICY "Candidates are viewable by authenticated users" ON public.candidates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create candidates" ON public.candidates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates" ON public.candidates
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete candidates" ON public.candidates
  FOR DELETE TO authenticated USING (true);

-- Work Experience: follows candidate access
CREATE POLICY "Work experience viewable by authenticated" ON public.candidate_work_experience
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage work experience" ON public.candidate_work_experience
  FOR ALL TO authenticated USING (true);

-- Applications: full access for authenticated
CREATE POLICY "Applications viewable by authenticated" ON public.candidate_job_applications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage applications" ON public.candidate_job_applications
  FOR ALL TO authenticated USING (true);

-- HR Interviews: full access for authenticated
CREATE POLICY "HR interviews viewable by authenticated" ON public.hr_interviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage HR interviews" ON public.hr_interviews
  FOR ALL TO authenticated USING (true);

-- Tech Interviews: full access for authenticated
CREATE POLICY "Tech interviews viewable by authenticated" ON public.tech_interviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage tech interviews" ON public.tech_interviews
  FOR ALL TO authenticated USING (true);

-- Timeline: full access for authenticated
CREATE POLICY "Timeline viewable by authenticated" ON public.candidate_timeline
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage timeline" ON public.candidate_timeline
  FOR ALL TO authenticated USING (true);

-- Application History: full access for authenticated
CREATE POLICY "History viewable by authenticated" ON public.application_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage history" ON public.application_history
  FOR ALL TO authenticated USING (true);

-- Activity Logs: viewable by admins, insertable by authenticated
CREATE POLICY "Activity logs viewable by authenticated" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- CV Uploaders: full access for authenticated
CREATE POLICY "CV uploaders viewable by authenticated" ON public.cv_uploaders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage CV uploaders" ON public.cv_uploaders
  FOR ALL TO authenticated USING (true);

-- User Roles: users can see their own roles, admins can see all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
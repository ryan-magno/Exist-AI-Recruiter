import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
} | undefined;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Column whitelists for SQL injection prevention
const ALLOWED_JOB_ORDER_COLUMNS = [
  'jo_number', 'title', 'description', 'department_name', 'department_id',
  'level', 'quantity', 'hired_count', 'employment_type', 'requestor_name',
  'required_date', 'status', 'created_by'
];

const ALLOWED_CANDIDATE_COLUMNS = [
  'full_name', 'email', 'phone', 'applicant_type', 'skills', 'positions_fit_for',
  'years_of_experience', 'educational_background', 'cv_url', 'cv_filename',
  'availability', 'preferred_work_setup', 'expected_salary', 'earliest_start_date',
  'uploaded_by', 'uploaded_by_user_id',
  // New schema fields
  'linkedin', 'current_position', 'current_company', 'years_of_experience_text',
  'overall_summary', 'strengths', 'weaknesses',
  'qualification_score', 'preferred_employment_type',
  'internal_upload_reason', 'internal_from_date', 'internal_to_date',
  'google_drive_file_id', 'google_drive_file_url',
  'batch_id', 'batch_created_at',
  // Processing status fields
  'processing_status', 'processing_batch_id'
];

const ALLOWED_APPLICATION_COLUMNS = [
  'pipeline_status', 'match_score', 'tech_interview_result', 'employment_type',
  'working_conditions', 'remarks', 'applied_date'
];

// Validate column name against whitelist
function validateColumns(body: Record<string, unknown>, allowedColumns: string[]): Record<string, unknown> {
  const validated: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedColumns.includes(key)) {
      validated[key] = value;
    } else {
      console.warn(`Blocked invalid column name: ${key}`);
    }
  }
  return validated;
}

// Create a single client per request (lazy connection)
function createPgClient() {
  return new Client({
    hostname: Deno.env.get("AZURE_PG_HOST"),
    user: Deno.env.get("AZURE_PG_USER"),
    password: Deno.env.get("AZURE_PG_PASSWORD"),
    database: Deno.env.get("AZURE_PG_DATABASE"),
    port: parseInt(Deno.env.get("AZURE_PG_PORT") || "5432"),
    tls: { enabled: true, enforce: false },
  });
}

// Request-scoped client holder
let requestClient: Client | null = null;

async function getClient(): Promise<Client> {
  if (!requestClient) {
    requestClient = createPgClient();
    await requestClient.connect();
  }
  return requestClient;
}

async function closeClient() {
  if (requestClient) {
    try {
      await requestClient.end();
    } catch (e) {
      console.error("Error closing client:", e);
    }
    requestClient = null;
  }
}

async function query(sql: string, params: unknown[] = []) {
  const client = await getClient();
  const result = await client.queryObject(sql, params);
  return result.rows;
}

async function execute(sql: string, params: unknown[] = []) {
  const client = await getClient();
  await client.queryObject(sql, params);
  return { success: true };
}

// Initialize tables with NEW schema
async function initTables() {
  const createTablesSql = `
    -- Create enums if they don't exist
    DO $$ BEGIN
      CREATE TYPE pipeline_status_enum AS ENUM ('hr_interview', 'tech_interview', 'offer', 'hired', 'rejected');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE applicant_type_enum AS ENUM ('internal', 'external');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE employment_type_enum AS ENUM ('full_time', 'part_time', 'contract');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE job_level_enum AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE job_status_enum AS ENUM ('open', 'closed', 'on_hold', 'pooling', 'archived');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE interview_verdict_enum AS ENUM ('pass', 'fail', 'conditional', 'pending');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE offer_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Departments table
    CREATE TABLE IF NOT EXISTS departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- CV Uploaders table
    CREATE TABLE IF NOT EXISTS cv_uploaders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Job Orders table
    CREATE TABLE IF NOT EXISTS job_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      jo_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      department_name TEXT,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      level job_level_enum NOT NULL,
      quantity INTEGER DEFAULT 1,
      hired_count INTEGER DEFAULT 0,
      employment_type employment_type_enum NOT NULL,
      requestor_name TEXT,
      required_date DATE,
      status job_status_enum DEFAULT 'open',
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidates table
    CREATE TABLE IF NOT EXISTS candidates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      applicant_type applicant_type_enum DEFAULT 'external',
      skills TEXT[],
      positions_fit_for TEXT[],
      years_of_experience INTEGER,
      years_of_experience_text TEXT,
      educational_background TEXT,
      current_position TEXT,
      current_company TEXT,
      cv_url TEXT,
      cv_filename TEXT,
      availability TEXT,
      preferred_work_setup TEXT,
      preferred_employment_type employment_type_enum,
      expected_salary TEXT,
      earliest_start_date DATE,
      internal_upload_reason TEXT,
      internal_from_date DATE,
      internal_to_date DATE,
      linkedin TEXT,
      qualification_score INTEGER,
      overall_summary TEXT,
      strengths TEXT[],
      weaknesses TEXT[],
      batch_id UUID,
      batch_created_at TIMESTAMPTZ,
      processing_status TEXT DEFAULT 'completed',
      processing_batch_id UUID,
      processing_started_at TIMESTAMPTZ,
      processing_completed_at TIMESTAMPTZ,
      processing_index INTEGER,
      google_drive_file_id TEXT,
      google_drive_file_url TEXT,
      uploaded_by TEXT,
      uploaded_by_user_id UUID,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidate Education table
    CREATE TABLE IF NOT EXISTS candidate_education (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      year TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidate Certifications table
    CREATE TABLE IF NOT EXISTS candidate_certifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      issuer TEXT,
      year TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidate Work Experience table
    CREATE TABLE IF NOT EXISTS candidate_work_experience (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      job_title TEXT NOT NULL,
      duration TEXT,
      description TEXT,
      key_projects JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidate Job Applications
    CREATE TABLE IF NOT EXISTS candidate_job_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      job_order_id UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
      pipeline_status pipeline_status_enum NOT NULL DEFAULT 'hr_interview',
      match_score NUMERIC,
      employment_type employment_type_enum,
      tech_interview_result interview_verdict_enum,
      working_conditions TEXT,
      remarks TEXT,
      applied_date TIMESTAMPTZ DEFAULT now(),
      status_changed_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(candidate_id, job_order_id)
    );

    -- HR Interviews table
    CREATE TABLE IF NOT EXISTS hr_interviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL UNIQUE REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      interview_date DATE,
      interviewer_name TEXT,
      interview_mode TEXT,
      availability TEXT,
      expected_salary TEXT,
      preferred_work_setup TEXT,
      notice_period TEXT,
      communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
      motivation_rating INTEGER CHECK (motivation_rating >= 1 AND motivation_rating <= 5),
      cultural_fit_rating INTEGER CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
      professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
      strengths TEXT,
      concerns TEXT,
      verdict interview_verdict_enum,
      verdict_rationale TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Tech Interviews table
    CREATE TABLE IF NOT EXISTS tech_interviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL UNIQUE REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      interview_date DATE,
      interviewer_name TEXT,
      interview_mode TEXT,
      technical_knowledge_rating INTEGER CHECK (technical_knowledge_rating >= 1 AND technical_knowledge_rating <= 5),
      problem_solving_rating INTEGER CHECK (problem_solving_rating >= 1 AND problem_solving_rating <= 5),
      code_quality_rating INTEGER CHECK (code_quality_rating >= 1 AND code_quality_rating <= 5),
      system_design_rating INTEGER CHECK (system_design_rating >= 1 AND system_design_rating <= 5),
      coding_challenge_score INTEGER,
      coding_challenge_notes TEXT,
      technical_strengths TEXT,
      areas_for_improvement TEXT,
      verdict interview_verdict_enum,
      verdict_rationale TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidate Timeline table
    CREATE TABLE IF NOT EXISTS candidate_timeline (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      from_status pipeline_status_enum,
      to_status pipeline_status_enum NOT NULL,
      changed_date TIMESTAMPTZ DEFAULT now(),
      changed_by UUID,
      duration_days INTEGER,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Application History table
    CREATE TABLE IF NOT EXISTS application_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      job_order_id UUID REFERENCES job_orders(id),
      jo_number TEXT,
      jo_title TEXT,
      applied_date DATE NOT NULL,
      furthest_stage pipeline_status_enum,
      outcome TEXT,
      historical_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Offers table
    CREATE TABLE IF NOT EXISTS offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL UNIQUE REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      offer_date DATE,
      expiry_date DATE,
      offer_amount TEXT,
      position TEXT,
      start_date DATE,
      status offer_status_enum DEFAULT 'pending',
      benefits TEXT,
      remarks TEXT,
      negotiation_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Create update_updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  await execute(createTablesSql);
  console.log("Tables initialized successfully");
}

// Seed departments only (no synthetic job orders)
async function seedData() {
  await execute(`
    INSERT INTO departments (name) VALUES 
    ('Engineering'), ('Product'), ('Design'), ('Sales'), ('Marketing'), 
    ('Human Resources'), ('Finance'), ('Operations'), ('Legal'), ('Customer Success')
    ON CONFLICT (name) DO NOTHING
  `);
  console.log("Departments seeded successfully");
}

// Recreate database with full SQL script
async function recreateDatabase() {
  console.log("=== RECREATING DATABASE ===");
  
  const recreateSql = `
    -- Drop existing tables (in correct order due to foreign key dependencies)
    DROP TABLE IF EXISTS candidate_timeline CASCADE;
    DROP TABLE IF EXISTS tech_interviews CASCADE;
    DROP TABLE IF EXISTS hr_interviews CASCADE;
    DROP TABLE IF EXISTS offers CASCADE;
    DROP TABLE IF EXISTS application_history CASCADE;
    DROP TABLE IF EXISTS candidate_job_applications CASCADE;
    DROP TABLE IF EXISTS candidate_work_experience CASCADE;
    DROP TABLE IF EXISTS candidate_certifications CASCADE;
    DROP TABLE IF EXISTS candidate_education CASCADE;
    DROP TABLE IF EXISTS candidates CASCADE;
    DROP TABLE IF EXISTS job_orders CASCADE;
    DROP TABLE IF EXISTS departments CASCADE;
    DROP TABLE IF EXISTS cv_uploaders CASCADE;
    
    -- Drop existing enum types
    DROP TYPE IF EXISTS pipeline_status_enum CASCADE;
    DROP TYPE IF EXISTS applicant_type_enum CASCADE;
    DROP TYPE IF EXISTS employment_type_enum CASCADE;
    DROP TYPE IF EXISTS job_level_enum CASCADE;
    DROP TYPE IF EXISTS job_status_enum CASCADE;
    DROP TYPE IF EXISTS interview_verdict_enum CASCADE;
    DROP TYPE IF EXISTS offer_status_enum CASCADE;
    -- Also drop old enum types
    DROP TYPE IF EXISTS pipeline_status CASCADE;
    DROP TYPE IF EXISTS applicant_type CASCADE;
    DROP TYPE IF EXISTS employment_type CASCADE;
    DROP TYPE IF EXISTS job_level CASCADE;
    DROP TYPE IF EXISTS job_order_status CASCADE;
    DROP TYPE IF EXISTS hr_verdict CASCADE;
    DROP TYPE IF EXISTS tech_verdict CASCADE;
    DROP TYPE IF EXISTS offer_status CASCADE;
    DROP TYPE IF EXISTS tech_interview_result CASCADE;
    DROP TYPE IF EXISTS processing_status_enum CASCADE;
    
    -- Create new enum types
    CREATE TYPE pipeline_status_enum AS ENUM ('hr_interview', 'tech_interview', 'offer', 'hired', 'rejected');
    CREATE TYPE applicant_type_enum AS ENUM ('internal', 'external');
    CREATE TYPE employment_type_enum AS ENUM ('full_time', 'part_time', 'contract');
    CREATE TYPE job_level_enum AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5');
    CREATE TYPE job_status_enum AS ENUM ('open', 'closed', 'on_hold', 'pooling', 'archived');
    CREATE TYPE interview_verdict_enum AS ENUM ('pass', 'fail', 'conditional', 'pending');
    CREATE TYPE offer_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');
    
    -- Create tables
    CREATE TABLE departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE cv_uploaders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE job_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      jo_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      department_name TEXT,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      level job_level_enum NOT NULL,
      quantity INTEGER,
      hired_count INTEGER DEFAULT 0,
      employment_type employment_type_enum NOT NULL,
      requestor_name TEXT,
      required_date DATE,
      status job_status_enum DEFAULT 'open',
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE candidates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      applicant_type applicant_type_enum,
      skills TEXT[],
      positions_fit_for TEXT[],
      years_of_experience INTEGER,
      years_of_experience_text TEXT,
      educational_background TEXT,
      current_position TEXT,
      current_company TEXT,
      cv_url TEXT,
      cv_filename TEXT,
      availability TEXT,
      preferred_work_setup TEXT,
      preferred_employment_type employment_type_enum,
      expected_salary TEXT,
      earliest_start_date DATE,
      internal_upload_reason TEXT,
      internal_from_date DATE,
      internal_to_date DATE,
      linkedin TEXT,
      qualification_score INTEGER,
      overall_summary TEXT,
      strengths TEXT[],
      weaknesses TEXT[],
      batch_id UUID,
      batch_created_at TIMESTAMPTZ,
      processing_status TEXT,
      processing_batch_id UUID,
      processing_started_at TIMESTAMPTZ,
      processing_completed_at TIMESTAMPTZ,
      processing_index INTEGER,
      google_drive_file_id TEXT,
      google_drive_file_url TEXT,
      uploaded_by TEXT,
      uploaded_by_user_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE candidate_education (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      year TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE candidate_certifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      issuer TEXT,
      year TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE candidate_work_experience (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      job_title TEXT NOT NULL,
      duration TEXT,
      description TEXT,
      key_projects JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE candidate_job_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      job_order_id UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
      pipeline_status pipeline_status_enum NOT NULL DEFAULT 'hr_interview',
      match_score NUMERIC,
      employment_type employment_type_enum,
      tech_interview_result interview_verdict_enum,
      working_conditions TEXT,
      remarks TEXT,
      applied_date TIMESTAMPTZ DEFAULT NOW(),
      status_changed_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(candidate_id, job_order_id)
    );
    
    CREATE TABLE candidate_timeline (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      from_status pipeline_status_enum,
      to_status pipeline_status_enum NOT NULL,
      changed_date TIMESTAMPTZ DEFAULT NOW(),
      changed_by UUID,
      duration_days INTEGER,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE application_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      job_order_id UUID,
      jo_number TEXT,
      jo_title TEXT,
      applied_date DATE NOT NULL,
      furthest_stage pipeline_status_enum,
      outcome TEXT,
      historical_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE hr_interviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      interview_date DATE,
      interviewer_name TEXT,
      interview_mode TEXT,
      availability TEXT,
      expected_salary TEXT,
      preferred_work_setup TEXT,
      notice_period TEXT,
      communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
      motivation_rating INTEGER CHECK (motivation_rating BETWEEN 1 AND 5),
      cultural_fit_rating INTEGER CHECK (cultural_fit_rating BETWEEN 1 AND 5),
      professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
      strengths TEXT,
      concerns TEXT,
      verdict interview_verdict_enum,
      verdict_rationale TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE tech_interviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      interview_date DATE,
      interviewer_name TEXT,
      interview_mode TEXT,
      technical_knowledge_rating INTEGER CHECK (technical_knowledge_rating BETWEEN 1 AND 5),
      problem_solving_rating INTEGER CHECK (problem_solving_rating BETWEEN 1 AND 5),
      code_quality_rating INTEGER CHECK (code_quality_rating BETWEEN 1 AND 5),
      system_design_rating INTEGER CHECK (system_design_rating BETWEEN 1 AND 5),
      coding_challenge_score INTEGER,
      coding_challenge_notes TEXT,
      technical_strengths TEXT,
      areas_for_improvement TEXT,
      verdict interview_verdict_enum,
      verdict_rationale TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      offer_date DATE,
      expiry_date DATE,
      offer_amount TEXT,
      position TEXT,
      start_date DATE,
      status offer_status_enum DEFAULT 'pending',
      benefits TEXT,
      remarks TEXT,
      negotiation_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX idx_candidates_email ON candidates(email);
    CREATE INDEX idx_candidates_applicant_type ON candidates(applicant_type);
    CREATE INDEX idx_candidates_batch_id ON candidates(batch_id);
    CREATE INDEX idx_applications_candidate_id ON candidate_job_applications(candidate_id);
    CREATE INDEX idx_applications_job_order_id ON candidate_job_applications(job_order_id);
    CREATE INDEX idx_applications_pipeline_status ON candidate_job_applications(pipeline_status);
    CREATE INDEX idx_timeline_application_id ON candidate_timeline(application_id);
    CREATE INDEX idx_timeline_candidate_id ON candidate_timeline(candidate_id);
    CREATE INDEX idx_work_exp_candidate_id ON candidate_work_experience(candidate_id);
    CREATE INDEX idx_education_candidate_id ON candidate_education(candidate_id);
    CREATE INDEX idx_certifications_candidate_id ON candidate_certifications(candidate_id);
    CREATE INDEX idx_hr_interviews_application_id ON hr_interviews(application_id);
    CREATE INDEX idx_tech_interviews_application_id ON tech_interviews(application_id);
    CREATE INDEX idx_offers_application_id ON offers(application_id);
    CREATE INDEX idx_offers_status ON offers(status);
    CREATE INDEX idx_job_orders_status ON job_orders(status);
    CREATE INDEX idx_job_orders_department_id ON job_orders(department_id);
    
    -- Create triggers
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_job_orders_updated_at BEFORE UPDATE ON job_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON candidate_job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_hr_interviews_updated_at BEFORE UPDATE ON hr_interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_tech_interviews_updated_at BEFORE UPDATE ON tech_interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    -- Seed departments
    INSERT INTO departments (name) VALUES
    ('Engineering'), ('Product'), ('Design'), ('Sales'), ('Marketing'),
    ('Operations'), ('Finance'), ('Human Resources')
    ON CONFLICT DO NOTHING;
  `;
  
  await execute(recreateSql);
  console.log("=== DATABASE RECREATED SUCCESSFULLY ===");
}

// Create candidate from webhook data
async function createCandidateFromWebhook(body: any) {
  const { webhook_output, uploader_name, applicant_type, job_order_id, internal_metadata } = body;
  const output = webhook_output;
  
  console.log("Processing webhook candidate:", output.candidate_info?.full_name);
  
  const candidateInfo = output.candidate_info || {};
  const workHistory = output.work_history || {};
  const currentOcc = candidateInfo.current_occupation || workHistory.current_occupation || {};
  
  // Insert candidate with split current_position / current_company
  const candidateResult = await query(`
    INSERT INTO candidates (
      full_name, email, phone, applicant_type, skills, 
      linkedin, current_position, current_company, years_of_experience_text,
      overall_summary, strengths, weaknesses, qualification_score,
      uploaded_by, processing_status, processing_completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'completed', now())
    RETURNING *
  `, [
    candidateInfo.full_name || 'Unknown',
    candidateInfo.email || null,
    candidateInfo.phone || null,
    applicant_type || 'external',
    output.key_skills || workHistory.key_skills || [],
    candidateInfo.linkedin || null,
    currentOcc.title || null,
    currentOcc.company || null,
    candidateInfo.years_of_experience || workHistory.total_experience || null,
    output.overall_summary || null,
    output.strengths || [],
    output.weaknesses || [],
    output.qualification_score || null,
    uploader_name || null
  ]);
  
  const candidate = candidateResult[0] as any;
  const candidateId = candidate.id;
  
  // Insert education records
  if (output.education && Array.isArray(output.education)) {
    for (const edu of output.education) {
      await execute(`
        INSERT INTO candidate_education (candidate_id, degree, institution, year)
        VALUES ($1, $2, $3, $4)
      `, [candidateId, edu.degree || 'Unknown', edu.institution || 'Unknown', edu.year || null]);
    }
  }
  
  // Insert certification records
  if (output.certifications && Array.isArray(output.certifications)) {
    for (const cert of output.certifications) {
      await execute(`
        INSERT INTO candidate_certifications (candidate_id, name, issuer, year)
        VALUES ($1, $2, $3, $4)
      `, [candidateId, cert.name || 'Unknown', cert.issuer || null, cert.year || null]);
    }
  }
  
  // Insert work experience records (new schema: duration text, key_projects JSONB, no is_current)
  if (workHistory.work_experience && Array.isArray(workHistory.work_experience)) {
    for (const exp of workHistory.work_experience) {
      await execute(`
        INSERT INTO candidate_work_experience (
          candidate_id, company_name, job_title, description, duration, key_projects
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `, [
        candidateId, 
        exp.company || 'Unknown', 
        exp.job_title || 'Unknown', 
        exp.summary || null,
        exp.duration || null,
        JSON.stringify(exp.key_projects || [])
      ]);
    }
  }
  
  // Create application if job_order_id provided
  let application = null;
  if (job_order_id) {
    try {
      const appResult = await query(`
        INSERT INTO candidate_job_applications (candidate_id, job_order_id, match_score, pipeline_status)
        VALUES ($1, $2, $3, 'hr_interview')
        RETURNING *
      `, [candidateId, job_order_id, output.qualification_score || null]);
      application = appResult[0];
      
      // Create initial timeline entry
      await execute(`
        INSERT INTO candidate_timeline (application_id, candidate_id, to_status)
        VALUES ($1, $2, 'hr_interview')
      `, [(application as any).id, candidateId]);
    } catch (err) {
      console.error("Error creating application:", err);
    }
  }
  
  return { candidate, application };
}

// Get candidate with full details
async function getCandidateFull(id: string) {
  const candidates = await query("SELECT * FROM candidates WHERE id = $1", [id]);
  if (candidates.length === 0) return null;
  
  const candidate = candidates[0] as any;
  
  const education = await query(
    "SELECT * FROM candidate_education WHERE candidate_id = $1 ORDER BY year DESC NULLS LAST",
    [id]
  );
  
  const certifications = await query(
    "SELECT * FROM candidate_certifications WHERE candidate_id = $1 ORDER BY year DESC NULLS LAST",
    [id]
  );
  
  const workExperiences = await query(
    "SELECT * FROM candidate_work_experience WHERE candidate_id = $1 ORDER BY created_at DESC",
    [id]
  );
  
  return {
    ...candidate,
    education,
    certifications,
    work_experiences: workExperiences
  };
}

// Route handlers
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/azure-db', '');
  const method = req.method;

  console.log(`${method} ${path}`);

  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // =====================================================
    // RECREATE DATABASE ENDPOINT
    // =====================================================
    if (path === '/recreate-db' && method === 'POST') {
      console.log('=== RECREATE DATABASE REQUEST ===');
      await recreateDatabase();
      return jsonResponse({ success: true, message: 'Database recreated successfully. All tables dropped and recreated with new schema.' });
    }

    // =====================================================
    // WEBHOOK CALLBACK ENDPOINT
    // =====================================================
    if (path === '/webhook-callback' && method === 'POST') {
      const body = await req.json();
      console.log('=== WEBHOOK CALLBACK RECEIVED ===');
      console.log('Raw payload (first 1000 chars):', JSON.stringify(body).substring(0, 1000));
      
      let dataItems: any[] = [];
      
      if (Array.isArray(body)) {
        dataItems = body.map(item => item.output || item);
      } else if (body.output) {
        dataItems = [body.output];
      } else if (body.candidate_info) {
        dataItems = [body];
      } else {
        return jsonResponse({ error: 'Invalid payload structure', keys: Object.keys(body) }, 400);
      }
      
      for (const data of dataItems) {
        if (!data.candidate_info) continue;
        
        const metadata = data.metadata || {};
        const candidateInfo = data.candidate_info || {};
        const workHistory = data.work_history || {};
        
        let candidateId: string | null = null;
        
        // Strategy 1: Find by batch_id and index
        if (metadata.batch_id !== undefined && metadata.index !== undefined) {
          const candidates = await query(`
            SELECT id FROM candidates 
            WHERE processing_batch_id = $1 AND processing_index = $2 AND processing_status = 'processing'
          `, [metadata.batch_id, metadata.index]);
          if (candidates.length > 0) candidateId = (candidates[0] as any).id;
        }
        
        // Strategy 2: Find by email
        if (!candidateId && candidateInfo.email) {
          const candidates = await query(`
            SELECT id FROM candidates 
            WHERE email = $1 AND processing_status = 'processing'
            ORDER BY created_at DESC LIMIT 1
          `, [candidateInfo.email]);
          if (candidates.length > 0) candidateId = (candidates[0] as any).id;
        }
        
        // Strategy 3: Find by cv_filename
        if (!candidateId && metadata.filename) {
          const candidates = await query(`
            SELECT id FROM candidates 
            WHERE cv_filename = $1 AND processing_status = 'processing'
            ORDER BY created_at DESC LIMIT 1
          `, [metadata.filename]);
          if (candidates.length > 0) candidateId = (candidates[0] as any).id;
        }
        
        // Strategy 4: Find most recent processing candidate
        if (!candidateId) {
          const candidates = await query(`
            SELECT id FROM candidates 
            WHERE processing_status = 'processing'
            ORDER BY processing_started_at DESC LIMIT 1
          `);
          if (candidates.length > 0) candidateId = (candidates[0] as any).id;
        }
        
        const currentOcc = candidateInfo.current_occupation;
        
        if (!candidateId) {
          // Create new candidate record
          const result = await query(`
            INSERT INTO candidates (
              full_name, email, phone, applicant_type, skills, 
              linkedin, current_position, current_company, years_of_experience_text,
              overall_summary, strengths, weaknesses, qualification_score,
              processing_status, processing_completed_at
            ) VALUES ($1, $2, $3, 'external', $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed', now())
            RETURNING id
          `, [
            candidateInfo.full_name || 'Unknown',
            candidateInfo.email || null,
            candidateInfo.phone || null,
            data.key_skills || workHistory.key_skills || [],
            candidateInfo.linkedin || null,
            currentOcc?.title || null,
            currentOcc?.company || null,
            candidateInfo.years_of_experience || workHistory.total_experience || null,
            data.overall_summary || null,
            data.strengths || [],
            data.weaknesses || [],
            data.qualification_score || null
          ]);
          candidateId = (result[0] as any).id;
        } else {
          // Update existing candidate
          await execute(`
            UPDATE candidates SET
              full_name = COALESCE($1, full_name),
              email = COALESCE($2, email),
              phone = COALESCE($3, phone),
              skills = $4,
              linkedin = $5,
              current_position = $6,
              current_company = $7,
              years_of_experience_text = $8,
              overall_summary = $9,
              strengths = $10,
              weaknesses = $11,
              qualification_score = $12,
              processing_status = 'completed',
              processing_completed_at = now(),
              updated_at = now()
            WHERE id = $13
          `, [
            candidateInfo.full_name || null,
            candidateInfo.email || null,
            candidateInfo.phone || null,
            data.key_skills || workHistory.key_skills || [],
            candidateInfo.linkedin || null,
            currentOcc?.title || null,
            currentOcc?.company || null,
            candidateInfo.years_of_experience || workHistory.total_experience || null,
            data.overall_summary || null,
            data.strengths || [],
            data.weaknesses || [],
            data.qualification_score || null,
            candidateId
          ]);
        }
        
        // Clear existing related data for idempotency
        await execute('DELETE FROM candidate_education WHERE candidate_id = $1', [candidateId]);
        await execute('DELETE FROM candidate_certifications WHERE candidate_id = $1', [candidateId]);
        await execute('DELETE FROM candidate_work_experience WHERE candidate_id = $1', [candidateId]);
        
        // Insert education
        if (data.education && Array.isArray(data.education)) {
          for (const edu of data.education) {
            await execute(`
              INSERT INTO candidate_education (candidate_id, degree, institution, year)
              VALUES ($1, $2, $3, $4)
            `, [candidateId, edu.degree || 'Unknown', edu.institution || 'Unknown', edu.year || null]);
          }
        }
        
        // Insert certifications
        if (data.certifications && Array.isArray(data.certifications)) {
          for (const cert of data.certifications) {
            await execute(`
              INSERT INTO candidate_certifications (candidate_id, name, issuer, year)
              VALUES ($1, $2, $3, $4)
            `, [candidateId, cert.name || 'Unknown', cert.issuer || null, cert.year || null]);
          }
        }
        
        // Insert work experiences (new schema)
        if (workHistory.work_experience && Array.isArray(workHistory.work_experience)) {
          for (const exp of workHistory.work_experience) {
            await execute(`
              INSERT INTO candidate_work_experience (
                candidate_id, company_name, job_title, description, duration, key_projects
              ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
            `, [
              candidateId, 
              exp.company || 'Unknown', 
              exp.job_title || 'Unknown', 
              exp.summary || null,
              exp.duration || null,
              JSON.stringify(exp.key_projects || [])
            ]);
          }
        }
        
        // Create application if job_order_id in metadata
        const jobOrderId = metadata.job_order_id;
        if (jobOrderId) {
          try {
            const appResult = await query(`
              INSERT INTO candidate_job_applications (candidate_id, job_order_id, match_score, pipeline_status)
              VALUES ($1, $2, $3, 'hr_interview')
              ON CONFLICT (candidate_id, job_order_id) DO UPDATE SET match_score = EXCLUDED.match_score
              RETURNING *
            `, [candidateId, jobOrderId, data.qualification_score || null]);
            
            if (appResult.length > 0) {
              const application = appResult[0] as any;
              await execute(`
                INSERT INTO candidate_timeline (application_id, candidate_id, to_status)
                VALUES ($1, $2, 'hr_interview')
              `, [application.id, candidateId]);
            }
          } catch (err) {
            console.error("Error creating application from webhook callback:", err);
          }
        }
      }
      
      return jsonResponse({ success: true, message: 'Webhook callback processed' });
    }

    // =====================================================
    // WEBHOOK PROXY
    // =====================================================
    if (path === '/webhook-proxy' && method === 'POST') {
      const formData = await req.formData();
      const webhookUrl = 'https://workflow.exist.com.ph/webhook/vector-db-loader';
      
      const metadataStr = formData.get('metadata') as string;
      const uploaderName = formData.get('uploader_name') as string;
      let metadata: any[] = [];
      try { metadata = JSON.parse(metadataStr || '[]'); } catch (e) { console.error('Failed to parse metadata:', e); }
      
      const batchId = crypto.randomUUID();
      console.log(`Starting webhook proxy, batch: ${batchId}, files: ${metadata.length}`);
      
      const processingCandidates: string[] = [];
      for (let i = 0; i < metadata.length; i++) {
        const fileMeta = metadata[i];
        try {
          const result = await query(`
            INSERT INTO candidates (
              full_name, applicant_type, uploaded_by, cv_filename,
              processing_status, processing_batch_id, processing_started_at, processing_index
            ) VALUES ($1, $2, $3, $4, 'processing', $5, now(), $6)
            RETURNING id
          `, [
            `Processing CV ${i + 1}...`,
            fileMeta.applicant_type || 'external',
            uploaderName || null,
            fileMeta.filename || null,
            batchId,
            i
          ]);
          processingCandidates.push((result[0] as any).id);
        } catch (err) {
          console.error(`Error creating processing placeholder for file ${i}:`, err);
        }
      }
      
      const callbackUrl = `${Deno.env.get("SUPABASE_URL") || 'https://azzbrbfcaxphrnpfdgle.supabase.co'}/functions/v1/azure-db/webhook-callback`;
      const enrichedMetadata = metadata.map((m, idx) => ({
        ...m,
        batch_id: batchId,
        index: idx,
        callback_url: callbackUrl
      }));
      
      formData.set('metadata', JSON.stringify(enrichedMetadata));
      
      const backgroundTask = async () => {
        try {
          console.log(`[${batchId}] Calling webhook: ${webhookUrl}`);
          const response = await fetch(webhookUrl, { method: 'POST', body: formData });
          
          if (!response.ok) {
            console.error(`[${batchId}] Webhook error: ${response.status}`);
            for (const candidateId of processingCandidates) {
              try {
                const errClient = createPgClient();
                await errClient.connect();
                await errClient.queryObject(`UPDATE candidates SET processing_status = 'failed', updated_at = now() WHERE id = $1`, [candidateId]);
                await errClient.end();
              } catch (e) { console.error(`Failed to mark ${candidateId} as failed:`, e); }
            }
            return;
          }
          
          let responseData;
          try { responseData = await response.json(); } catch { responseData = null; }
          
          if (responseData) {
            const items = Array.isArray(responseData) ? responseData : [responseData];
            
            for (let i = 0; i < items.length && i < processingCandidates.length; i++) {
              const candidateId = processingCandidates[i];
              const item = items[i];
              const webhookOutput = item.output || item;
              
              if (!webhookOutput.candidate_info) continue;
              
              try {
                const bgClient = createPgClient();
                await bgClient.connect();
                
                const candidateInfo = webhookOutput.candidate_info || {};
                const workHistory = webhookOutput.work_history || {};
                const jobOrderId = metadata[i]?.job_order_id;
                const currentOcc = candidateInfo.current_occupation;
                
                await bgClient.queryObject(`
                  UPDATE candidates SET
                    full_name = $1, email = $2, phone = $3, skills = $4,
                    linkedin = $5, current_position = $6, current_company = $7,
                    years_of_experience_text = $8, overall_summary = $9,
                    strengths = $10, weaknesses = $11, qualification_score = $12,
                    processing_status = 'completed', processing_completed_at = now(), updated_at = now()
                  WHERE id = $13
                `, [
                  candidateInfo.full_name || 'Unknown',
                  candidateInfo.email || null,
                  candidateInfo.phone || null,
                  webhookOutput.key_skills || workHistory.key_skills || [],
                  candidateInfo.linkedin || null,
                  currentOcc?.title || null,
                  currentOcc?.company || null,
                  candidateInfo.years_of_experience || workHistory.total_experience || null,
                  webhookOutput.overall_summary || null,
                  webhookOutput.strengths || [],
                  webhookOutput.weaknesses || [],
                  webhookOutput.qualification_score || null,
                  candidateId
                ]);
                
                // Insert education
                if (webhookOutput.education && Array.isArray(webhookOutput.education)) {
                  for (const edu of webhookOutput.education) {
                    await bgClient.queryObject(`
                      INSERT INTO candidate_education (candidate_id, degree, institution, year)
                      VALUES ($1, $2, $3, $4)
                    `, [candidateId, edu.degree || 'Unknown', edu.institution || 'Unknown', edu.year || null]);
                  }
                }
                
                // Insert certifications
                if (webhookOutput.certifications && Array.isArray(webhookOutput.certifications)) {
                  for (const cert of webhookOutput.certifications) {
                    await bgClient.queryObject(`
                      INSERT INTO candidate_certifications (candidate_id, name, issuer, year)
                      VALUES ($1, $2, $3, $4)
                    `, [candidateId, cert.name || 'Unknown', cert.issuer || null, cert.year || null]);
                  }
                }
                
                // Insert work experiences (new schema)
                if (workHistory.work_experience && Array.isArray(workHistory.work_experience)) {
                  for (const exp of workHistory.work_experience) {
                    await bgClient.queryObject(`
                      INSERT INTO candidate_work_experience (
                        candidate_id, company_name, job_title, description, duration, key_projects
                      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
                    `, [
                      candidateId, exp.company || 'Unknown', exp.job_title || 'Unknown',
                      exp.summary || null, exp.duration || null,
                      JSON.stringify(exp.key_projects || [])
                    ]);
                  }
                }
                
                // Create application
                if (jobOrderId) {
                  try {
                    const appResult = await bgClient.queryObject(`
                      INSERT INTO candidate_job_applications (candidate_id, job_order_id, match_score, pipeline_status)
                      VALUES ($1, $2, $3, 'hr_interview')
                      ON CONFLICT (candidate_id, job_order_id) DO UPDATE SET match_score = EXCLUDED.match_score
                      RETURNING *
                    `, [candidateId, jobOrderId, webhookOutput.qualification_score || null]);
                    
                    if (appResult.rows.length > 0) {
                      const application = appResult.rows[0] as any;
                      await bgClient.queryObject(`
                        INSERT INTO candidate_timeline (application_id, candidate_id, to_status)
                        VALUES ($1, $2, 'hr_interview')
                      `, [application.id, candidateId]);
                    }
                  } catch (appErr) {
                    console.error(`[${batchId}] Error creating application:`, appErr);
                  }
                }
                
                await bgClient.end();
              } catch (dbError) {
                console.error(`[${batchId}] Error updating candidate ${candidateId}:`, dbError);
                try {
                  const errClient = createPgClient();
                  await errClient.connect();
                  await errClient.queryObject(`UPDATE candidates SET processing_status = 'failed', updated_at = now() WHERE id = $1`, [candidateId]);
                  await errClient.end();
                } catch (e) { console.error(`Failed to mark as failed:`, e); }
              }
            }
          }
        } catch (error) {
          console.error(`[${batchId}] Background task error:`, error);
          for (const candidateId of processingCandidates) {
            try {
              const errClient = createPgClient();
              await errClient.connect();
              await errClient.queryObject(`UPDATE candidates SET processing_status = 'failed', updated_at = now() WHERE id = $1`, [candidateId]);
              await errClient.end();
            } catch (e) { console.error(`Failed to mark ${candidateId} as failed:`, e); }
          }
        }
      };
      
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(backgroundTask());
      } else {
        backgroundTask();
      }
      
      return jsonResponse({ 
        status: 'processing',
        batch_id: batchId,
        candidate_ids: processingCandidates,
        message: 'CVs are being processed.'
      });
    }

    // Processing status
    if (path === '/candidates/processing-status' && method === 'GET') {
      const batchId = url.searchParams.get('batch_id');
      const since = url.searchParams.get('since');
      
      let sql = `SELECT id, full_name, processing_status, processing_batch_id, processing_started_at, 
             processing_completed_at, cv_filename, applicant_type, created_at FROM candidates
             WHERE processing_status IN ('processing', 'completed')`;
      const params: unknown[] = [];
      
      if (batchId) { params.push(batchId); sql += ` AND processing_batch_id = $${params.length}`; }
      if (since) { params.push(since); sql += ` AND (processing_completed_at > $${params.length} OR processing_status = 'processing')`; }
      sql += ' ORDER BY created_at DESC LIMIT 50';
      
      const rows = await query(sql, params);
      const statusCounts = await query(`
        SELECT processing_status, COUNT(*) as count FROM candidates 
        WHERE processing_status IN ('processing', 'completed')
        ${batchId ? `AND processing_batch_id = $1` : ''}
        GROUP BY processing_status
      `, batchId ? [batchId] : []);
      
      return jsonResponse({
        candidates: rows,
        counts: statusCounts.reduce((acc: any, row: any) => { acc[row.processing_status] = parseInt(row.count); return acc; }, {})
      });
    }

    // Cleanup
    if (path === '/candidates/cleanup' && method === 'POST') {
      await execute(`UPDATE candidates SET processing_status = 'failed' WHERE processing_status = 'processing' AND processing_started_at < now() - interval '10 minutes'`);
      const deleted = await query(`DELETE FROM candidates WHERE processing_status = 'failed' AND full_name LIKE 'Processing CV%' RETURNING id`);
      return jsonResponse({ success: true, deleted: deleted.length });
    }

    // Init
    if (path === '/init' && method === 'POST') {
      await initTables();
      await seedData();
      return jsonResponse({ success: true, message: 'Tables initialized and data seeded' });
    }

    // Job Order Webhook
    const JO_WEBHOOK_URL = 'https://workflow.exist.com.ph/webhook/job-order-webhook-path';
    
    async function sendJobOrderWebhook(jobOrder: any, action: 'create' | 'update' | 'delete') {
      try {
        const response = await fetch(JO_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...jobOrder })
        });
        console.log(`Job order webhook (${action}):`, response.status);
      } catch (err) {
        console.error(`Error sending job order webhook (${action}):`, err);
      }
    }

    // Job Orders
    if (path === '/job-orders') {
      if (method === 'GET') {
        const rows = await query("SELECT * FROM job_orders ORDER BY created_at DESC");
        return jsonResponse(rows);
      }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`
          INSERT INTO job_orders (jo_number, title, description, department_name, level, quantity, employment_type, requestor_name, required_date, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [body.jo_number, body.title, body.description, body.department_name, body.level, body.quantity, body.employment_type, body.requestor_name, body.required_date, body.status || 'open']);
        
        const created = result[0];
        if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(sendJobOrderWebhook(created, 'create'));
        else sendJobOrderWebhook(created, 'create').catch(console.error);
        return jsonResponse(created);
      }
    }

    if (path.startsWith('/job-orders/') && path.split('/')[2] !== 'count' && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();
      const validatedBody = validateColumns(body, ALLOWED_JOB_ORDER_COLUMNS);
      if (Object.keys(validatedBody).length === 0) return jsonResponse({ error: 'No valid columns to update' }, 400);
      
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      for (const [key, value] of Object.entries(validatedBody)) { updates.push(`${key} = $${idx}`); values.push(value); idx++; }
      updates.push(`updated_at = now()`);
      values.push(id);
      
      const result = await query(`UPDATE job_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      const updated = result[0];
      if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(sendJobOrderWebhook(updated, 'update'));
      else sendJobOrderWebhook(updated, 'update').catch(console.error);
      return jsonResponse(updated);
    }

    if (path.startsWith('/job-orders/') && path.split('/')[2] !== 'count' && method === 'DELETE') {
      const id = path.split('/')[2];
      const existing = await query("SELECT * FROM job_orders WHERE id = $1", [id]);
      await execute("DELETE FROM job_orders WHERE id = $1", [id]);
      if (existing[0]) {
        if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(sendJobOrderWebhook(existing[0], 'delete'));
        else sendJobOrderWebhook(existing[0], 'delete').catch(console.error);
      }
      return jsonResponse({ success: true });
    }

    // Candidates - from-webhook
    if (path === '/candidates/from-webhook' && method === 'POST') {
      const body = await req.json();
      const result = await createCandidateFromWebhook(body);
      return jsonResponse(result);
    }

    // Candidates
    if (path === '/candidates') {
      if (method === 'GET') {
        const includeProcessing = url.searchParams.get('include_processing') === 'true';
        let sql = "SELECT * FROM candidates";
        if (!includeProcessing) sql += " WHERE processing_status = 'completed' OR processing_status IS NULL";
        sql += " ORDER BY created_at DESC";
        const rows = await query(sql);
        return jsonResponse(rows);
      }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`
          INSERT INTO candidates (full_name, email, phone, applicant_type, skills, years_of_experience, educational_background, availability, preferred_work_setup, expected_salary, cv_url, cv_filename, uploaded_by, processing_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'completed')
          RETURNING *
        `, [body.full_name, body.email, body.phone, body.applicant_type || 'external', body.skills, body.years_of_experience, body.educational_background, body.availability, body.preferred_work_setup, body.expected_salary, body.cv_url, body.cv_filename, body.uploaded_by]);
        return jsonResponse(result[0]);
      }
    }

    // Candidate full
    if (path.match(/^\/candidates\/[^/]+\/full$/) && method === 'GET') {
      const id = path.split('/')[2];
      const result = await getCandidateFull(id);
      return jsonResponse(result);
    }

    if (path.startsWith('/candidates/') && !path.includes('/work-experience') && !path.includes('/full') && !path.includes('/processing') && method === 'GET') {
      const id = path.split('/')[2];
      const rows = await query("SELECT * FROM candidates WHERE id = $1", [id]);
      return jsonResponse(rows[0] || null);
    }

    if (path.startsWith('/candidates/') && !path.includes('/work-experience') && !path.includes('/full') && !path.includes('/processing') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();
      const validatedBody = validateColumns(body, ALLOWED_CANDIDATE_COLUMNS);
      if (Object.keys(validatedBody).length === 0) return jsonResponse({ error: 'No valid columns to update' }, 400);
      
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      for (const [key, value] of Object.entries(validatedBody)) { updates.push(`${key} = $${idx}`); values.push(value); idx++; }
      updates.push(`updated_at = now()`);
      values.push(id);
      
      const result = await query(`UPDATE candidates SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      return jsonResponse(result[0]);
    }

    if (path.startsWith('/candidates/') && !path.includes('/work-experience') && !path.includes('/full') && !path.includes('/processing') && method === 'DELETE') {
      const id = path.split('/')[2];
      await execute("DELETE FROM candidates WHERE id = $1", [id]);
      return jsonResponse({ success: true });
    }

    // Applications
    if (path === '/applications') {
      if (method === 'GET') {
        const jobOrderId = url.searchParams.get('job_order_id');
        const candidateId = url.searchParams.get('candidate_id');
        
        let sql = `
          SELECT a.*, c.full_name as candidate_name, c.email as candidate_email, c.skills, c.years_of_experience,
                 c.linkedin, c.current_position, c.current_company, c.overall_summary, c.strengths, c.weaknesses, c.applicant_type,
                 c.processing_status, c.qualification_score,
                 j.jo_number, j.title as job_title
          FROM candidate_job_applications a
          JOIN candidates c ON a.candidate_id = c.id
          JOIN job_orders j ON a.job_order_id = j.id
        `;
        const conditions: string[] = [];
        const params: unknown[] = [];
        
        if (jobOrderId) { conditions.push(`a.job_order_id = $${params.length + 1}`); params.push(jobOrderId); }
        if (candidateId) { conditions.push(`a.candidate_id = $${params.length + 1}`); params.push(candidateId); }
        
        if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
        sql += ' ORDER BY a.created_at DESC';
        
        const rows = await query(sql, params);
        return jsonResponse(rows);
      }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`
          INSERT INTO candidate_job_applications (candidate_id, job_order_id, pipeline_status, match_score, remarks)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [body.candidate_id, body.job_order_id, body.pipeline_status || 'hr_interview', body.match_score, body.remarks]);
        return jsonResponse(result[0]);
      }
    }

    if (path.startsWith('/applications/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();
      
      const current = await query("SELECT pipeline_status, candidate_id FROM candidate_job_applications WHERE id = $1", [id]);
      const fromStatus = current.length > 0 ? (current[0] as any).pipeline_status : null;
      const candidateId = current.length > 0 ? (current[0] as any).candidate_id : null;
      
      const validatedBody = validateColumns(body, ALLOWED_APPLICATION_COLUMNS);
      if (Object.keys(validatedBody).length === 0) return jsonResponse({ error: 'No valid columns to update' }, 400);
      
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      for (const [key, value] of Object.entries(validatedBody)) { updates.push(`${key} = $${idx}`); values.push(value); idx++; }
      
      if (validatedBody.pipeline_status && validatedBody.pipeline_status !== fromStatus) {
        updates.push(`status_changed_date = now()`);
      }
      updates.push(`updated_at = now()`);
      values.push(id);
      
      const result = await query(`UPDATE candidate_job_applications SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      
      // Create timeline entry if status changed
      if (validatedBody.pipeline_status && validatedBody.pipeline_status !== fromStatus && candidateId) {
        await execute(`
          INSERT INTO candidate_timeline (application_id, candidate_id, from_status, to_status)
          VALUES ($1, $2, $3, $4)
        `, [id, candidateId, fromStatus, validatedBody.pipeline_status]);
      }
      
      return jsonResponse(result[0]);
    }

    // Departments
    if (path === '/departments') {
      if (method === 'GET') { return jsonResponse(await query("SELECT * FROM departments ORDER BY name")); }
      if (method === 'POST') {
        const body = await req.json();
        if (!body.name?.trim()) return jsonResponse({ error: 'Department name is required' }, 400);
        const result = await query(`INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`, [body.name.trim()]);
        return jsonResponse(result[0]);
      }
    }

    if (path.startsWith('/departments/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();
      if (!body.name?.trim()) return jsonResponse({ error: 'Department name is required' }, 400);
      const result = await query(`UPDATE departments SET name = $1 WHERE id = $2 RETURNING *`, [body.name.trim(), id]);
      return jsonResponse(result[0] || { error: 'Not found' });
    }

    if (path.startsWith('/departments/') && method === 'DELETE') {
      const id = path.split('/')[2];
      const inUse = await query("SELECT COUNT(*) as count FROM job_orders WHERE department_id = $1", [id]);
      if (parseInt((inUse[0] as any).count) > 0) return jsonResponse({ error: 'Department in use' }, 400);
      await execute("DELETE FROM departments WHERE id = $1", [id]);
      return jsonResponse({ success: true });
    }

    // CV Uploaders
    if (path === '/cv-uploaders') {
      if (method === 'GET') { return jsonResponse(await query("SELECT * FROM cv_uploaders ORDER BY name")); }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`INSERT INTO cv_uploaders (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *`, [body.name]);
        return jsonResponse(result[0]);
      }
    }

    // HR Interviews
    if (path === '/hr-interviews') {
      if (method === 'GET') {
        const applicationId = url.searchParams.get('application_id');
        const candidateId = url.searchParams.get('candidate_id');
        if (applicationId) return jsonResponse((await query("SELECT * FROM hr_interviews WHERE application_id = $1", [applicationId]))[0] || null);
        if (candidateId) return jsonResponse(await query("SELECT * FROM hr_interviews WHERE candidate_id = $1 ORDER BY created_at DESC", [candidateId]));
        return jsonResponse(await query("SELECT * FROM hr_interviews ORDER BY created_at DESC"));
      }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`
          INSERT INTO hr_interviews (application_id, candidate_id, interview_date, interviewer_name, interview_mode, availability, expected_salary, preferred_work_setup, notice_period, communication_rating, motivation_rating, cultural_fit_rating, professionalism_rating, strengths, concerns, verdict, verdict_rationale)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (application_id) DO UPDATE SET
            interview_date = EXCLUDED.interview_date, interviewer_name = EXCLUDED.interviewer_name, interview_mode = EXCLUDED.interview_mode,
            availability = EXCLUDED.availability, expected_salary = EXCLUDED.expected_salary, preferred_work_setup = EXCLUDED.preferred_work_setup,
            notice_period = EXCLUDED.notice_period, communication_rating = EXCLUDED.communication_rating, motivation_rating = EXCLUDED.motivation_rating,
            cultural_fit_rating = EXCLUDED.cultural_fit_rating, professionalism_rating = EXCLUDED.professionalism_rating,
            strengths = EXCLUDED.strengths, concerns = EXCLUDED.concerns, verdict = EXCLUDED.verdict, verdict_rationale = EXCLUDED.verdict_rationale,
            updated_at = now()
          RETURNING *
        `, [body.application_id, body.candidate_id, body.interview_date, body.interviewer_name, body.interview_mode, body.availability, body.expected_salary, body.preferred_work_setup, body.notice_period, body.communication_rating, body.motivation_rating, body.cultural_fit_rating, body.professionalism_rating, body.strengths, body.concerns, body.verdict, body.verdict_rationale]);
        return jsonResponse(result[0]);
      }
    }

    // Tech Interviews
    if (path === '/tech-interviews') {
      if (method === 'GET') {
        const applicationId = url.searchParams.get('application_id');
        const candidateId = url.searchParams.get('candidate_id');
        if (applicationId) return jsonResponse((await query("SELECT * FROM tech_interviews WHERE application_id = $1", [applicationId]))[0] || null);
        if (candidateId) return jsonResponse(await query("SELECT * FROM tech_interviews WHERE candidate_id = $1 ORDER BY created_at DESC", [candidateId]));
        return jsonResponse(await query("SELECT * FROM tech_interviews ORDER BY created_at DESC"));
      }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`
          INSERT INTO tech_interviews (application_id, candidate_id, interview_date, interviewer_name, interview_mode, technical_knowledge_rating, problem_solving_rating, code_quality_rating, system_design_rating, coding_challenge_score, coding_challenge_notes, technical_strengths, areas_for_improvement, verdict, verdict_rationale)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (application_id) DO UPDATE SET
            interview_date = EXCLUDED.interview_date, interviewer_name = EXCLUDED.interviewer_name, interview_mode = EXCLUDED.interview_mode,
            technical_knowledge_rating = EXCLUDED.technical_knowledge_rating, problem_solving_rating = EXCLUDED.problem_solving_rating,
            code_quality_rating = EXCLUDED.code_quality_rating, system_design_rating = EXCLUDED.system_design_rating,
            coding_challenge_score = EXCLUDED.coding_challenge_score, coding_challenge_notes = EXCLUDED.coding_challenge_notes,
            technical_strengths = EXCLUDED.technical_strengths, areas_for_improvement = EXCLUDED.areas_for_improvement,
            verdict = EXCLUDED.verdict, verdict_rationale = EXCLUDED.verdict_rationale, updated_at = now()
          RETURNING *
        `, [body.application_id, body.candidate_id, body.interview_date, body.interviewer_name, body.interview_mode, body.technical_knowledge_rating, body.problem_solving_rating, body.code_quality_rating, body.system_design_rating, body.coding_challenge_score, body.coding_challenge_notes, body.technical_strengths, body.areas_for_improvement, body.verdict, body.verdict_rationale]);
        return jsonResponse(result[0]);
      }
    }

    // Offers
    if (path === '/offers') {
      if (method === 'GET') {
        const applicationId = url.searchParams.get('application_id');
        const candidateId = url.searchParams.get('candidate_id');
        if (applicationId) return jsonResponse((await query("SELECT * FROM offers WHERE application_id = $1", [applicationId]))[0] || null);
        if (candidateId) return jsonResponse(await query("SELECT * FROM offers WHERE candidate_id = $1 ORDER BY created_at DESC", [candidateId]));
        return jsonResponse(await query("SELECT * FROM offers ORDER BY created_at DESC"));
      }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`
          INSERT INTO offers (application_id, candidate_id, offer_date, expiry_date, offer_amount, position, start_date, status, benefits, remarks, negotiation_notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (application_id) DO UPDATE SET
            offer_date = EXCLUDED.offer_date, expiry_date = EXCLUDED.expiry_date, offer_amount = EXCLUDED.offer_amount,
            position = EXCLUDED.position, start_date = EXCLUDED.start_date, status = EXCLUDED.status,
            benefits = EXCLUDED.benefits, remarks = EXCLUDED.remarks, negotiation_notes = EXCLUDED.negotiation_notes,
            updated_at = now()
          RETURNING *
        `, [body.application_id, body.candidate_id, body.offer_date || null, body.expiry_date || null, body.offer_amount || null, body.position || null, body.start_date || null, body.status || 'pending', body.benefits || null, body.remarks || null, body.negotiation_notes || null]);
        return jsonResponse(result[0]);
      }
    }

    // Timeline
    if (path === '/timeline') {
      const applicationId = url.searchParams.get('application_id');
      const candidateId = url.searchParams.get('candidate_id');
      
      let sql = "SELECT * FROM candidate_timeline";
      const conditions: string[] = [];
      const params: unknown[] = [];
      
      if (applicationId) { conditions.push(`application_id = $${params.length + 1}`); params.push(applicationId); }
      if (candidateId) { conditions.push(`candidate_id = $${params.length + 1}`); params.push(candidateId); }
      
      if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
      sql += ' ORDER BY changed_date DESC';
      
      return jsonResponse(await query(sql, params));
    }

    // Job order count
    if (path === '/job-orders/count') {
      const rows = await query("SELECT COUNT(*) as count FROM job_orders");
      return jsonResponse({ count: parseInt((rows[0] as any).count) });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  try {
    return await handleRequest(req);
  } finally {
    await closeClient();
  }
});

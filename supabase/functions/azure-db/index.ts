import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  'uploaded_by', 'uploaded_by_user_id'
];

const ALLOWED_APPLICATION_COLUMNS = [
  'pipeline_status', 'match_score', 'tech_interview_result', 'working_conditions',
  'remarks', 'applied_date'
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

// Authentication helper
async function authenticateRequest(req: Request): Promise<{ userId: string | null; error: string | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or invalid authorization header' };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    console.error('Auth error:', error?.message || 'No user found');
    return { userId: null, error: 'Unauthorized' };
  }

  return { userId: data.user.id, error: null };
}

// Initialize tables
async function initTables() {
  const createTablesSql = `
    -- Create enums if they don't exist
    DO $$ BEGIN
      CREATE TYPE job_order_status AS ENUM ('draft', 'in-progress', 'fulfilled', 'closed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE job_level AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE employment_type AS ENUM ('consultant', 'project-based', 'regular');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE applicant_type AS ENUM ('internal', 'external');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE pipeline_status AS ENUM ('new', 'screening', 'for_hr_interview', 'for_tech_interview', 'offer', 'hired', 'rejected', 'withdrawn');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE tech_interview_result AS ENUM ('pending', 'passed', 'failed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE hr_verdict AS ENUM ('proceed_to_tech', 'hold', 'reject');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    
    DO $$ BEGIN
      CREATE TYPE tech_verdict AS ENUM ('recommend_hire', 'consider', 'do_not_hire');
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
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Job Orders table
    CREATE TABLE IF NOT EXISTS job_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      jo_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      department_name TEXT,
      department_id UUID REFERENCES departments(id),
      level job_level NOT NULL,
      quantity INTEGER DEFAULT 1,
      hired_count INTEGER DEFAULT 0,
      employment_type employment_type NOT NULL,
      requestor_name TEXT,
      required_date DATE,
      status job_order_status DEFAULT 'draft',
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
      applicant_type applicant_type DEFAULT 'external',
      skills TEXT[],
      positions_fit_for TEXT[],
      years_of_experience INTEGER,
      educational_background TEXT,
      cv_url TEXT,
      cv_filename TEXT,
      availability TEXT,
      preferred_work_setup TEXT,
      expected_salary TEXT,
      earliest_start_date DATE,
      uploaded_by TEXT,
      uploaded_by_user_id UUID,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidate Work Experience table
    CREATE TABLE IF NOT EXISTS candidate_work_experience (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      job_title TEXT NOT NULL,
      start_date DATE,
      end_date DATE,
      is_current BOOLEAN DEFAULT false,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidate Job Applications (junction table)
    CREATE TABLE IF NOT EXISTS candidate_job_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      job_order_id UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
      pipeline_status pipeline_status DEFAULT 'new',
      match_score NUMERIC,
      tech_interview_result tech_interview_result DEFAULT 'pending',
      working_conditions TEXT,
      remarks TEXT,
      applied_date TIMESTAMPTZ DEFAULT now(),
      status_changed_date TIMESTAMPTZ DEFAULT now(),
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
      verdict hr_verdict,
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
      verdict tech_verdict,
      verdict_rationale TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Candidate Timeline table
    CREATE TABLE IF NOT EXISTS candidate_timeline (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      from_status pipeline_status,
      to_status pipeline_status NOT NULL,
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
      furthest_stage pipeline_status,
      outcome TEXT,
      historical_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  
  await execute(createTablesSql);
  console.log("Tables initialized successfully");
}

// Seed initial data
async function seedData(forceReseed = false) {
  // Check if already seeded
  const existing = await query("SELECT COUNT(*) as count FROM candidate_job_applications");
  if (!forceReseed && existing.length > 0 && parseInt((existing[0] as any).count) > 0) {
    console.log("Data already seeded");
    return;
  }

  // Seed departments
  await execute(`
    INSERT INTO departments (name) VALUES 
    ('Engineering'), ('Product'), ('Design'), ('Sales'), ('Marketing'), 
    ('Human Resources'), ('Finance'), ('Operations'), ('Legal'), ('Customer Success')
    ON CONFLICT (name) DO NOTHING
  `);

  // Seed job orders
  await execute(`
    INSERT INTO job_orders (jo_number, title, description, department_name, level, quantity, employment_type, requestor_name, status)
    VALUES 
    ('JO-2026-001', 'Senior Software Engineer', 'Build and maintain scalable web applications', 'Engineering', 'L3', 3, 'regular', 'John Smith', 'in-progress'),
    ('JO-2026-002', 'Product Manager', 'Lead product strategy and roadmap', 'Product', 'L4', 1, 'regular', 'Sarah Johnson', 'in-progress'),
    ('JO-2026-003', 'UX Designer', 'Create user-centered designs for web and mobile', 'Design', 'L2', 2, 'regular', 'Mike Chen', 'draft'),
    ('JO-2026-004', 'DevOps Engineer', 'Manage cloud infrastructure and CI/CD pipelines', 'Engineering', 'L3', 1, 'consultant', 'John Smith', 'in-progress'),
    ('JO-2026-005', 'Sales Representative', 'Drive revenue growth in enterprise segment', 'Sales', 'L2', 5, 'regular', 'Lisa Wang', 'in-progress')
    ON CONFLICT (jo_number) DO NOTHING
  `);

  // Seed candidates
  await execute(`
    INSERT INTO candidates (full_name, email, phone, applicant_type, skills, years_of_experience, educational_background, availability, preferred_work_setup, expected_salary)
    VALUES 
    ('Alice Rodriguez', 'alice.rodriguez@email.com', '+1-555-0101', 'external', ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL'], 5, 'BS Computer Science, Stanford University', 'Immediate', 'Remote', '120000'),
    ('Bob Thompson', 'bob.thompson@email.com', '+1-555-0102', 'external', ARRAY['Python', 'Machine Learning', 'AWS', 'Docker'], 7, 'MS Computer Science, MIT', '2 weeks notice', 'Hybrid', '150000'),
    ('Carol Martinez', 'carol.martinez@email.com', '+1-555-0103', 'internal', ARRAY['Product Strategy', 'Agile', 'Data Analysis', 'User Research'], 4, 'MBA, Harvard Business School', 'Immediate', 'On-site', '130000'),
    ('David Kim', 'david.kim@email.com', '+1-555-0104', 'external', ARRAY['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'], 3, 'BFA Design, Rhode Island School of Design', '1 month notice', 'Remote', '95000'),
    ('Emma Wilson', 'emma.wilson@email.com', '+1-555-0105', 'external', ARRAY['Java', 'Spring Boot', 'Kubernetes', 'Microservices'], 8, 'BS Software Engineering, Georgia Tech', 'Immediate', 'Hybrid', '140000'),
    ('Frank Chen', 'frank.chen@email.com', '+1-555-0106', 'external', ARRAY['Sales', 'Negotiation', 'CRM', 'Enterprise Software'], 6, 'BA Business Administration, UC Berkeley', '2 weeks notice', 'On-site', '85000'),
    ('Grace Lee', 'grace.lee@email.com', '+1-555-0107', 'internal', ARRAY['DevOps', 'Terraform', 'AWS', 'Linux'], 5, 'BS Computer Engineering, UCLA', 'Immediate', 'Remote', '125000'),
    ('Henry Davis', 'henry.davis@email.com', '+1-555-0108', 'external', ARRAY['React Native', 'iOS', 'Android', 'Flutter'], 4, 'BS Computer Science, University of Washington', '3 weeks notice', 'Hybrid', '115000')
  `);

  // Create applications linking candidates to job orders
  const jobOrders = await query("SELECT id, jo_number FROM job_orders");
  const candidates = await query("SELECT id, full_name FROM candidates");
  
  if (jobOrders.length > 0 && candidates.length > 0) {
    const jo1 = (jobOrders[0] as any).id;
    const jo2 = (jobOrders[1] as any).id;
    const jo4 = (jobOrders[3] as any).id;
    const jo5 = (jobOrders[4] as any).id;
    
    const c1 = (candidates[0] as any).id;
    const c2 = (candidates[1] as any).id;
    const c3 = (candidates[2] as any).id;
    const c4 = (candidates[3] as any).id;
    const c5 = (candidates[4] as any).id;
    const c6 = (candidates[5] as any).id;
    const c7 = (candidates[6] as any).id;
    const c8 = (candidates[7] as any).id;

    await execute(`
      INSERT INTO candidate_job_applications (candidate_id, job_order_id, pipeline_status, match_score)
      VALUES 
      ($1, $2, 'for_hr_interview', 92),
      ($3, $2, 'for_tech_interview', 88),
      ($4, $5, 'for_hr_interview', 85),
      ($6, $2, 'screening', 78),
      ($7, $2, 'for_hr_interview', 90),
      ($8, $9, 'for_tech_interview', 87),
      ($10, $11, 'for_hr_interview', 82),
      ($12, $2, 'offer', 95)
      ON CONFLICT (candidate_id, job_order_id) DO NOTHING
    `, [c1, jo1, c2, c4, jo2, c5, c6, c7, jo4, c8, jo5, c3]);
  }

  console.log("Synthetic data seeded successfully");
}

// Route handlers
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/azure-db', '');
  const method = req.method;

  console.log(`${method} ${path}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Authenticate all requests
  const { userId, error: authError } = await authenticateRequest(req);
  if (authError) {
    console.error('Authentication failed:', authError);
    return jsonResponse({ error: authError }, 401);
  }
  console.log(`Authenticated user: ${userId}`);

  try {
    // Initialize tables endpoint
    if (path === '/init' && method === 'POST') {
      await initTables();
      await seedData();
      return jsonResponse({ success: true, message: 'Tables initialized and data seeded' });
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
        `, [body.jo_number, body.title, body.description, body.department_name, body.level, body.quantity, body.employment_type, body.requestor_name, body.required_date, body.status || 'draft']);
        return jsonResponse(result[0]);
      }
    }

    if (path.startsWith('/job-orders/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();
      
      // Validate columns against whitelist to prevent SQL injection
      const validatedBody = validateColumns(body, ALLOWED_JOB_ORDER_COLUMNS);
      
      if (Object.keys(validatedBody).length === 0) {
        return jsonResponse({ error: 'No valid columns to update' }, 400);
      }
      
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      
      for (const [key, value] of Object.entries(validatedBody)) {
        updates.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
      updates.push(`updated_at = now()`);
      values.push(id);
      
      const result = await query(`UPDATE job_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      return jsonResponse(result[0]);
    }

    if (path.startsWith('/job-orders/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await execute("DELETE FROM job_orders WHERE id = $1", [id]);
      return jsonResponse({ success: true });
    }

    // Candidates
    if (path === '/candidates') {
      if (method === 'GET') {
        const rows = await query("SELECT * FROM candidates ORDER BY created_at DESC");
        return jsonResponse(rows);
      }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`
          INSERT INTO candidates (full_name, email, phone, applicant_type, skills, years_of_experience, educational_background, availability, preferred_work_setup, expected_salary, cv_url, cv_filename, uploaded_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `, [body.full_name, body.email, body.phone, body.applicant_type || 'external', body.skills, body.years_of_experience, body.educational_background, body.availability, body.preferred_work_setup, body.expected_salary, body.cv_url, body.cv_filename, body.uploaded_by]);
        return jsonResponse(result[0]);
      }
    }

    if (path.startsWith('/candidates/') && !path.includes('/work-experience') && method === 'GET') {
      const id = path.split('/')[2];
      const rows = await query("SELECT * FROM candidates WHERE id = $1", [id]);
      return jsonResponse(rows[0] || null);
    }

    if (path.startsWith('/candidates/') && !path.includes('/work-experience') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();
      
      // Validate columns against whitelist to prevent SQL injection
      const validatedBody = validateColumns(body, ALLOWED_CANDIDATE_COLUMNS);
      
      if (Object.keys(validatedBody).length === 0) {
        return jsonResponse({ error: 'No valid columns to update' }, 400);
      }
      
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      
      for (const [key, value] of Object.entries(validatedBody)) {
        updates.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
      updates.push(`updated_at = now()`);
      values.push(id);
      
      const result = await query(`UPDATE candidates SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      return jsonResponse(result[0]);
    }

    if (path.startsWith('/candidates/') && !path.includes('/work-experience') && method === 'DELETE') {
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
                 j.jo_number, j.title as job_title
          FROM candidate_job_applications a
          JOIN candidates c ON a.candidate_id = c.id
          JOIN job_orders j ON a.job_order_id = j.id
        `;
        const conditions: string[] = [];
        const params: unknown[] = [];
        
        if (jobOrderId) {
          conditions.push(`a.job_order_id = $${params.length + 1}`);
          params.push(jobOrderId);
        }
        if (candidateId) {
          conditions.push(`a.candidate_id = $${params.length + 1}`);
          params.push(candidateId);
        }
        
        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(' AND ')}`;
        }
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
        `, [body.candidate_id, body.job_order_id, body.pipeline_status || 'new', body.match_score, body.remarks]);
        return jsonResponse(result[0]);
      }
    }

    if (path.startsWith('/applications/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();
      
      // Get current status for timeline
      const current = await query("SELECT pipeline_status, candidate_id FROM candidate_job_applications WHERE id = $1", [id]);
      const fromStatus = current.length > 0 ? (current[0] as any).pipeline_status : null;
      const candidateId = current.length > 0 ? (current[0] as any).candidate_id : null;
      
      // Validate columns against whitelist to prevent SQL injection
      const validatedBody = validateColumns(body, ALLOWED_APPLICATION_COLUMNS);
      
      if (Object.keys(validatedBody).length === 0) {
        return jsonResponse({ error: 'No valid columns to update' }, 400);
      }
      
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      
      for (const [key, value] of Object.entries(validatedBody)) {
        updates.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
      
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
      const rows = await query("SELECT * FROM departments ORDER BY name");
      return jsonResponse(rows);
    }

    // CV Uploaders
    if (path === '/cv-uploaders') {
      if (method === 'GET') {
        const rows = await query("SELECT * FROM cv_uploaders ORDER BY name");
        return jsonResponse(rows);
      }
      if (method === 'POST') {
        const body = await req.json();
        const result = await query(`
          INSERT INTO cv_uploaders (name) VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING *
        `, [body.name]);
        return jsonResponse(result[0]);
      }
    }

    // HR Interviews
    if (path === '/hr-interviews') {
      if (method === 'GET') {
        const applicationId = url.searchParams.get('application_id');
        const candidateId = url.searchParams.get('candidate_id');
        
        if (applicationId) {
          const rows = await query("SELECT * FROM hr_interviews WHERE application_id = $1", [applicationId]);
          return jsonResponse(rows[0] || null);
        }
        if (candidateId) {
          const rows = await query("SELECT * FROM hr_interviews WHERE candidate_id = $1 ORDER BY created_at DESC", [candidateId]);
          return jsonResponse(rows);
        }
        const rows = await query("SELECT * FROM hr_interviews ORDER BY created_at DESC");
        return jsonResponse(rows);
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
        
        if (applicationId) {
          const rows = await query("SELECT * FROM tech_interviews WHERE application_id = $1", [applicationId]);
          return jsonResponse(rows[0] || null);
        }
        if (candidateId) {
          const rows = await query("SELECT * FROM tech_interviews WHERE candidate_id = $1 ORDER BY created_at DESC", [candidateId]);
          return jsonResponse(rows);
        }
        const rows = await query("SELECT * FROM tech_interviews ORDER BY created_at DESC");
        return jsonResponse(rows);
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

    // Timeline
    if (path === '/timeline') {
      const applicationId = url.searchParams.get('application_id');
      const candidateId = url.searchParams.get('candidate_id');
      
      let sql = "SELECT * FROM candidate_timeline";
      const conditions: string[] = [];
      const params: unknown[] = [];
      
      if (applicationId) {
        conditions.push(`application_id = $${params.length + 1}`);
        params.push(applicationId);
      }
      if (candidateId) {
        conditions.push(`candidate_id = $${params.length + 1}`);
        params.push(candidateId);
      }
      
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      sql += ' ORDER BY changed_date DESC';
      
      const rows = await query(sql, params);
      return jsonResponse(rows);
    }

    // Job order count for JO number generation
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
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

serve(async (req: Request) => {
  try {
    return await handleRequest(req);
  } finally {
    await closeClient();
  }
});

import pg from 'pg';

// ---------- PostgreSQL connection pool ----------
const pool = new pg.Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('⚠️  Unexpected error on idle client:', err.message);
});

// ---------- Query helpers with error context ----------
export async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    console.error(`Query error: ${err.message}\n  SQL: ${sql.substring(0, 200)}...`);
    throw err;
  }
}

export async function execute(sql, params = []) {
  try {
    await pool.query(sql, params);
    return { success: true };
  } catch (err) {
    console.error(`Execute error: ${err.message}\n  SQL: ${sql.substring(0, 200)}...`);
    throw err;
  }
}

// Transaction helper – executes callback(client) inside BEGIN/COMMIT with auto-ROLLBACK on error
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Column whitelists for SQL injection prevention
export const ALLOWED_JOB_ORDER_COLUMNS = [
  'jo_number', 'title', 'description', 'department_name', 'department_id',
  'level', 'quantity', 'hired_count', 'employment_type', 'requestor_name',
  'required_date', 'status', 'created_by'
];

export const ALLOWED_CANDIDATE_COLUMNS = [
  'full_name', 'email', 'phone', 'applicant_type', 'skills', 'positions_fit_for',
  'position_applied',
  'years_of_experience_text', 'preferred_work_setup', 'expected_salary', 'earliest_start_date',
  'uploaded_by', 'linkedin', 'current_position', 'current_company',
  'overall_summary', 'strengths', 'weaknesses', 'qualification_score', 'preferred_employment_type',
  'internal_upload_reason', 'internal_from_date', 'internal_to_date',
  'google_drive_file_id', 'google_drive_file_url',
  'batch_id', 'batch_created_at', 'processing_status',
  'notice_period', 'employment_status_preference', 'relocation_willingness'
];

export const ALLOWED_APPLICATION_COLUMNS = [
  'pipeline_status', 'match_score', 'tech_interview_result', 'employment_type',
  'working_conditions', 'remarks', 'applied_date'
];

export function validateColumns(body, allowedColumns) {
  if (!body || typeof body !== 'object') return {};
  const validated = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedColumns.includes(key)) {
      validated[key] = value;
    } else {
      console.warn(`Blocked invalid column name: ${key}`);
    }
  }
  return validated;
}

// ---------- Startup DB verification ----------
export async function verifyDatabaseConnection() {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as now, current_database() as db');
      client.release();
      console.log(`✅ Database connected: ${result.rows[0].db} (${process.env.PGHOST})`);
      return true;
    } catch (err) {
      console.error(`❌ DB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = attempt * 2000;
        console.log(`   Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  console.error('❌ Could not connect to database after all retries. Server will start but queries will fail.');
  return false;
}

// ---------- Get candidate with full details ----------
export async function getCandidateFull(id) {
  const candidates = await query("SELECT * FROM candidates WHERE id = $1", [id]);
  if (candidates.length === 0) return null;

  const candidate = candidates[0];
  const education = await query("SELECT * FROM candidate_education WHERE candidate_id = $1 ORDER BY year DESC NULLS LAST", [id]);
  const certifications = await query("SELECT * FROM candidate_certifications WHERE candidate_id = $1 ORDER BY year DESC NULLS LAST", [id]);
  const workExperiences = await query("SELECT * FROM candidate_work_experience WHERE candidate_id = $1 ORDER BY created_at DESC", [id]);

  return { ...candidate, education, certifications, work_experiences: workExperiences };
}

// ---------- Migrations ----------
export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Migration 1: Add HR form sync fields
    await execute(`
      ALTER TABLE candidates 
        ADD COLUMN IF NOT EXISTS employment_status_preference text,
        ADD COLUMN IF NOT EXISTS relocation_willingness text
    `);
    
    await execute(`
      ALTER TABLE hr_interviews 
        ADD COLUMN IF NOT EXISTS earliest_start_date date
    `);
    
    // Migration 2: Drop redundant/unused columns
    await execute(`
      ALTER TABLE candidates 
        DROP COLUMN IF EXISTS years_of_experience,
        DROP COLUMN IF EXISTS educational_background,
        DROP COLUMN IF EXISTS cv_url,
        DROP COLUMN IF EXISTS cv_filename,
        DROP COLUMN IF EXISTS availability,
        DROP COLUMN IF EXISTS processing_batch_id,
        DROP COLUMN IF EXISTS processing_started_at,
        DROP COLUMN IF EXISTS processing_completed_at,
        DROP COLUMN IF EXISTS processing_index,
        DROP COLUMN IF EXISTS uploaded_by_user_id
    `);

    // Migration 3: Talent Pooling - add 'pooled' to pipeline_status_enum & create pooled_candidates table
    await execute(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pooled' AND enumtypid = 'pipeline_status_enum'::regtype) THEN
          ALTER TYPE pipeline_status_enum ADD VALUE 'pooled';
        END IF;
      END $$
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS pooled_candidates (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        candidate_id uuid NOT NULL,
        original_application_id uuid NOT NULL,
        original_job_order_id uuid NOT NULL,
        pooled_from_status pipeline_status_enum NOT NULL,
        pool_reason text,
        pool_notes text,
        pooled_by text,
        pooled_at timestamp with time zone NOT NULL DEFAULT now(),
        disposition text DEFAULT 'available',
        disposition_changed_at timestamp with time zone,
        disposition_notes text,
        new_application_id uuid,
        new_job_order_id uuid,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        PRIMARY KEY (id),
        UNIQUE (original_application_id),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (original_application_id) REFERENCES candidate_job_applications(id) ON DELETE CASCADE,
        FOREIGN KEY (original_job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (new_application_id) REFERENCES candidate_job_applications(id) ON DELETE SET NULL,
        FOREIGN KEY (new_job_order_id) REFERENCES job_orders(id) ON DELETE SET NULL
      )
    `);

    // Indexes for pooled_candidates
    await execute(`CREATE INDEX IF NOT EXISTS idx_pooled_candidate_id ON pooled_candidates (candidate_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_pooled_original_application ON pooled_candidates (original_application_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_pooled_original_jo ON pooled_candidates (original_job_order_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_pooled_disposition ON pooled_candidates (disposition)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_pooled_pooled_at ON pooled_candidates (pooled_at DESC)`);

    // Trigger for pooled_candidates updated_at
    await execute(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pooled_candidates_updated_at') THEN
          CREATE TRIGGER update_pooled_candidates_updated_at
            BEFORE UPDATE ON pooled_candidates
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$
    `);
    
    console.log('✅ Migrations completed successfully');
    return { success: true, message: 'Migrations completed' };
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// ---------- Create candidate from webhook ----------
export async function createCandidateFromWebhook(body) {
  const { webhook_output, uploader_name, applicant_type, job_order_id } = body;
  const output = webhook_output;

  const candidateInfo = output.candidate_info || {};
  const workHistory = output.work_history || {};
  const currentOcc = candidateInfo.current_occupation || workHistory.current_occupation || {};

  const candidateResult = await query(`
    INSERT INTO candidates (
      full_name, email, phone, applicant_type, skills, 
      linkedin, current_position, current_company, years_of_experience_text,
      overall_summary, strengths, weaknesses, qualification_score,
      uploaded_by, processing_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'completed')
    RETURNING *
  `, [
    candidateInfo.full_name || 'Unknown', candidateInfo.email || null, candidateInfo.phone || null,
    applicant_type || 'external', output.key_skills || workHistory.key_skills || [],
    candidateInfo.linkedin || null, currentOcc.title || null, currentOcc.company || null,
    candidateInfo.years_of_experience || workHistory.total_experience || null,
    output.overall_summary || null, output.strengths || [], output.weaknesses || [],
    output.qualification_score || null, uploader_name || null
  ]);

  const candidate = candidateResult[0];
  const candidateId = candidate.id;

  if (output.education && Array.isArray(output.education)) {
    for (const edu of output.education) {
      await execute(`INSERT INTO candidate_education (candidate_id, degree, institution, year) VALUES ($1, $2, $3, $4)`,
        [candidateId, edu.degree || 'Unknown', edu.institution || 'Unknown', edu.year || null]);
    }
  }

  if (output.certifications && Array.isArray(output.certifications)) {
    for (const cert of output.certifications) {
      await execute(`INSERT INTO candidate_certifications (candidate_id, name, issuer, year) VALUES ($1, $2, $3, $4)`,
        [candidateId, cert.name || 'Unknown', cert.issuer || null, cert.year || null]);
    }
  }

  if (workHistory.work_experience && Array.isArray(workHistory.work_experience)) {
    for (const exp of workHistory.work_experience) {
      await execute(`
        INSERT INTO candidate_work_experience (candidate_id, company_name, job_title, description, duration, key_projects)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `, [candidateId, exp.company || 'Unknown', exp.job_title || 'Unknown', exp.summary || null, exp.duration || null, JSON.stringify(exp.key_projects || [])]);
    }
  }

  let application = null;
  if (job_order_id) {
    try {
      const appResult = await query(`
        INSERT INTO candidate_job_applications (candidate_id, job_order_id, match_score, pipeline_status)
        VALUES ($1, $2, $3, 'hr_interview')
        RETURNING *
      `, [candidateId, job_order_id, output.qualification_score || null]);
      application = appResult[0];

      await execute(`INSERT INTO candidate_timeline (application_id, candidate_id, to_status) VALUES ($1, $2, 'hr_interview')`,
        [application.id, candidateId]);
    } catch (err) {
      console.error("Error creating application:", err);
    }
  }

  return { candidate, application };
}

// Export pool for graceful shutdown
export { pool };

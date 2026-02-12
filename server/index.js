import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import multer from 'multer';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.API_PORT || 3001;

// ---------- Validate required env vars ----------
const REQUIRED_ENV = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'N8N_CV_WEBHOOK_URL', 'WEBHOOK_CALLBACK_URL'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    console.error('   Make sure .env exists in the project root with all required vars (see .env.example)');
    process.exit(1);
  }
}

// ---------- Multer config (for CV file uploads) ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// ---------- Middleware ----------
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logger (concise)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (req.path !== '/health') {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

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

// ---------- Startup DB verification ----------
async function verifyDatabaseConnection() {
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

// ---------- Health check ----------
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// ---------- Query helpers with error context ----------
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    console.error(`Query error: ${err.message}\n  SQL: ${sql.substring(0, 200)}...`);
    throw err;
  }
}

async function execute(sql, params = []) {
  try {
    await pool.query(sql, params);
    return { success: true };
  } catch (err) {
    console.error(`Execute error: ${err.message}\n  SQL: ${sql.substring(0, 200)}...`);
    throw err;
  }
}

// Column whitelists for SQL injection prevention
const ALLOWED_JOB_ORDER_COLUMNS = [
  'jo_number', 'title', 'description', 'department_name', 'department_id',
  'level', 'quantity', 'hired_count', 'employment_type', 'requestor_name',
  'required_date', 'status', 'created_by'
];

const ALLOWED_CANDIDATE_COLUMNS = [
  'full_name', 'email', 'phone', 'applicant_type', 'skills', 'positions_fit_for',
  'years_of_experience_text', 'preferred_work_setup', 'expected_salary', 'earliest_start_date',
  'uploaded_by', 'linkedin', 'current_position', 'current_company',
  'overall_summary', 'strengths', 'weaknesses', 'qualification_score', 'preferred_employment_type',
  'internal_upload_reason', 'internal_from_date', 'internal_to_date',
  'google_drive_file_id', 'google_drive_file_url',
  'batch_id', 'batch_created_at', 'processing_status',
  'notice_period', 'employment_status_preference', 'relocation_willingness'
];

const ALLOWED_APPLICATION_COLUMNS = [
  'pipeline_status', 'match_score', 'tech_interview_result', 'employment_type',
  'working_conditions', 'remarks', 'applied_date'
];

function validateColumns(body, allowedColumns) {
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

// =====================================================
// INIT & MIGRATIONS
// =====================================================
async function runMigrations() {
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
    
    console.log('✅ Migrations completed successfully');
    return { success: true, message: 'Migrations completed' };
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

app.post('/init', async (req, res) => {
  try {
    // Run migrations first
    await runMigrations();
    
    // Tables already created via schema.sql, just seed departments
    await execute(`
      INSERT INTO departments (name) VALUES 
      ('Engineering'), ('Product'), ('Design'), ('Sales'), ('Marketing'), 
      ('Human Resources'), ('Finance'), ('Operations'), ('Legal'), ('Customer Success')
      ON CONFLICT (name) DO NOTHING
    `);
    res.json({ success: true, message: 'Tables initialized, migrations run, and data seeded' });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/migrate', async (req, res) => {
  try {
    const result = await runMigrations();
    res.json(result);
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// JOB ORDERS
// =====================================================
app.get('/job-orders', async (req, res) => {
  try {
    const rows = await query("SELECT * FROM job_orders ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/job-orders/count', async (req, res) => {
  try {
    const rows = await query("SELECT COUNT(*) as count FROM job_orders");
    res.json({ count: parseInt(rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/job-orders', async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO job_orders (jo_number, title, description, department_name, level, quantity, employment_type, requestor_name, required_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [body.jo_number, body.title, body.description, body.department_name, body.level, body.quantity, body.employment_type, body.requestor_name, body.required_date, body.status || 'open']);

    // Fire-and-forget webhook
    sendJobOrderWebhook(result[0], 'create').catch(console.error);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/job-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedBody = validateColumns(req.body, ALLOWED_JOB_ORDER_COLUMNS);
    if (Object.keys(validatedBody).length === 0) return res.status(400).json({ error: 'No valid columns to update' });

    // Fetch old status before updating (for webhook action logic)
    const oldRows = await query("SELECT status FROM job_orders WHERE id = $1", [id]);
    const oldStatus = oldRows[0]?.status;

    const updates = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(validatedBody)) {
      updates.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    updates.push(`updated_at = now()`);
    values.push(id);

    const result = await query(`UPDATE job_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);

    // Determine webhook action: archiving or closing sends 'delete', otherwise 'update'
    const newStatus = result[0]?.status;
    const isDeactivating = (newStatus === 'archived' || newStatus === 'closed') && (oldStatus !== 'archived' && oldStatus !== 'closed');
    const webhookAction = isDeactivating ? 'delete' : 'update';
    sendJobOrderWebhook(result[0], webhookAction).catch(console.error);

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/job-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query("SELECT * FROM job_orders WHERE id = $1", [id]);
    await execute("DELETE FROM job_orders WHERE id = $1", [id]);
    if (existing[0]) sendJobOrderWebhook(existing[0], 'delete').catch(console.error);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Job Order Webhook
const JO_WEBHOOK_URL = process.env.N8N_JO_WEBHOOK_URL || 'https://workflow.exist.com.ph/webhook/job-order-webhook-path';
async function sendJobOrderWebhook(jobOrder, action) {
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

// =====================================================
// CANDIDATES
// =====================================================
app.get('/candidates', async (req, res) => {
  try {
    const includeProcessing = req.query.include_processing === 'true';
    let sql = "SELECT * FROM candidates";
    if (!includeProcessing) sql += " WHERE processing_status = 'completed' OR processing_status IS NULL";
    sql += " ORDER BY created_at DESC";
    const rows = await query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/candidates', async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO candidates (full_name, email, phone, applicant_type, skills, years_of_experience_text, preferred_work_setup, expected_salary, uploaded_by, processing_status, google_drive_file_id, google_drive_file_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', $10, $11)
      RETURNING *
    `, [body.full_name, body.email, body.phone, body.applicant_type || 'external', body.skills, body.years_of_experience_text, body.preferred_work_setup, body.expected_salary, body.uploaded_by, body.google_drive_file_id, body.google_drive_file_url]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Candidate from webhook
app.post('/candidates/from-webhook', async (req, res) => {
  try {
    const result = await createCandidateFromWebhook(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Processing status
app.get('/candidates/processing-status', async (req, res) => {
  try {
    const batchId = req.query.batch_id;
    const since = req.query.since;

    let sql = `SELECT id, full_name, processing_status, applicant_type, created_at, batch_id, batch_created_at FROM candidates
           WHERE processing_status IN ('processing', 'completed')`;
    const params = [];

    if (batchId) { params.push(batchId); sql += ` AND batch_id = $${params.length}`; }
    if (since) { params.push(since); sql += ` AND (batch_created_at > $${params.length} OR processing_status = 'processing')`; }
    sql += ' ORDER BY created_at DESC LIMIT 50';

    const rows = await query(sql, params);
    const statusCounts = await query(`
      SELECT processing_status, COUNT(*) as count FROM candidates 
      WHERE processing_status IN ('processing', 'completed')
      ${batchId ? `AND processing_batch_id = $1` : ''}
      GROUP BY processing_status
    `, batchId ? [batchId] : []);

    res.json({
      candidates: rows,
      counts: statusCounts.reduce((acc, row) => { acc[row.processing_status] = parseInt(row.count); return acc; }, {})
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup stale processing
app.post('/candidates/cleanup', async (req, res) => {
  try {
    await execute(`UPDATE candidates SET processing_status = 'failed' WHERE processing_status = 'processing' AND processing_started_at < now() - interval '10 minutes'`);
    const deleted = await query(`DELETE FROM candidates WHERE processing_status = 'failed' AND full_name LIKE 'Processing CV%' RETURNING id`);
    res.json({ success: true, deleted: deleted.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Candidate full (with education, certs, work exp)
app.get('/candidates/:id/full', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getCandidateFull(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Candidate by ID
app.get('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query("SELECT * FROM candidates WHERE id = $1", [id]);
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedBody = validateColumns(req.body, ALLOWED_CANDIDATE_COLUMNS);
    if (Object.keys(validatedBody).length === 0) return res.status(400).json({ error: 'No valid columns to update' });

    const updates = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(validatedBody)) {
      updates.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
    updates.push(`updated_at = now()`);
    values.push(id);

    const result = await query(`UPDATE candidates SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await execute("DELETE FROM candidates WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// APPLICATIONS
// =====================================================
app.get('/applications', async (req, res) => {
  try {
    const { job_order_id, candidate_id } = req.query;

    let sql = `
      SELECT a.*, c.full_name as candidate_name, c.email as candidate_email, c.skills, c.years_of_experience_text,
             c.linkedin, c.current_position, c.current_company, c.overall_summary, c.strengths, c.weaknesses, c.applicant_type,
             c.processing_status, c.qualification_score,
             j.jo_number, j.title as job_title
      FROM candidate_job_applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN job_orders j ON a.job_order_id = j.id
    `;
    const conditions = [];
    const params = [];

    if (job_order_id) { conditions.push(`a.job_order_id = $${params.length + 1}`); params.push(job_order_id); }
    if (candidate_id) { conditions.push(`a.candidate_id = $${params.length + 1}`); params.push(candidate_id); }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ' ORDER BY a.created_at DESC';

    const rows = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/applications', async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO candidate_job_applications (candidate_id, job_order_id, pipeline_status, match_score, remarks)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [body.candidate_id, body.job_order_id, body.pipeline_status || 'hr_interview', body.match_score, body.remarks]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const current = await query("SELECT pipeline_status, candidate_id FROM candidate_job_applications WHERE id = $1", [id]);
    const fromStatus = current.length > 0 ? current[0].pipeline_status : null;
    const candidateId = current.length > 0 ? current[0].candidate_id : null;

    const validatedBody = validateColumns(req.body, ALLOWED_APPLICATION_COLUMNS);
    if (Object.keys(validatedBody).length === 0) return res.status(400).json({ error: 'No valid columns to update' });

    const updates = [];
    const values = [];
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

    // Create timeline entry if status changed, with duration_days calculation
    if (validatedBody.pipeline_status && validatedBody.pipeline_status !== fromStatus && candidateId) {
      // Calculate duration_days from previous status change (or applied_date)
      let durationDays = null;
      try {
        const prevEntry = await query(`
          SELECT changed_date FROM candidate_timeline
          WHERE application_id = $1 ORDER BY changed_date DESC LIMIT 1
        `, [id]);
        const sinceDate = prevEntry.length > 0
          ? new Date(prevEntry[0].changed_date)
          : (result[0].applied_date ? new Date(result[0].applied_date) : null);
        if (sinceDate) {
          durationDays = Math.max(0, Math.round((Date.now() - sinceDate.getTime()) / (1000 * 60 * 60 * 24)));
        }
      } catch (e) { console.error('Duration calc error:', e.message); }

      await execute(`
        INSERT INTO candidate_timeline (application_id, candidate_id, from_status, to_status, duration_days)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, candidateId, fromStatus, validatedBody.pipeline_status, durationDays]);
    }

    // Include duration_days in response for client-side activity logging
    if (result.length > 0) {
      // Fetch the latest duration from the timeline for the response
      try {
        const latestTimeline = await query(`
          SELECT duration_days FROM candidate_timeline
          WHERE application_id = $1 ORDER BY changed_date DESC LIMIT 1
        `, [id]);
        if (latestTimeline.length > 0) {
          result[0]._duration_days = latestTimeline[0].duration_days;
        }
      } catch (e) { /* ignore */ }
    }

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// DEPARTMENTS
// =====================================================
app.get('/departments', async (req, res) => {
  try {
    res.json(await query("SELECT * FROM departments ORDER BY name"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/departments', async (req, res) => {
  try {
    const body = req.body;
    if (!body.name?.trim()) return res.status(400).json({ error: 'Department name is required' });
    const result = await query(`INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`, [body.name.trim()]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    if (!body.name?.trim()) return res.status(400).json({ error: 'Department name is required' });
    const result = await query(`UPDATE departments SET name = $1 WHERE id = $2 RETURNING *`, [body.name.trim(), id]);
    res.json(result[0] || { error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await query("SELECT COUNT(*) as count FROM job_orders WHERE department_id = $1", [id]);
    if (parseInt(inUse[0].count) > 0) return res.status(400).json({ error: 'Department in use' });
    await execute("DELETE FROM departments WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// CV UPLOADERS
// =====================================================
app.get('/cv-uploaders', async (req, res) => {
  try {
    res.json(await query("SELECT DISTINCT ON (name) * FROM cv_uploaders ORDER BY name, created_at"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/cv-uploaders', async (req, res) => {
  try {
    const body = req.body;
    const existing = await query("SELECT * FROM cv_uploaders WHERE LOWER(name) = LOWER($1) LIMIT 1", [body.name]);
    if (existing.length > 0) return res.json(existing[0]);
    const result = await query(`INSERT INTO cv_uploaders (name) VALUES ($1) RETURNING *`, [body.name]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/cv-uploaders', async (req, res) => {
  try {
    await query(`DELETE FROM cv_uploaders WHERE id NOT IN (SELECT MIN(id::text)::uuid FROM cv_uploaders GROUP BY name)`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// HR INTERVIEWS
// =====================================================
app.get('/hr-interviews', async (req, res) => {
  try {
    const { application_id, candidate_id } = req.query;
    if (application_id) return res.json((await query("SELECT * FROM hr_interviews WHERE application_id = $1", [application_id]))[0] || null);
    if (candidate_id) return res.json(await query("SELECT * FROM hr_interviews WHERE candidate_id = $1 ORDER BY created_at DESC", [candidate_id]));
    res.json(await query("SELECT * FROM hr_interviews ORDER BY created_at DESC"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/hr-interviews', async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO hr_interviews (application_id, candidate_id, interview_date, interviewer_name, interview_mode, availability, expected_salary, earliest_start_date, preferred_work_setup, notice_period, communication_rating, motivation_rating, cultural_fit_rating, professionalism_rating, strengths, concerns, verdict, verdict_rationale)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (application_id) DO UPDATE SET
        interview_date = EXCLUDED.interview_date, interviewer_name = EXCLUDED.interviewer_name, interview_mode = EXCLUDED.interview_mode,
        availability = EXCLUDED.availability, expected_salary = EXCLUDED.expected_salary, earliest_start_date = EXCLUDED.earliest_start_date, preferred_work_setup = EXCLUDED.preferred_work_setup,
        notice_period = EXCLUDED.notice_period, communication_rating = EXCLUDED.communication_rating, motivation_rating = EXCLUDED.motivation_rating,
        cultural_fit_rating = EXCLUDED.cultural_fit_rating, professionalism_rating = EXCLUDED.professionalism_rating,
        strengths = EXCLUDED.strengths, concerns = EXCLUDED.concerns, verdict = EXCLUDED.verdict, verdict_rationale = EXCLUDED.verdict_rationale,
        updated_at = now()
      RETURNING *
    `, [body.application_id, body.candidate_id, body.interview_date, body.interviewer_name, body.interview_mode, body.availability, body.expected_salary, body.earliest_start_date, body.preferred_work_setup, body.notice_period, body.communication_rating, body.motivation_rating, body.cultural_fit_rating, body.professionalism_rating, body.strengths, body.concerns, body.verdict, body.verdict_rationale]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// TECH INTERVIEWS
// =====================================================
app.get('/tech-interviews', async (req, res) => {
  try {
    const { application_id, candidate_id } = req.query;
    if (application_id) return res.json((await query("SELECT * FROM tech_interviews WHERE application_id = $1", [application_id]))[0] || null);
    if (candidate_id) return res.json(await query("SELECT * FROM tech_interviews WHERE candidate_id = $1 ORDER BY created_at DESC", [candidate_id]));
    res.json(await query("SELECT * FROM tech_interviews ORDER BY created_at DESC"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tech-interviews', async (req, res) => {
  try {
    const body = req.body;
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
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// OFFERS
// =====================================================
app.get('/offers', async (req, res) => {
  try {
    const { application_id, candidate_id } = req.query;
    if (application_id) return res.json((await query("SELECT * FROM offers WHERE application_id = $1", [application_id]))[0] || null);
    if (candidate_id) return res.json(await query("SELECT * FROM offers WHERE candidate_id = $1 ORDER BY created_at DESC", [candidate_id]));
    res.json(await query("SELECT * FROM offers ORDER BY created_at DESC"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/offers', async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO offers (application_id, candidate_id, offer_date, offer_amount, position, start_date, status, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (application_id) DO UPDATE SET
        offer_date = EXCLUDED.offer_date, offer_amount = EXCLUDED.offer_amount,
        position = EXCLUDED.position, start_date = EXCLUDED.start_date, status = EXCLUDED.status,
        remarks = EXCLUDED.remarks, updated_at = now()
      RETURNING *
    `, [body.application_id, body.candidate_id, body.offer_date || null, body.offer_amount || null, body.position || null, body.start_date || null, body.status || 'pending', body.remarks || null]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// TIMELINE
// =====================================================
app.get('/timeline', async (req, res) => {
  try {
    const { application_id, candidate_id } = req.query;
    let sql = "SELECT * FROM candidate_timeline";
    const conditions = [];
    const params = [];

    if (application_id) { conditions.push(`application_id = $${params.length + 1}`); params.push(application_id); }
    if (candidate_id) { conditions.push(`candidate_id = $${params.length + 1}`); params.push(candidate_id); }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ' ORDER BY changed_date DESC';

    res.json(await query(sql, params));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ACTIVITY LOG
// =====================================================
app.get('/activity-log', async (req, res) => {
  try {
    const { entity_type, activity_type, start_date, end_date, limit: limitParam, offset: offsetParam } = req.query;

    let sql = "SELECT * FROM activity_log";
    const conditions = [];
    const params = [];

    if (entity_type) { params.push(entity_type); conditions.push(`entity_type = $${params.length}`); }
    if (activity_type) {
      const types = activity_type.split(',');
      if (types.length === 1) {
        params.push(activity_type); conditions.push(`activity_type = $${params.length}`);
      } else {
        const placeholders = types.map((_, i) => `$${params.length + i + 1}`);
        types.forEach(t => params.push(t));
        conditions.push(`activity_type IN (${placeholders.join(',')})`);
      }
    }
    if (start_date) { params.push(start_date); conditions.push(`action_date >= $${params.length}::timestamptz`); }
    if (end_date) { params.push(end_date); conditions.push(`action_date <= $${params.length}::timestamptz`); }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ' ORDER BY action_date DESC';

    const limit = parseInt(limitParam || '50');
    const offset = parseInt(offsetParam || '0');
    params.push(limit); sql += ` LIMIT $${params.length}`;
    params.push(offset); sql += ` OFFSET $${params.length}`;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/activity-log', async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO activity_log (activity_type, entity_type, entity_id, performed_by_name, action_date, details)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING *
    `, [body.activity_type, body.entity_type, body.entity_id, body.performed_by_name || null, body.action_date || new Date().toISOString(), JSON.stringify(body.details || {})]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// EMAIL WEBHOOK PROXY (frontend -> n8n email service)
// =====================================================
app.post('/email-webhook', async (req, res) => {
  const emailWebhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
  if (!emailWebhookUrl) {
    console.warn('⚠️  N8N_EMAIL_WEBHOOK_URL not configured, skipping email webhook');
    return res.json({ success: true, skipped: true });
  }
  try {
    const response = await fetch(emailWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    console.log(`Email webhook: ${response.status} (${req.body.email_type || 'unknown'})`);
    res.json({ success: true, status: response.status });
  } catch (err) {
    console.error('Email webhook error:', err.message);
    // Fire-and-forget semantics: don't fail the request
    res.json({ success: false, error: err.message });
  }
});

// =====================================================
// WEBHOOK PROXY (CV upload -> n8n)
// =====================================================
app.post('/webhook-proxy', upload.array('files'), async (req, res) => {
  const batchId = crypto.randomUUID();
  const processingCandidates = [];

  try {
    const files = req.files || [];
    let metadata = [];
    try {
      metadata = JSON.parse(req.body.metadata || '[]');
    } catch { metadata = []; }
    const uploaderName = req.body.uploader_name || null;

    console.log(`📤 Webhook proxy batch ${batchId}: ${files.length} file(s), ${metadata.length} metadata entries`);

    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Step 1: Create placeholder candidate rows (status = 'processing')
    for (let i = 0; i < metadata.length; i++) {
      const fileMeta = metadata[i];
      try {
        const result = await query(`
          INSERT INTO candidates (
            full_name, applicant_type, uploaded_by,
            processing_status, batch_id, batch_created_at
          ) VALUES ($1, $2, $3, 'processing', $4, now())
          RETURNING id
        `, [
          `Processing CV ${i + 1}...`,
          fileMeta.applicant_type || 'external',
          uploaderName,
          batchId
        ]);
        processingCandidates.push(result[0].id);
      } catch (err) {
        console.error(`Error creating placeholder for file ${i}:`, err.message);
      }
    }

    // Step 2: Build FormData to forward to n8n
    const n8nForm = new FormData();
    n8nForm.append('uploader_name', uploaderName || '');
    n8nForm.append('upload_timestamp', req.body.upload_timestamp || new Date().toISOString());
    n8nForm.append('total_files', String(files.length));
    n8nForm.append('batch_id', batchId);
    n8nForm.append('callback_url', process.env.WEBHOOK_CALLBACK_URL);

    // Enrich metadata with batch_id and candidate_ids for n8n to pass back
    const enrichedMetadata = metadata.map((m, i) => ({
      ...m,
      batch_id: batchId,
      candidate_id: processingCandidates[i] || null,
    }));
    n8nForm.append('metadata', JSON.stringify(enrichedMetadata));

    // Append file buffers
    for (let i = 0; i < files.length; i++) {
      n8nForm.append('files', files[i].buffer, {
        filename: files[i].originalname,
        contentType: files[i].mimetype,
      });
    }

    // Step 3: Forward to n8n webhook
    const n8nUrl = process.env.N8N_CV_WEBHOOK_URL;
    console.log(`   Forwarding to n8n: ${n8nUrl}`);

    const n8nResponse = await new Promise((resolve, reject) => {
      const request = n8nForm.submit(n8nUrl, (err, response) => {
        if (err) return reject(err);
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => resolve({ status: response.statusCode, body }));
      });
      request.on('error', reject);
      // 60s timeout for n8n
      request.setTimeout(60000, () => {
        request.destroy(new Error('n8n request timeout (60s)'));
      });
    });

    console.log(`   n8n responded: ${n8nResponse.status}`);

    if (n8nResponse.status >= 400) {
      console.error(`   n8n error body: ${n8nResponse.body}`);
      // Mark placeholders as error
      for (const cid of processingCandidates) {
        await execute(`UPDATE candidates SET processing_status = 'error', updated_at = now() WHERE id = $1`, [cid]).catch(() => {});
      }
      return res.status(503).json({
        error: 'CV processing service returned an error',
        status: 'error',
        batch_id: batchId,
        n8n_status: n8nResponse.status,
      });
    }

    // Success — n8n accepted the files; it will call back to /webhook-callback
    res.json({
      status: 'processing',
      batch_id: batchId,
      candidate_ids: processingCandidates,
      message: 'CVs are being processed by the AI pipeline.',
    });

  } catch (error) {
    console.error(`❌ Webhook proxy error:`, error.message);

    // Mark any created placeholders as error
    for (const cid of processingCandidates) {
      await execute(`UPDATE candidates SET processing_status = 'error', updated_at = now() WHERE id = $1`, [cid]).catch(() => {});
    }

    // Distinguish between n8n connectivity issues and other errors
    const isNetworkError = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].some(c => error.message.includes(c))
      || error.message.includes('timeout');

    if (isNetworkError) {
      return res.status(503).json({
        error: 'CV processing service is unavailable. Please try again later.',
        status: 'error',
        batch_id: batchId,
      });
    }

    res.status(500).json({ error: error.message, status: 'error', batch_id: batchId });
  }
});

// =====================================================
// WEBHOOK CALLBACK (from n8n)
// =====================================================
app.post('/webhook-callback', async (req, res) => {
  try {
    const body = req.body;
    console.log('=== WEBHOOK CALLBACK RECEIVED ===');

    let dataItems = [];
    if (Array.isArray(body)) {
      dataItems = body.map(item => item.output || item);
    } else if (body.output) {
      dataItems = [body.output];
    } else if (body.candidate_info) {
      dataItems = [body];
    } else {
      return res.status(400).json({ error: 'Invalid payload structure', keys: Object.keys(body) });
    }

    for (const data of dataItems) {
      if (!data.candidate_info) continue;

      const metadata = data.metadata || {};
      const candidateInfo = data.candidate_info || {};
      const workHistory = data.work_history || {};

      let candidateId = null;

      // Strategy 1: Find by batch_id and candidate_id from metadata
      if (metadata.candidate_id) {
        const candidates = await query(`
          SELECT id FROM candidates 
          WHERE id = $1 AND processing_status = 'processing'
        `, [metadata.candidate_id]);
        if (candidates.length > 0) candidateId = candidates[0].id;
      }

      // Strategy 2: Find by batch_id
      if (!candidateId && metadata.batch_id) {
        const candidates = await query(`
          SELECT id FROM candidates 
          WHERE batch_id = $1 AND processing_status = 'processing'
          ORDER BY created_at ASC LIMIT 1
        `, [metadata.batch_id]);
        if (candidates.length > 0) candidateId = candidates[0].id;
      }

      // Strategy 3: Find by email
      if (!candidateId && candidateInfo.email) {
        const candidates = await query(`
          SELECT id FROM candidates 
          WHERE email = $1 AND processing_status = 'processing'
          ORDER BY created_at DESC LIMIT 1
        `, [candidateInfo.email]);
        if (candidates.length > 0) candidateId = candidates[0].id;
      }

      // Strategy 4: Most recent processing candidate
      if (!candidateId) {
        const candidates = await query(`
          SELECT id FROM candidates 
          WHERE processing_status = 'processing'
          ORDER BY batch_created_at DESC LIMIT 1
        `);
        if (candidates.length > 0) candidateId = candidates[0].id;
      }

      const currentOcc = candidateInfo.current_occupation;

      if (!candidateId) {
        const result = await query(`
          INSERT INTO candidates (
            full_name, email, phone, applicant_type, skills, 
            linkedin, current_position, current_company, years_of_experience_text,
            overall_summary, strengths, weaknesses, qualification_score,
            processing_status, batch_id, batch_created_at, uploaded_by
          ) VALUES ($1, $2, $3, 'external', $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed', $13, now(), $14)
          RETURNING id
        `, [
          candidateInfo.full_name || 'Unknown', candidateInfo.email || null, candidateInfo.phone || null,
          data.key_skills || workHistory.key_skills || [], candidateInfo.linkedin || null,
          currentOcc?.title || null, currentOcc?.company || null,
          candidateInfo.years_of_experience || workHistory.total_experience || null,
          data.overall_summary || null, data.strengths || [], data.weaknesses || [],
          data.qualification_score || null, metadata.batch_id || null, metadata.uploader_name || null
        ]);
        candidateId = result[0].id;
      } else {
        await execute(`
          UPDATE candidates SET
            full_name = COALESCE($1, full_name), email = COALESCE($2, email), phone = COALESCE($3, phone),
            skills = $4, linkedin = $5, current_position = $6, current_company = $7,
            years_of_experience_text = $8, overall_summary = $9, strengths = $10, weaknesses = $11,
            qualification_score = $12, processing_status = 'completed', updated_at = now()
          WHERE id = $13
        `, [
          candidateInfo.full_name || null, candidateInfo.email || null, candidateInfo.phone || null,
          data.key_skills || workHistory.key_skills || [], candidateInfo.linkedin || null,
          currentOcc?.title || null, currentOcc?.company || null,
          candidateInfo.years_of_experience || workHistory.total_experience || null,
          data.overall_summary || null, data.strengths || [], data.weaknesses || [],
          data.qualification_score || null, candidateId
        ]);
      }

      // Clear existing related data for idempotency
      await execute('DELETE FROM candidate_education WHERE candidate_id = $1', [candidateId]);
      await execute('DELETE FROM candidate_certifications WHERE candidate_id = $1', [candidateId]);
      await execute('DELETE FROM candidate_work_experience WHERE candidate_id = $1', [candidateId]);

      // Insert education
      if (data.education && Array.isArray(data.education)) {
        for (const edu of data.education) {
          await execute(`INSERT INTO candidate_education (candidate_id, degree, institution, year) VALUES ($1, $2, $3, $4)`,
            [candidateId, edu.degree || 'Unknown', edu.institution || 'Unknown', edu.year || null]);
        }
      }

      // Insert certifications
      if (data.certifications && Array.isArray(data.certifications)) {
        for (const cert of data.certifications) {
          await execute(`INSERT INTO candidate_certifications (candidate_id, name, issuer, year) VALUES ($1, $2, $3, $4)`,
            [candidateId, cert.name || 'Unknown', cert.issuer || null, cert.year || null]);
        }
      }

      // Insert work experiences
      if (workHistory.work_experience && Array.isArray(workHistory.work_experience)) {
        for (const exp of workHistory.work_experience) {
          await execute(`
            INSERT INTO candidate_work_experience (candidate_id, company_name, job_title, description, duration, key_projects)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb)
          `, [candidateId, exp.company || 'Unknown', exp.job_title || 'Unknown', exp.summary || null, exp.duration || null, JSON.stringify(exp.key_projects || [])]);
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
            await execute(`INSERT INTO candidate_timeline (application_id, candidate_id, to_status) VALUES ($1, $2, 'hr_interview')`,
              [appResult[0].id, candidateId]);
          }
        } catch (err) {
          console.error("Error creating application from webhook callback:", err);
        }
      }
    }

    // Log CV upload activity (one entry per batch)
    // Collect unique batch info from processed dataItems
    const batchMap = new Map();
    for (const data of dataItems) {
      if (!data.candidate_info) continue;
      const batchId = data.metadata?.batch_id || 'unknown';
      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, { count: 0, names: [], uploaderName: null, firstCandidateId: null });
      }
      const batch = batchMap.get(batchId);
      batch.count++;
      if (data.candidate_info.full_name) batch.names.push(data.candidate_info.full_name);
      if (!batch.uploaderName) batch.uploaderName = data.metadata?.uploader_name || null;
    }

    // Also look up uploader from candidate rows if not in metadata
    for (const [batchId, batch] of batchMap) {
      if (!batch.uploaderName && batch.names.length > 0) {
        try {
          const uploaders = await query(`SELECT uploaded_by FROM candidates WHERE batch_id = $1 AND uploaded_by IS NOT NULL LIMIT 1`, [batchId]);
          if (uploaders.length > 0) batch.uploaderName = uploaders[0].uploaded_by;
        } catch { /* ignore */ }
      }

      // Get the first candidate id for entity_id
      try {
        const firstCandidate = await query(`SELECT id FROM candidates WHERE batch_id = $1 ORDER BY created_at ASC LIMIT 1`, [batchId]);
        if (firstCandidate.length > 0) batch.firstCandidateId = firstCandidate[0].id;
      } catch { /* ignore */ }

      // Insert activity log entry
      try {
        await execute(`
          INSERT INTO activity_log (activity_type, entity_type, entity_id, performed_by_name, details)
          VALUES ('cv_uploaded', 'candidate', $1, $2, $3::jsonb)
        `, [
          batch.firstCandidateId || '00000000-0000-0000-0000-000000000000',
          batch.uploaderName,
          JSON.stringify({ count: batch.count, batch_id: batchId, candidate_names: batch.names })
        ]);
      } catch (err) {
        console.error('Error logging CV upload activity:', err.message);
      }
    }

    res.json({ success: true, message: 'Webhook callback processed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// RECREATE DATABASE
// =====================================================
app.post('/recreate-db', async (req, res) => {
  try {
    console.log('=== RECREATE DATABASE REQUEST ===');
    // This is dangerous - only use for dev
    res.json({ success: true, message: 'Use schema.sql and seed.sql to recreate the database manually.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// HELPER: Create candidate from webhook
// =====================================================
async function createCandidateFromWebhook(body) {
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
      uploaded_by, processing_status, processing_completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'completed', now())
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

// =====================================================
// ANALYTICS (aggregated server-side)
// =====================================================
app.get('/analytics', async (req, res) => {
  try {
    const { department, level, start_date, end_date } = req.query;

    // Build dynamic WHERE fragments for filters
    const joFilters = [];
    const appFilters = [];
    const params = [];
    let paramIdx = 1;

    if (department) {
      joFilters.push(`jo.department_name = $${paramIdx}`);
      appFilters.push(`jo.department_name = $${paramIdx}`);
      params.push(department);
      paramIdx++;
    }
    if (level) {
      joFilters.push(`jo.level = $${paramIdx}`);
      appFilters.push(`jo.level = $${paramIdx}`);
      params.push(level);
      paramIdx++;
    }
    if (start_date) {
      appFilters.push(`a.applied_date >= $${paramIdx}::timestamptz`);
      joFilters.push(`jo.created_at >= $${paramIdx}::timestamptz`);
      params.push(start_date);
      paramIdx++;
    }
    if (end_date) {
      appFilters.push(`a.applied_date <= $${paramIdx}::timestamptz`);
      joFilters.push(`jo.created_at <= $${paramIdx}::timestamptz`);
      params.push(end_date);
      paramIdx++;
    }

    const joWhere = joFilters.length > 0 ? ' AND ' + joFilters.join(' AND ') : '';
    const appJoWhere = appFilters.length > 0 ? ' AND ' + appFilters.join(' AND ') : '';
    // For queries joining application a + jo
    const appJoin = `candidate_job_applications a JOIN job_orders jo ON a.job_order_id = jo.id`;

    // Run all queries in parallel
    const [
      kpiRows,
      pipelineRows,
      deptRows,
      levelRows,
      sourceRows,
      funnelRows,
      agingRows,
      timeToFillRows,
      avgStageRows,
      deptTurnaroundRows,
      monthlyHiresRows,
      monthlyAppsRows,
      interviewVolumeRows,
      hrVerdictRows,
      techVerdictRows,
      offerRows,
      fillRateRows,
      scoreDistRows,
      workSetupRows,
    ] = await Promise.all([
      // 1. KPIs
      query(`
        SELECT
          COUNT(DISTINCT a.id) FILTER (WHERE a.pipeline_status = 'hired') AS total_hired,
          COUNT(DISTINCT a.id) FILTER (WHERE a.pipeline_status = 'hired'
            AND a.status_changed_date >= date_trunc('month', NOW())) AS hired_this_month,
          COUNT(DISTINCT jo.id) FILTER (WHERE jo.status IN ('open','pooling')) AS active_jobs,
          COUNT(DISTINCT a.id) AS total_applications,
          COUNT(DISTINCT a.candidate_id) AS unique_candidates,
          COUNT(DISTINCT a.id) FILTER (WHERE a.pipeline_status NOT IN ('rejected','hired')) AS active_pipeline,
          ROUND(AVG(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)
            FILTER (WHERE a.pipeline_status = 'hired' AND a.status_changed_date IS NOT NULL AND a.applied_date IS NOT NULL))
            AS avg_time_to_hire,
          ROUND(AVG(a.match_score) FILTER (WHERE a.match_score IS NOT NULL)) AS avg_match_score
        FROM ${appJoin}
        WHERE 1=1 ${appJoWhere}
      `, params),

      // 2. Pipeline distribution
      query(`
        SELECT a.pipeline_status AS status, COUNT(*) AS count
        FROM ${appJoin}
        WHERE 1=1 ${appJoWhere}
        GROUP BY a.pipeline_status ORDER BY count DESC
      `, params),

      // 3. Applications by department
      query(`
        SELECT jo.department_name AS department, COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'hired') AS hired,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'rejected') AS rejected,
          COUNT(*) FILTER (WHERE a.pipeline_status NOT IN ('hired','rejected')) AS active
        FROM ${appJoin}
        WHERE jo.department_name IS NOT NULL ${appJoWhere}
        GROUP BY jo.department_name ORDER BY total DESC
      `, params),

      // 4. Applications by level
      query(`
        SELECT jo.level, COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'hired') AS hired,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'rejected') AS rejected
        FROM ${appJoin}
        WHERE 1=1 ${appJoWhere}
        GROUP BY jo.level ORDER BY jo.level
      `, params),

      // 5. Internal vs External
      query(`
        SELECT c.applicant_type AS source, COUNT(*) AS count,
          ROUND(AVG(c.qualification_score) FILTER (WHERE c.qualification_score IS NOT NULL)) AS avg_score,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'hired') AS hired
        FROM ${appJoin}
          JOIN candidates c ON a.candidate_id = c.id
        WHERE 1=1 ${appJoWhere}
        GROUP BY c.applicant_type
      `, params),

      // 6. Funnel (conversion %, each stage)
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.pipeline_status IN ('hr_interview','tech_interview','offer','hired')) AS reached_hr,
          COUNT(*) FILTER (WHERE a.pipeline_status IN ('tech_interview','offer','hired')) AS reached_tech,
          COUNT(*) FILTER (WHERE a.pipeline_status IN ('offer','hired')) AS reached_offer,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'hired') AS reached_hired
        FROM ${appJoin}
        WHERE 1=1 ${appJoWhere}
      `, params),

      // 7. Pipeline aging (current candidates: how long in current stage)
      query(`
        SELECT a.pipeline_status AS status,
          ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - a.status_changed_date)) / 86400)) AS avg_days,
          MAX(EXTRACT(EPOCH FROM (NOW() - a.status_changed_date)) / 86400)::int AS max_days,
          MIN(EXTRACT(EPOCH FROM (NOW() - a.status_changed_date)) / 86400)::int AS min_days,
          COUNT(*) AS count
        FROM ${appJoin}
        WHERE a.pipeline_status NOT IN ('hired','rejected')
          AND a.status_changed_date IS NOT NULL ${appJoWhere}
        GROUP BY a.pipeline_status
      `, params),

      // 8. Time-to-fill per JO (hired candidates)
      query(`
        SELECT jo.id AS jo_id, jo.title AS jo_title, jo.department_name AS department,
          jo.quantity, jo.hired_count,
          ROUND(AVG(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)) AS avg_days_to_hire,
          MIN(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)::int AS min_days,
          MAX(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)::int AS max_days,
          COUNT(*) AS hires
        FROM ${appJoin}
        WHERE a.pipeline_status = 'hired'
          AND a.status_changed_date IS NOT NULL AND a.applied_date IS NOT NULL ${appJoWhere}
        GROUP BY jo.id, jo.title, jo.department_name, jo.quantity, jo.hired_count
        ORDER BY avg_days_to_hire DESC
      `, params),

      // 9. Avg time per stage (from timeline transitions)
      query(`
        SELECT ct.to_status AS stage,
          ROUND(AVG(ct.duration_days) FILTER (WHERE ct.duration_days IS NOT NULL AND ct.duration_days > 0)) AS avg_duration,
          MAX(ct.duration_days) FILTER (WHERE ct.duration_days IS NOT NULL) AS max_duration,
          MIN(ct.duration_days) FILTER (WHERE ct.duration_days IS NOT NULL AND ct.duration_days > 0) AS min_duration,
          COUNT(*) AS transitions
        FROM candidate_timeline ct
          JOIN ${appJoin} ON ct.application_id = a.id
        WHERE 1=1 ${appJoWhere}
        GROUP BY ct.to_status
      `, params),

      // 10. Department turnaround (avg time to hire per dept)
      query(`
        SELECT jo.department_name AS department,
          ROUND(AVG(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)) AS avg_days,
          COUNT(*) AS hires
        FROM ${appJoin}
        WHERE a.pipeline_status = 'hired'
          AND a.status_changed_date IS NOT NULL AND a.applied_date IS NOT NULL
          AND jo.department_name IS NOT NULL ${appJoWhere}
        GROUP BY jo.department_name ORDER BY avg_days ASC
      `, params),

      // 11. Monthly hires trend (last 12 months)
      query(`
        SELECT to_char(date_trunc('month', a.status_changed_date), 'YYYY-MM') AS month,
          COUNT(*) AS hires
        FROM ${appJoin}
        WHERE a.pipeline_status = 'hired'
          AND a.status_changed_date >= NOW() - INTERVAL '12 months' ${appJoWhere}
        GROUP BY month ORDER BY month
      `, params),

      // 12. Monthly applications trend (last 12 months)
      query(`
        SELECT to_char(date_trunc('month', a.applied_date), 'YYYY-MM') AS month,
          COUNT(*) AS applications
        FROM ${appJoin}
        WHERE a.applied_date >= NOW() - INTERVAL '12 months' ${appJoWhere}
        GROUP BY month ORDER BY month
      `, params),

      // 13. Interview volume by month
      query(`
        SELECT to_char(date_trunc('month', hi.interview_date), 'YYYY-MM') AS month,
          'hr' AS type, COUNT(*) AS count
        FROM hr_interviews hi
          JOIN ${appJoin} ON hi.application_id = a.id
        WHERE hi.interview_date IS NOT NULL ${appJoWhere}
        GROUP BY month
        UNION ALL
        SELECT to_char(date_trunc('month', ti.interview_date), 'YYYY-MM') AS month,
          'tech' AS type, COUNT(*) AS count
        FROM tech_interviews ti
          JOIN ${appJoin} ON ti.application_id = a.id
        WHERE ti.interview_date IS NOT NULL ${appJoWhere}
        GROUP BY month
        ORDER BY month
      `, params),

      // 14. HR interview verdict distribution
      query(`
        SELECT hi.verdict, COUNT(*) AS count
        FROM hr_interviews hi
          JOIN ${appJoin} ON hi.application_id = a.id
        WHERE hi.verdict IS NOT NULL ${appJoWhere}
        GROUP BY hi.verdict
      `, params),

      // 15. Tech interview verdict distribution
      query(`
        SELECT ti.verdict, COUNT(*) AS count
        FROM tech_interviews ti
          JOIN ${appJoin} ON ti.application_id = a.id
        WHERE ti.verdict IS NOT NULL ${appJoWhere}
        GROUP BY ti.verdict
      `, params),

      // 16. Offer stats
      query(`
        SELECT o.status, COUNT(*) AS count
        FROM offers o
          JOIN ${appJoin} ON o.application_id = a.id
        WHERE 1=1 ${appJoWhere}
        GROUP BY o.status
      `, params),

      // 17. Fill rate per JO
      query(`
        SELECT jo.id, jo.title, jo.department_name AS department, jo.level,
          jo.quantity, jo.hired_count, jo.status AS jo_status,
          ROUND(jo.hired_count::numeric / NULLIF(jo.quantity, 0) * 100) AS fill_pct,
          EXTRACT(EPOCH FROM (NOW() - jo.created_at)) / 86400 AS days_open
        FROM job_orders jo
        WHERE 1=1 ${joWhere}
        ORDER BY fill_pct DESC NULLS LAST
      `, params),

      // 18. Score distribution (buckets)
      query(`
        SELECT
          CASE
            WHEN c.qualification_score >= 90 THEN '90-100'
            WHEN c.qualification_score >= 80 THEN '80-89'
            WHEN c.qualification_score >= 70 THEN '70-79'
            WHEN c.qualification_score >= 60 THEN '60-69'
            WHEN c.qualification_score >= 50 THEN '50-59'
            ELSE 'Below 50'
          END AS bucket,
          COUNT(*) AS count
        FROM ${appJoin}
          JOIN candidates c ON a.candidate_id = c.id
        WHERE c.qualification_score IS NOT NULL ${appJoWhere}
        GROUP BY bucket ORDER BY bucket
      `, params),

      // 19. Work setup distribution
      query(`
        SELECT c.preferred_work_setup AS setup, COUNT(*) AS count
        FROM ${appJoin}
          JOIN candidates c ON a.candidate_id = c.id
        WHERE c.preferred_work_setup IS NOT NULL ${appJoWhere}
        GROUP BY c.preferred_work_setup
      `, params),
    ]);

    res.json({
      kpis: kpiRows[0] || {},
      pipeline: pipelineRows,
      byDepartment: deptRows,
      byLevel: levelRows,
      bySource: sourceRows,
      funnel: funnelRows[0] || {},
      aging: agingRows,
      timeToFill: timeToFillRows,
      avgStageDuration: avgStageRows,
      deptTurnaround: deptTurnaroundRows,
      monthlyHires: monthlyHiresRows,
      monthlyApplications: monthlyAppsRows,
      interviewVolume: interviewVolumeRows,
      hrVerdicts: hrVerdictRows,
      techVerdicts: techVerdictRows,
      offers: offerRows,
      fillRate: fillRateRows,
      scoreDistribution: scoreDistRows,
      workSetup: workSetupRows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// HELPER: Get candidate with full details
// =====================================================
async function getCandidateFull(id) {
  const candidates = await query("SELECT * FROM candidates WHERE id = $1", [id]);
  if (candidates.length === 0) return null;

  const candidate = candidates[0];
  const education = await query("SELECT * FROM candidate_education WHERE candidate_id = $1 ORDER BY year DESC NULLS LAST", [id]);
  const certifications = await query("SELECT * FROM candidate_certifications WHERE candidate_id = $1 ORDER BY year DESC NULLS LAST", [id]);
  const workExperiences = await query("SELECT * FROM candidate_work_experience WHERE candidate_id = $1 ORDER BY created_at DESC", [id]);

  return { ...candidate, education, certifications, work_experiences: workExperiences };
}

// =====================================================
// CATCH-ALL
// =====================================================
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------- Start server with DB verification ----------
async function start() {
  await verifyDatabaseConnection();

  const server = app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      pool.end().then(() => {
        console.log('Database pool closed.');
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.API_PORT || 3001;

// ---------- Validate required env vars ----------
const REQUIRED_ENV = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    console.error('   Make sure .env exists in the project root with PGHOST, PGUSER, PGPASSWORD, PGDATABASE');
    process.exit(1);
  }
}

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
  'years_of_experience', 'educational_background', 'cv_url', 'cv_filename',
  'availability', 'preferred_work_setup', 'expected_salary', 'earliest_start_date',
  'uploaded_by', 'uploaded_by_user_id',
  'linkedin', 'current_position', 'current_company', 'years_of_experience_text',
  'overall_summary', 'strengths', 'weaknesses',
  'qualification_score', 'preferred_employment_type',
  'internal_upload_reason', 'internal_from_date', 'internal_to_date',
  'google_drive_file_id', 'google_drive_file_url',
  'batch_id', 'batch_created_at',
  'processing_status', 'processing_batch_id',
  'notice_period'
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
// INIT
// =====================================================
app.post('/init', async (req, res) => {
  try {
    // Tables already created via schema.sql, just seed departments
    await execute(`
      INSERT INTO departments (name) VALUES 
      ('Engineering'), ('Product'), ('Design'), ('Sales'), ('Marketing'), 
      ('Human Resources'), ('Finance'), ('Operations'), ('Legal'), ('Customer Success')
      ON CONFLICT (name) DO NOTHING
    `);
    res.json({ success: true, message: 'Tables initialized and data seeded' });
  } catch (error) {
    console.error('Init error:', error);
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
    sendJobOrderWebhook(result[0], 'update').catch(console.error);
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
const JO_WEBHOOK_URL = 'https://workflow.exist.com.ph/webhook/job-order-webhook-path';
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
      INSERT INTO candidates (full_name, email, phone, applicant_type, skills, years_of_experience, educational_background, availability, preferred_work_setup, expected_salary, cv_url, cv_filename, uploaded_by, processing_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'completed')
      RETURNING *
    `, [body.full_name, body.email, body.phone, body.applicant_type || 'external', body.skills, body.years_of_experience, body.educational_background, body.availability, body.preferred_work_setup, body.expected_salary, body.cv_url, body.cv_filename, body.uploaded_by]);
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

    let sql = `SELECT id, full_name, processing_status, processing_batch_id, processing_started_at, 
           processing_completed_at, cv_filename, applicant_type, created_at FROM candidates
           WHERE processing_status IN ('processing', 'completed')`;
    const params = [];

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
      SELECT a.*, c.full_name as candidate_name, c.email as candidate_email, c.skills, c.years_of_experience,
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

    // Create timeline entry if status changed
    if (validatedBody.pipeline_status && validatedBody.pipeline_status !== fromStatus && candidateId) {
      await execute(`
        INSERT INTO candidate_timeline (application_id, candidate_id, from_status, to_status)
        VALUES ($1, $2, $3, $4)
      `, [id, candidateId, fromStatus, validatedBody.pipeline_status]);
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
// WEBHOOK PROXY (CV upload -> n8n)
// =====================================================
app.post('/webhook-proxy', async (req, res) => {
  try {
    // This endpoint receives multipart form data from the frontend
    // For now, we'll handle the JSON metadata approach
    const webhookUrl = 'https://workflow.exist.com.ph/webhook/vector-db-loader';

    // Forward the raw request body to the webhook
    // Note: For file uploads, the frontend should send FormData
    const body = req.body;
    const metadata = body.metadata || [];
    const uploaderName = body.uploader_name;

    const batchId = crypto.randomUUID();
    console.log(`Starting webhook proxy, batch: ${batchId}, files: ${metadata.length}`);

    const processingCandidates = [];
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
        processingCandidates.push(result[0].id);
      } catch (err) {
        console.error(`Error creating processing placeholder for file ${i}:`, err);
      }
    }

    res.json({
      status: 'processing',
      batch_id: batchId,
      candidate_ids: processingCandidates,
      message: 'CVs are being processed.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

      // Strategy 1: Find by batch_id and index
      if (metadata.batch_id !== undefined && metadata.index !== undefined) {
        const candidates = await query(`
          SELECT id FROM candidates 
          WHERE processing_batch_id = $1 AND processing_index = $2 AND processing_status = 'processing'
        `, [metadata.batch_id, metadata.index]);
        if (candidates.length > 0) candidateId = candidates[0].id;
      }

      // Strategy 2: Find by email
      if (!candidateId && candidateInfo.email) {
        const candidates = await query(`
          SELECT id FROM candidates 
          WHERE email = $1 AND processing_status = 'processing'
          ORDER BY created_at DESC LIMIT 1
        `, [candidateInfo.email]);
        if (candidates.length > 0) candidateId = candidates[0].id;
      }

      // Strategy 3: Find by cv_filename
      if (!candidateId && metadata.filename) {
        const candidates = await query(`
          SELECT id FROM candidates 
          WHERE cv_filename = $1 AND processing_status = 'processing'
          ORDER BY created_at DESC LIMIT 1
        `, [metadata.filename]);
        if (candidates.length > 0) candidateId = candidates[0].id;
      }

      // Strategy 4: Most recent processing candidate
      if (!candidateId) {
        const candidates = await query(`
          SELECT id FROM candidates 
          WHERE processing_status = 'processing'
          ORDER BY processing_started_at DESC LIMIT 1
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
            processing_status, processing_completed_at
          ) VALUES ($1, $2, $3, 'external', $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed', now())
          RETURNING id
        `, [
          candidateInfo.full_name || 'Unknown', candidateInfo.email || null, candidateInfo.phone || null,
          data.key_skills || workHistory.key_skills || [], candidateInfo.linkedin || null,
          currentOcc?.title || null, currentOcc?.company || null,
          candidateInfo.years_of_experience || workHistory.total_experience || null,
          data.overall_summary || null, data.strengths || [], data.weaknesses || [],
          data.qualification_score || null
        ]);
        candidateId = result[0].id;
      } else {
        await execute(`
          UPDATE candidates SET
            full_name = COALESCE($1, full_name), email = COALESCE($2, email), phone = COALESCE($3, phone),
            skills = $4, linkedin = $5, current_position = $6, current_company = $7,
            years_of_experience_text = $8, overall_summary = $9, strengths = $10, weaknesses = $11,
            qualification_score = $12, processing_status = 'completed', processing_completed_at = now(), updated_at = now()
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

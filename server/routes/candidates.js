import { Router } from 'express';
import { query, execute, validateColumns, ALLOWED_CANDIDATE_COLUMNS, getCandidateFull, createCandidateFromWebhook } from '../lib/db.js';
import { validate, createCandidateSchema } from '../middleware/validation.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /candidates
router.get('/candidates', async (req, res) => {
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

// POST /candidates
router.post('/candidates', mutationLimiter, validate(createCandidateSchema), async (req, res) => {
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

// POST /candidates/from-webhook
router.post('/candidates/from-webhook', mutationLimiter, async (req, res) => {
  try {
    const result = await createCandidateFromWebhook(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /candidates/processing-status
router.get('/candidates/processing-status', async (req, res) => {
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
      ${batchId ? `AND batch_id = $1` : ''}
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

// POST /candidates/cleanup
router.post('/candidates/cleanup', async (req, res) => {
  try {
    await execute(`UPDATE candidates SET processing_status = 'failed' WHERE processing_status = 'processing' AND created_at < now() - interval '10 minutes'`);
    const deleted = await query(`DELETE FROM candidates WHERE processing_status = 'failed' AND full_name LIKE 'Processing CV%' RETURNING id`);
    res.json({ success: true, deleted: deleted.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /candidates/:id/full
router.get('/candidates/:id/full', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getCandidateFull(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /candidates/:id
router.get('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query("SELECT * FROM candidates WHERE id = $1", [id]);
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /candidates/:id
router.put('/candidates/:id', mutationLimiter, async (req, res) => {
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

// DELETE /candidates/:id
router.delete('/candidates/:id', mutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    await execute("DELETE FROM candidates WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

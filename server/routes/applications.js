import { Router } from 'express';
import { query, execute, validateColumns, ALLOWED_APPLICATION_COLUMNS } from '../lib/db.js';
import { validate, createApplicationSchema } from '../middleware/validation.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /applications
router.get('/applications', async (req, res) => {
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

// POST /applications
router.post('/applications', mutationLimiter, validate(createApplicationSchema), async (req, res) => {
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

// PUT /applications/:id
router.put('/applications/:id', mutationLimiter, async (req, res) => {
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

export default router;

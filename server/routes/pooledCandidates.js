import { Router } from 'express';
import { query, execute, withTransaction } from '../lib/db.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /applications/:id/pool – Move an application to the talent pool (transactional)
router.post('/applications/:id/pool', async (req, res) => {
  try {
    const { id } = req.params;
    const { pool_reason, pool_notes, pooled_by } = req.body;

    const result = await withTransaction(async (client) => {
      // 1. Lock & fetch the application
      const appRows = (await client.query(
        `SELECT * FROM candidate_job_applications WHERE id = $1 FOR UPDATE`, [id]
      )).rows;
      if (appRows.length === 0) throw new Error('Application not found');
      const app = appRows[0];
      if (app.pipeline_status === 'pooled') throw new Error('Application is already pooled');

      const fromStatus = app.pipeline_status;

      // 2. Update application status to 'pooled'
      await client.query(
        `UPDATE candidate_job_applications SET pipeline_status = 'pooled', status_changed_date = now(), updated_at = now() WHERE id = $1`,
        [id]
      );

      // 3. Insert into pooled_candidates
      const poolRow = (await client.query(`
        INSERT INTO pooled_candidates (candidate_id, original_application_id, original_job_order_id, pooled_from_status, pool_reason, pool_notes, pooled_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [app.candidate_id, id, app.job_order_id, fromStatus, pool_reason || null, pool_notes || null, pooled_by || null])).rows[0];

      // 4. Create timeline entry
      let durationDays = null;
      try {
        const prevEntry = (await client.query(
          `SELECT changed_date FROM candidate_timeline WHERE application_id = $1 ORDER BY changed_date DESC LIMIT 1`, [id]
        )).rows;
        const sinceDate = prevEntry.length > 0 ? new Date(prevEntry[0].changed_date) : (app.applied_date ? new Date(app.applied_date) : null);
        if (sinceDate) durationDays = Math.max(0, Math.round((Date.now() - sinceDate.getTime()) / (1000 * 60 * 60 * 24)));
      } catch (e) { /* ignore */ }

      await client.query(`
        INSERT INTO candidate_timeline (application_id, candidate_id, from_status, to_status, duration_days, notes)
        VALUES ($1, $2, $3, 'pooled', $4, $5)
      `, [id, app.candidate_id, fromStatus, durationDays, `Pooled: ${pool_reason || 'No reason'}`]);

      // 5. Log activity
      await client.query(`
        INSERT INTO activity_log (activity_type, entity_type, entity_id, performed_by_name, details)
        VALUES ('pool_candidate', 'application', $1, $2, $3)
      `, [id, pooled_by || 'System', JSON.stringify({ candidate_id: app.candidate_id, job_order_id: app.job_order_id, from_status: fromStatus, pool_reason, pool_notes })]);

      return poolRow;
    });

    res.json(result);
  } catch (error) {
    console.error('Pool error:', error.message);
    res.status(error.message.includes('not found') || error.message.includes('already pooled') ? 400 : 500).json({ error: error.message });
  }
});

// POST /pooled-candidates/:id/activate – Move a pooled candidate to a new (or same) JO
router.post('/pooled-candidates/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const { target_job_order_id, target_pipeline_status } = req.body;
    if (!target_job_order_id) return res.status(400).json({ error: 'target_job_order_id is required' });
    const pipelineStatus = target_pipeline_status || 'hr_interview';

    const result = await withTransaction(async (client) => {
      // 1. Lock & fetch pooled record
      const poolRows = (await client.query(
        `SELECT * FROM pooled_candidates WHERE id = $1 FOR UPDATE`, [id]
      )).rows;
      if (poolRows.length === 0) throw new Error('Pooled record not found');
      const pooled = poolRows[0];
      if (pooled.disposition !== 'available') throw new Error(`Cannot activate: disposition is '${pooled.disposition}'`);

      // 2. Check if candidate already has an active application for target JO
      const existingApp = (await client.query(
        `SELECT id FROM candidate_job_applications WHERE candidate_id = $1 AND job_order_id = $2 AND pipeline_status != 'pooled'`,
        [pooled.candidate_id, target_job_order_id]
      )).rows;
      if (existingApp.length > 0) throw new Error('Candidate already has an active application for this job order');

      // 3. Fetch the original application's data for carryover
      const origApp = (await client.query(
        `SELECT match_score, employment_type, remarks FROM candidate_job_applications WHERE id = $1`,
        [pooled.original_application_id]
      )).rows[0] || {};

      // 4. Create new application for the target JO
      const newApp = (await client.query(`
        INSERT INTO candidate_job_applications (candidate_id, job_order_id, pipeline_status, match_score, employment_type, remarks)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (candidate_id, job_order_id) DO UPDATE SET pipeline_status = $3, status_changed_date = now(), updated_at = now()
        RETURNING *
      `, [pooled.candidate_id, target_job_order_id, pipelineStatus, origApp.match_score, origApp.employment_type, origApp.remarks])).rows[0];

      // 5. Update pooled record disposition
      await client.query(`
        UPDATE pooled_candidates SET disposition = 'activated', disposition_changed_at = now(),
          new_application_id = $1, new_job_order_id = $2, updated_at = now()
        WHERE id = $3
      `, [newApp.id, target_job_order_id, id]);

      // 6. Timeline entry on the new application
      await client.query(`
        INSERT INTO candidate_timeline (application_id, candidate_id, from_status, to_status, notes)
        VALUES ($1, $2, 'pooled', $3, 'Re-activated from talent pool')
      `, [newApp.id, pooled.candidate_id, pipelineStatus]);

      // 7. Activity log
      await client.query(`
        INSERT INTO activity_log (activity_type, entity_type, entity_id, performed_by_name, details)
        VALUES ('activate_from_pool', 'application', $1, 'System', $2)
      `, [newApp.id, JSON.stringify({ pooled_record_id: id, original_jo_id: pooled.original_job_order_id, target_jo_id: target_job_order_id, target_status: pipelineStatus })]);

      return newApp;
    });

    res.json(result);
  } catch (error) {
    console.error('Activate error:', error.message);
    res.status(error.message.includes('not found') || error.message.includes('Cannot activate') || error.message.includes('already has') ? 400 : 500).json({ error: error.message });
  }
});

// GET /pooled-candidates – List pooled candidates with candidate & JO details
router.get('/pooled-candidates', async (req, res) => {
  try {
    const { disposition, job_order_id, search } = req.query;
    let sql = `
      SELECT pc.*,
        c.full_name, c.email, c.phone, c.skills, c.years_of_experience_text,
        c.current_position, c.current_company, c.qualification_score, c.applicant_type, c.linkedin,
        c.expected_salary, c.earliest_start_date, c.overall_summary, c.strengths, c.weaknesses,
        j.jo_number AS original_jo_number, j.title AS original_jo_title, j.department_name AS original_department,
        a.match_score, a.pipeline_status AS current_app_status
      FROM pooled_candidates pc
      JOIN candidates c ON pc.candidate_id = c.id
      JOIN job_orders j ON pc.original_job_order_id = j.id
      JOIN candidate_job_applications a ON pc.original_application_id = a.id
    `;
    const conditions = [];
    const params = [];

    if (disposition) { conditions.push(`pc.disposition = $${params.length + 1}`); params.push(disposition); }
    if (job_order_id) { conditions.push(`pc.original_job_order_id = $${params.length + 1}`); params.push(job_order_id); }
    if (search) {
      conditions.push(`(c.full_name ILIKE $${params.length + 1} OR c.email ILIKE $${params.length + 1} OR c.current_position ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ' ORDER BY pc.pooled_at DESC';

    const rows = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /pooled-candidates/:id – Update disposition
router.patch('/pooled-candidates/:id', mutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { disposition, disposition_notes } = req.body;
    if (!disposition) return res.status(400).json({ error: 'disposition is required' });

    const validDispositions = ['available', 'not_suitable', 'on_hold', 'activated', 'archived'];
    if (!validDispositions.includes(disposition)) return res.status(400).json({ error: `Invalid disposition. Must be one of: ${validDispositions.join(', ')}` });

    const result = await query(`
      UPDATE pooled_candidates SET disposition = $1, disposition_notes = $2, disposition_changed_at = now()
      WHERE id = $3 RETURNING *
    `, [disposition, disposition_notes || null, id]);

    if (result.length === 0) return res.status(404).json({ error: 'Pooled record not found' });
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /pooled-candidates/bulk-action – Bulk update disposition
router.post('/pooled-candidates/bulk-action', mutationLimiter, async (req, res) => {
  try {
    const { ids, disposition, disposition_notes } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array is required' });
    if (!disposition) return res.status(400).json({ error: 'disposition is required' });

    const validDispositions = ['available', 'not_suitable', 'on_hold', 'archived'];
    if (!validDispositions.includes(disposition)) return res.status(400).json({ error: `Invalid disposition. Must be one of: ${validDispositions.join(', ')}` });

    const result = await query(`
      UPDATE pooled_candidates SET disposition = $1, disposition_notes = $2, disposition_changed_at = now()
      WHERE id = ANY($3) RETURNING *
    `, [disposition, disposition_notes || null, ids]);

    res.json({ updated: result.length, records: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

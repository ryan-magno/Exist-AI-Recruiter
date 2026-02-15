import { Router } from 'express';
import { query, execute } from '../lib/db.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// =====================================================
// TIMELINE
// =====================================================
router.get('/timeline', async (req, res) => {
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
router.get('/activity-log', async (req, res) => {
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

router.post('/activity-log', mutationLimiter, async (req, res) => {
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

export default router;

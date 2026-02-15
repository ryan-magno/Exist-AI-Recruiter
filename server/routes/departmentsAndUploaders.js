import { Router } from 'express';
import { query, execute } from '../lib/db.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// =====================================================
// DEPARTMENTS
// =====================================================
router.get('/departments', async (req, res) => {
  try {
    res.json(await query("SELECT * FROM departments ORDER BY name"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/departments', mutationLimiter, async (req, res) => {
  try {
    const body = req.body;
    if (!body.name?.trim()) return res.status(400).json({ error: 'Department name is required' });
    const result = await query(`INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`, [body.name.trim()]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/departments/:id', mutationLimiter, async (req, res) => {
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

router.delete('/departments/:id', mutationLimiter, async (req, res) => {
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
router.get('/cv-uploaders', async (req, res) => {
  try {
    res.json(await query("SELECT DISTINCT ON (name) * FROM cv_uploaders ORDER BY name, created_at"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cv-uploaders', mutationLimiter, async (req, res) => {
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

router.delete('/cv-uploaders', mutationLimiter, async (req, res) => {
  try {
    await query(`DELETE FROM cv_uploaders WHERE id NOT IN (SELECT MIN(id::text)::uuid FROM cv_uploaders GROUP BY name)`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import { Router } from 'express';
import { query, execute, runMigrations } from '../lib/db.js';

const router = Router();

// ---------- Health check ----------
router.get('/health', async (req, res) => {
  try {
    const pool = (await import('../lib/db.js')).pool;
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// ---------- Init ----------
router.post('/init', async (req, res) => {
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

// ---------- Migrate ----------
router.post('/migrate', async (req, res) => {
  try {
    const result = await runMigrations();
    res.json(result);
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------- Recreate DB ----------
router.post('/recreate-db', async (req, res) => {
  try {
    console.log('=== RECREATE DATABASE REQUEST ===');
    // This is dangerous - only use for dev
    res.json({ success: true, message: 'Use schema.sql and seed.sql to recreate the database manually.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

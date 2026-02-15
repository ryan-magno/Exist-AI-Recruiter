import { Router } from 'express';
import { query, execute, validateColumns, ALLOWED_JOB_ORDER_COLUMNS, withTransaction } from '../lib/db.js';
import { validate, createJobOrderSchema } from '../middleware/validation.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Job Order Webhook helper
const JO_WEBHOOK_URL = process.env.N8N_JO_WEBHOOK_URL;
async function sendJobOrderWebhook(jobOrder, action) {
  if (!JO_WEBHOOK_URL) {
    console.warn('⚠️  N8N_JO_WEBHOOK_URL not configured, skipping JO webhook');
    return;
  }
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

// GET /job-titles
router.get('/job-titles', async (req, res) => {
  try {
    const rows = await query(
      "SELECT DISTINCT title, level FROM public.job_orders WHERE status IS NULL OR status != 'closed' ORDER BY title, level"
    );
    const titles = rows.map(r => r.level ? `${r.title} (${r.level})` : r.title);
    res.json({ titles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /job-orders
router.get('/job-orders', async (req, res) => {
  try {
    const rows = await query("SELECT * FROM job_orders ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /job-orders/count
router.get('/job-orders/count', async (req, res) => {
  try {
    const rows = await query("SELECT COUNT(*) as count FROM job_orders");
    res.json({ count: parseInt(rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /job-orders/pooled
router.get('/job-orders/pooled', async (req, res) => {
  try {
    const rows = await query(`
      SELECT DISTINCT j.*, 
        (SELECT COUNT(*) FROM pooled_candidates pc WHERE pc.original_job_order_id = j.id AND pc.disposition = 'available') AS available_pool_count,
        (SELECT COUNT(*) FROM pooled_candidates pc WHERE pc.original_job_order_id = j.id) AS total_pool_count
      FROM job_orders j
      WHERE j.status = 'pooling'
        OR EXISTS (SELECT 1 FROM pooled_candidates pc WHERE pc.original_job_order_id = j.id)
      ORDER BY j.updated_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /job-orders
router.post('/job-orders', mutationLimiter, validate(createJobOrderSchema), async (req, res) => {
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

// PUT /job-orders/:id
router.put('/job-orders/:id', mutationLimiter, async (req, res) => {
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

    // Determine webhook action: deactivating (closed/archived) sends 'delete', otherwise 'update'
    const newStatus = result[0]?.status;
    const INACTIVE_STATUSES = ['closed', 'archived'];
    const wasActive = !INACTIVE_STATUSES.includes(oldStatus);
    const isNowInactive = INACTIVE_STATUSES.includes(newStatus);
    const wasInactive = INACTIVE_STATUSES.includes(oldStatus);
    const isNowActive = !INACTIVE_STATUSES.includes(newStatus);
    const webhookAction = (isNowInactive && wasActive) ? 'delete'
      : (isNowActive && wasInactive) ? 'update'
      : (oldStatus !== newStatus) ? 'update'
      : 'update';
    sendJobOrderWebhook(result[0], webhookAction).catch(console.error);

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /job-orders/:id
router.delete('/job-orders/:id', mutationLimiter, async (req, res) => {
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

// PATCH /job-orders/:id/status
router.patch('/job-orders/:id/status', mutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const validStatuses = ['open', 'closed', 'on_hold', 'pooling', 'archived'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: `Invalid status: ${status}` });

    // Fetch old status before updating (for webhook logic)
    const oldRows = await query("SELECT status FROM job_orders WHERE id = $1", [id]);
    if (oldRows.length === 0) return res.status(404).json({ error: 'Job order not found' });
    const oldStatus = oldRows[0].status;

    const result = await query(`UPDATE job_orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`, [status, id]);
    if (result.length === 0) return res.status(404).json({ error: 'Job order not found' });

    // Trigger webhook: deactivating (closed/archived) sends 'delete', reactivating sends 'update'
    const INACTIVE_STATUSES = ['closed', 'archived'];
    const wasActive = !INACTIVE_STATUSES.includes(oldStatus);
    const isNowInactive = INACTIVE_STATUSES.includes(status);
    const wasInactive = INACTIVE_STATUSES.includes(oldStatus);
    const isNowActive = !INACTIVE_STATUSES.includes(status);
    if (isNowInactive && wasActive) {
      sendJobOrderWebhook(result[0], 'delete').catch(console.error);
    } else if (isNowActive && wasInactive) {
      sendJobOrderWebhook(result[0], 'update').catch(console.error);
    }

    // If transitioning to 'pooling', auto-pool all non-hired/non-rejected candidates
    if (status === 'pooling') {
      try {
        const appsToPool = await query(`
          SELECT id, candidate_id, pipeline_status FROM candidate_job_applications
          WHERE job_order_id = $1 AND pipeline_status NOT IN ('pooled', 'hired', 'rejected')
        `, [id]);

        for (const app of appsToPool) {
          await withTransaction(async (client) => {
            await client.query(
              `UPDATE candidate_job_applications SET pipeline_status = 'pooled', status_changed_date = now() WHERE id = $1`, [app.id]
            );
            await client.query(`
              INSERT INTO pooled_candidates (candidate_id, original_application_id, original_job_order_id, pooled_from_status, pool_reason, pooled_by)
              VALUES ($1, $2, $3, $4, 'JO moved to pooling', 'System')
              ON CONFLICT (original_application_id) DO NOTHING
            `, [app.candidate_id, app.id, id, app.pipeline_status]);
            await client.query(`
              INSERT INTO candidate_timeline (application_id, candidate_id, from_status, to_status, notes)
              VALUES ($1, $2, $3, 'pooled', 'Auto-pooled: JO status changed to pooling')
            `, [app.id, app.candidate_id, app.pipeline_status]);
          });
        }
        console.log(`Auto-pooled ${appsToPool.length} candidates from JO ${id}`);
      } catch (poolErr) {
        console.error('Auto-pool error (non-fatal):', poolErr.message);
      }
    }

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export sendJobOrderWebhook so webhooks route can use it if needed
export { sendJobOrderWebhook };
export default router;

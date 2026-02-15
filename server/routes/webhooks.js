import { Router } from 'express';
import { query, execute } from '../lib/db.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import multer from 'multer';
import FormData from 'form-data';

const router = Router();

// Multer config (for CV file uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// =====================================================
// EMAIL WEBHOOK PROXY (frontend -> n8n email service)
// =====================================================
router.post('/email-webhook', async (req, res) => {
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
router.post('/webhook-proxy', uploadLimiter, upload.array('files'), async (req, res) => {
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
// NOTE: Currently unused — n8n Workflow 3 writes directly to PostgreSQL
// via its own SQL CTE, bypassing this callback. Preserved for potential
// future use if webhook architecture changes.
// =====================================================
router.post('/webhook-callback', async (req, res) => {
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

export default router;

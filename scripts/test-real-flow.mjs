#!/usr/bin/env node
/**
 * Exist AI Recruiter — Full E2E Integration Test
 *
 * Tests all 3 n8n workflows end-to-end:
 *   Workflow 1: Resource Requirements Embeddings (JO → Gemini → Azure AI Search)
 *   Workflow 3: CV Upload to Vector DB (CV → GPT-4.1 analysis → embedding → DB)
 *   Workflow 4: Chatbot (RAG via Azure OpenAI + Azure AI Search)
 *
 * Steps:
 *   0. Health check
 *   1. Clear all DB data
 *   2. Create 5 Job Orders (triggers Workflow 1)
 *   3. Upload 6 CVs using 2 PDFs with variations (triggers Workflow 3)
 *   4. Poll for processing completion
 *   5. Deep verification of processed candidates
 *   6. Chatbot streaming test (Workflow 4)
 *   7. Final summary with pass/fail
 *
 * Usage:  node scripts/test-real-flow.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const CHAT_WEBHOOK_URL = 'https://workflow.exist.com.ph/webhook/51c69627-4831-44a4-8d91-1824a7d38ebf';

const PDF_RYAN  = path.resolve(__dirname, '..', 'mockData', 'Ryan Gabriel Magno - Resume.pdf');
const PDF_ALEX  = path.resolve(__dirname, '..', 'mockData', 'Alex Mercer - Resume.pdf');

// ── Test Results Tracker ─────────────────────────
const results = [];
function recordTest(id, name, passed, detail = '') {
  results.push({ id, name, passed, detail });
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} [${id}] ${name}${detail ? ' — ' + detail : ''}`);
}

// ── Helpers ──────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(method, endpoint, body = null, isForm = false) {
  const opts = { method };
  if (body && !isForm) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  } else if (body && isForm) {
    opts.body = body;
  }
  const res = await fetch(`${API_URL}${endpoint}`, opts);
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${endpoint} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function psql(sql) {
  return execSync(
    `PGPASSWORD='p@ssword123' psql "host=exist-ai-recruiter.postgres.database.azure.com port=5432 dbname=postgres user=existpostgres sslmode=require" -c "${sql}" 2>&1`,
    { encoding: 'utf-8', timeout: 15000 }
  ).trim();
}

// ── Step 0: Health check ─────────────────────────
async function healthCheck() {
  console.log('\n━━━ Step 0 ━━━ Health check');
  try {
    const h = await api('GET', '/health');
    recordTest('0.1', 'Server health check', h.db === 'connected', `DB: ${h.db}`);
  } catch (err) {
    recordTest('0.1', 'Server health check', false, err.message);
    console.log(`\n  ❌ Server not reachable at ${API_URL}. Aborting.`);
    process.exit(1);
  }
}

// ── Step 1: Clear all data ───────────────────────
async function clearAllData() {
  console.log('\n━━━ Step 1 ━━━ Clear ALL data (fresh start)');

  const tables = [
    'activity_log', 'candidate_timeline', 'offers',
    'tech_interviews', 'hr_interviews', 'candidate_job_applications',
    'application_history', 'candidate_work_experience',
    'candidate_certifications', 'candidate_education',
    'cv_uploaders', 'candidates', 'job_orders',
  ];

  let clearOk = true;
  for (const t of tables) {
    try {
      psql(`DELETE FROM ${t};`);
    } catch (e) {
      console.log(`  ⚠️  ${t}: ${e.message.split('\n')[0]}`);
      clearOk = false;
    }
  }

  const c = await api('GET', '/candidates?include_processing=true');
  const j = await api('GET', '/job-orders');
  const empty = c.length === 0 && j.length === 0;
  recordTest('1.1', 'Clear all DB tables', clearOk && empty, `Candidates: ${c.length}, JOs: ${j.length}`);
}

// ── Step 2: Create 5 Job Orders (Workflow 1) ─────
const JOB_ORDERS = [
  {
    jo_number: 'JO-2026-001', title: 'Senior Full-Stack Developer',
    description: '<p>Experienced Full-Stack Dev for React/Node.js recruitment platform. 5+ years with modern web frameworks, PostgreSQL, API design, CI/CD pipelines.</p>',
    level: 'L3', quantity: 3, required_date: '2026-03-15', status: 'open',
    department_name: 'Engineering', employment_type: 'full_time', requestor_name: 'Maria Santos',
  },
  {
    jo_number: 'JO-2026-002', title: 'Product Manager',
    description: '<p>Strategic PM to lead AI recruiting product roadmap. 3+ years PM experience in B2B SaaS, strong analytical skills, stakeholder management.</p>',
    level: 'L4', quantity: 1, required_date: '2026-04-01', status: 'open',
    department_name: 'Product', employment_type: 'full_time', requestor_name: 'Jose Reyes',
  },
  {
    jo_number: 'JO-2026-003', title: 'UX/UI Designer',
    description: '<p>Creative designer for intuitive recruitment platform UX. Figma expertise, design systems experience, user research skills required.</p>',
    level: 'L2', quantity: 2, required_date: '2026-03-01', status: 'open',
    department_name: 'Design', employment_type: 'contract', requestor_name: 'Anna Cruz',
  },
  {
    jo_number: 'JO-2026-004', title: 'DevOps Engineer',
    description: '<p>Azure cloud infrastructure, Kubernetes, IaC expertise needed. Docker proficiency, Terraform or Bicep experience required.</p>',
    level: 'L3', quantity: 1, required_date: '2026-02-28', status: 'open',
    department_name: 'Engineering', employment_type: 'full_time', requestor_name: 'Carlos Tan',
  },
  {
    jo_number: 'JO-2026-005', title: 'Marketing Coordinator',
    description: '<p>Entry-level marketing role supporting employer branding efforts. Social media management, content creation, basic analytics.</p>',
    level: 'L1', quantity: 1, required_date: '2026-05-01', status: 'open',
    department_name: 'Marketing', employment_type: 'part_time', requestor_name: 'Lisa Go',
  },
];

async function createJobOrders() {
  console.log('\n━━━ Step 2 ━━━ Create 5 Job Orders (triggers Workflow 1: Resource Embeddings)');
  const created = [];

  for (let i = 0; i < JOB_ORDERS.length; i++) {
    const jo = JOB_ORDERS[i];
    console.log(`  📋 Creating ${jo.jo_number} — ${jo.title}...`);
    try {
      const result = await api('POST', '/job-orders', jo);
      recordTest(`2.${i + 1}`, `Create JO ${jo.jo_number}`, !!result.id, `ID: ${result.id?.substring(0, 8)}...`);
      created.push(result);
      await sleep(500);
    } catch (err) {
      recordTest(`2.${i + 1}`, `Create JO ${jo.jo_number}`, false, err.message);
    }
  }

  const total = (await api('GET', '/job-orders')).length;
  recordTest('2.6', 'All 5 JOs in DB', total === 5, `Count: ${total}`);
  return created;
}

// ── Step 3: Upload 6 CVs with 2 PDFs ────────────
async function uploadCandidates(jobOrders) {
  console.log('\n━━━ Step 3 ━━━ Upload 6 CVs via /webhook-proxy (triggers Workflow 3: CV Processing)');

  for (const p of [PDF_RYAN, PDF_ALEX]) {
    if (!fs.existsSync(p)) {
      recordTest('3.0', `PDF exists: ${path.basename(p)}`, false, 'File not found');
      process.exit(1);
    }
  }

  const ryanBuf  = fs.readFileSync(PDF_RYAN);
  const alexBuf  = fs.readFileSync(PDF_ALEX);
  const ryanName = path.basename(PDF_RYAN);
  const alexName = path.basename(PDF_ALEX);

  console.log(`  📄 PDF 1: ${ryanName} (${(ryanBuf.length / 1024).toFixed(1)} KB)`);
  console.log(`  📄 PDF 2: ${alexName} (${(alexBuf.length / 1024).toFixed(1)} KB)\n`);

  const jo = (idx) => jobOrders[idx]
    ? { job_order_id: jobOrders[idx].id, job_order_title: jobOrders[idx].title, jo_number: jobOrders[idx].jo_number }
    : 'ai-decide';

  const scenarios = [
    { label: 'Ryan → Sr Full-Stack Dev (JO-001)',    uploader: 'HR Admin',        type: 'external', applying: jo(0), pdf: ryanBuf, pdfName: ryanName },
    { label: 'Alex → Product Manager (JO-002)',      uploader: 'Recruitment Team', type: 'external', applying: jo(1), pdf: alexBuf, pdfName: alexName },
    { label: 'Ryan → UX/UI Designer (JO-003) [int]', uploader: 'HR Admin',        type: 'internal', applying: jo(2), pdf: ryanBuf, pdfName: ryanName,
      from_date: '2023-06-01', department: 'Engineering', upload_reason: 'role-change' },
    { label: 'Alex → Let AI decide',                 uploader: 'Sarah Lim',       type: 'external', applying: 'ai-decide', pdf: alexBuf, pdfName: alexName },
    { label: 'Ryan → Marketing Coord (JO-005) [int]', uploader: 'HR Admin',        type: 'internal', applying: jo(4), pdf: ryanBuf, pdfName: ryanName,
      from_date: '2024-01-15', department: 'Marketing', upload_reason: 'benched' },
    { label: 'Alex → DevOps Engineer (JO-004)',      uploader: 'Carlos Tan',      type: 'external', applying: jo(3), pdf: alexBuf, pdfName: alexName },
  ];

  const uploadResults = [];

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    console.log(`  📤 Upload ${i + 1}/${scenarios.length}: ${s.label}`);

    const formData = new FormData();
    formData.append('uploader_name', s.uploader);
    formData.append('upload_timestamp', new Date().toISOString());
    formData.append('total_files', '1');

    const blob = new Blob([s.pdf], { type: 'application/pdf' });
    formData.append('files', blob, s.pdfName);

    const meta = [{
      index: 0,
      filename: s.pdfName,
      size_bytes: s.pdf.length,
      applicant_type: s.type,
      applying_for: s.applying,
      ...(s.type === 'internal' && {
        from_date: s.from_date || null,
        to_date: null,
        department: s.department || null,
        upload_reason: s.upload_reason || null,
        other_reason: null,
      }),
    }];
    formData.append('metadata', JSON.stringify(meta));

    try {
      const r = await api('POST', '/webhook-proxy', formData, true);
      const ok = r.status === 'processing' && !!r.batch_id && r.candidate_ids?.length > 0;
      recordTest(`3.${i + 1}`, `Upload: ${s.label}`, ok, `batch: ${r.batch_id?.substring(0, 8)}...`);
      uploadResults.push(r);
    } catch (err) {
      recordTest(`3.${i + 1}`, `Upload: ${s.label}`, false, err.message);
    }

    if (i < scenarios.length - 1) {
      console.log('     ⏳ Waiting 3s...');
      await sleep(3000);
    }
  }

  return uploadResults;
}

// ── Step 4: Poll for processing completion ───────
async function pollForCompletion(maxWaitSec = 180) {
  console.log(`\n━━━ Step 4 ━━━ Polling for n8n processing completion (max ${maxWaitSec}s)`);

  const start = Date.now();
  let lastMsg = '';
  let finalAll = [];

  while ((Date.now() - start) / 1000 < maxWaitSec) {
    const all = await api('GET', '/candidates?include_processing=true');
    finalAll = all;
    const proc = all.filter(c => c.processing_status === 'processing').length;
    const done = all.filter(c => c.processing_status === 'completed' || !c.processing_status).length;
    const errs = all.filter(c => c.processing_status === 'error').length;
    const msg = `Processing: ${proc} | Completed: ${done} | Errors: ${errs}`;

    if (msg !== lastMsg) { console.log(`  ℹ️  ${msg}`); lastMsg = msg; }
    if (proc === 0) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      recordTest('4.1', 'All CVs processed by n8n', errs === 0, `${done} completed, ${errs} errors in ${elapsed}s`);
      return finalAll;
    }

    process.stdout.write('.');
    await sleep(5000);
  }

  const proc = finalAll.filter(c => c.processing_status === 'processing').length;
  recordTest('4.1', 'All CVs processed by n8n', false, `Timed out — ${proc} still processing`);
  return finalAll;
}

// ── Step 5: Deep verification of processed data ──
async function deepVerification() {
  console.log('\n━━━ Step 5 ━━━ Deep verification of n8n-processed candidates');

  const candidates = await api('GET', '/candidates?include_processing=true');
  const completedCandidates = candidates.filter(c => c.processing_status === 'completed' || !c.processing_status);

  // 5.1 — At least some candidates were fully processed
  recordTest('5.1', 'Candidates exist after processing', completedCandidates.length > 0,
    `${completedCandidates.length} completed`);

  if (completedCandidates.length === 0) {
    console.log('  ⚠️  No completed candidates — skipping deep checks');
    return;
  }

  // 5.2 — Check each candidate has AI-extracted fields
  let allHaveNames = true, allHaveEmails = true, allHaveSkills = true;
  let allHaveSummary = true, allHaveScore = true;
  let totalEdu = 0, totalCerts = 0, totalWork = 0, totalApps = 0;

  for (const c of completedCandidates) {
    // Fetch full details
    let full;
    try {
      full = await api('GET', `/candidates/${c.id}/full`);
    } catch {
      full = c;
    }

    if (!full.full_name || full.full_name.startsWith('Processing CV'))  allHaveNames = false;
    if (!full.email) allHaveEmails = false;
    if (!full.skills || (Array.isArray(full.skills) && full.skills.length === 0)) allHaveSkills = false;
    if (!full.overall_summary) allHaveSummary = false;
    if (!full.qualification_score && full.qualification_score !== 0) allHaveScore = false;

    // Count child records
    if (full.education) totalEdu += full.education.length;
    if (full.certifications) totalCerts += full.certifications.length;
    if (full.work_experiences) totalWork += full.work_experiences.length;
  }

  recordTest('5.2', 'All candidates have AI-extracted names', allHaveNames,
    completedCandidates.map(c => c.full_name).join(', '));
  recordTest('5.3', 'All candidates have email addresses', allHaveEmails,
    completedCandidates.map(c => c.email || 'MISSING').join(', '));
  recordTest('5.4', 'All candidates have skills extracted', allHaveSkills);
  recordTest('5.5', 'All candidates have AI overall summary', allHaveSummary);
  recordTest('5.6', 'All candidates have qualification score', allHaveScore,
    completedCandidates.map(c => c.qualification_score || 'MISSING').join(', '));

  // 5.7 — Education records inserted
  recordTest('5.7', 'Education records populated', totalEdu > 0, `${totalEdu} total records`);

  // 5.8 — Work experience records inserted
  recordTest('5.8', 'Work experience records populated', totalWork > 0, `${totalWork} total records`);

  // 5.9 — Certifications (may or may not have them)
  console.log(`  ℹ️  Certifications: ${totalCerts} total records`);

  // 5.10 — Applications auto-created for JO-linked uploads
  const apps = await api('GET', '/applications');
  totalApps = apps.length;
  recordTest('5.9', 'Applications auto-created', totalApps > 0, `${totalApps} applications`);

  // 5.10 — Timeline entries exist
  let totalTimeline = 0;
  for (const a of apps) {
    try {
      const tl = await api('GET', `/timeline?application_id=${a.id}`);
      if (Array.isArray(tl)) totalTimeline += tl.length;
    } catch { /* skip */ }
  }
  recordTest('5.10', 'Timeline entries created', totalTimeline > 0, `${totalTimeline} entries`);

  // 5.11 — Strengths and weaknesses populated
  let hasStrengths = false, hasWeaknesses = false;
  for (const c of completedCandidates) {
    if (c.strengths && c.strengths.length > 0) hasStrengths = true;
    if (c.weaknesses && c.weaknesses.length > 0) hasWeaknesses = true;
  }
  recordTest('5.11', 'AI strengths analysis populated', hasStrengths);
  recordTest('5.12', 'AI weaknesses analysis populated', hasWeaknesses);

  // 5.13 — Activity log has CV upload entries
  const actLogs = await api('GET', '/activity-log?limit=100');
  const cvLogs = actLogs.filter(a => a.activity_type === 'cv_uploaded');
  recordTest('5.13', 'Activity log has cv_uploaded entries', cvLogs.length > 0, `${cvLogs.length} entries`);

  // Print detailed candidate info
  console.log('\n  ── Candidate Details ──');
  for (const c of completedCandidates) {
    let full;
    try { full = await api('GET', `/candidates/${c.id}/full`); } catch { full = c; }
    console.log(`\n    👤 ${full.full_name || '(unknown)'}`);
    console.log(`       Email: ${full.email || 'N/A'} | Phone: ${full.phone || 'N/A'}`);
    console.log(`       Type: ${full.applicant_type || '?'} | Score: ${full.qualification_score || 'N/A'}`);
    console.log(`       Position: ${full.current_position || 'N/A'} @ ${full.current_company || 'N/A'}`);
    console.log(`       Skills: ${Array.isArray(full.skills) ? full.skills.slice(0, 5).join(', ') : 'N/A'}`);
    console.log(`       Summary: ${(full.overall_summary || 'N/A').substring(0, 120)}...`);
    console.log(`       Education: ${full.education?.length || 0} | Work: ${full.work_experiences?.length || 0} | Certs: ${full.certifications?.length || 0}`);
    if (full.strengths?.length) console.log(`       Strengths: ${full.strengths.slice(0, 3).join(', ')}`);
    if (full.weaknesses?.length) console.log(`       Weaknesses: ${full.weaknesses.slice(0, 3).join(', ')}`);
  }
}

// ── Step 6: Chatbot streaming test (Workflow 4) ──
async function testChatbot() {
  console.log('\n━━━ Step 6 ━━━ Chatbot streaming test (Workflow 4: RAG via Azure OpenAI)');

  const sessionId = `test-session-${Date.now()}`;

  // Test 6.1 — Basic connectivity
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    console.log('  🤖 Sending: "Which candidates are best suited for the Senior Full-Stack Developer position?"');
    const resp = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        chatInput: 'Which candidates are best suited for the Senior Full-Stack Developer position?',
        sessionId,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    recordTest('6.1', 'Chat webhook responds', resp.ok, `Status: ${resp.status}`);

    if (!resp.ok) {
      console.log(`  ❌ Chat webhook returned ${resp.status}`);
      return;
    }

    // Read streaming response (NDJSON)
    const reader = resp.body?.getReader();
    if (!reader) {
      recordTest('6.2', 'Response is streamable', false, 'No reader');
      return;
    }
    recordTest('6.2', 'Response is streamable', true);

    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    let chunkCount = 0;
    let gotEndToken = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.type === 'item' && parsed.content) {
            fullResponse += parsed.content;
            chunkCount++;
          }
          if (parsed.type === 'end') gotEndToken = true;
        } catch {
          // Non-JSON line — might be raw text
          fullResponse += trimmed;
          chunkCount++;
        }
      }
    }

    // If no NDJSON items parsed, the response might be plain text or a single JSON object
    if (chunkCount === 0 && fullResponse === '') {
      // Try reading buffer as the final content
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          if (parsed.output) fullResponse = typeof parsed.output === 'string' ? parsed.output : JSON.stringify(parsed.output);
          else if (parsed.content) fullResponse = parsed.content;
          else fullResponse = buffer.trim();
        } catch {
          fullResponse = buffer.trim();
        }
        chunkCount = 1;
      }
    }

    recordTest('6.3', 'Received AI response content', fullResponse.length > 20,
      `${fullResponse.length} chars, ${chunkCount} chunks`);

    // Check if response mentions candidates or relevant info
    const lc = fullResponse.toLowerCase();
    const mentionsCandidate = lc.includes('ryan') || lc.includes('alex') || lc.includes('candidate') || lc.includes('full-stack') || lc.includes('developer');
    recordTest('6.4', 'AI response is contextually relevant', mentionsCandidate,
      fullResponse.substring(0, 150) + '...');

    console.log(`\n  ── Chat Response Preview ──`);
    console.log(`  ${fullResponse.substring(0, 500)}${fullResponse.length > 500 ? '...' : ''}`);

  } catch (err) {
    if (err.name === 'AbortError') {
      recordTest('6.1', 'Chat webhook responds', false, 'Timed out after 60s');
    } else {
      recordTest('6.1', 'Chat webhook responds', false, err.message);
    }
  }

  // Test 6.5 — Follow-up question (same session = context)
  try {
    console.log('\n  🤖 Follow-up: "What are their key strengths?"');
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 60000);

    const resp2 = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        chatInput: 'What are their key strengths?',
        sessionId,
      }),
      signal: controller2.signal,
    });
    clearTimeout(timeout2);

    let followUp = '';
    if (resp2.ok && resp2.body) {
      const reader2 = resp2.body.getReader();
      const dec2 = new TextDecoder();
      let buf2 = '';
      while (true) {
        const { done, value } = await reader2.read();
        if (done) break;
        buf2 += dec2.decode(value, { stream: true });
        const lines = buf2.split('\n');
        buf2 = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t) continue;
          try {
            const p = JSON.parse(t);
            if (p.type === 'item' && p.content) followUp += p.content;
          } catch { followUp += t; }
        }
      }
      if (!followUp && buf2.trim()) {
        try {
          const p = JSON.parse(buf2.trim());
          followUp = p.output || p.content || buf2.trim();
        } catch { followUp = buf2.trim(); }
      }
    }

    recordTest('6.5', 'Follow-up response with session context', followUp.length > 20,
      `${followUp.length} chars`);

    console.log(`\n  ── Follow-up Preview ──`);
    console.log(`  ${followUp.substring(0, 400)}${followUp.length > 400 ? '...' : ''}`);

  } catch (err) {
    recordTest('6.5', 'Follow-up response with session context', false, err.message);
  }
}

// ── Step 7: Final summary with pass/fail ────────
async function printSummary() {
  console.log('\n━━━ Step 7 ━━━ Final Summary');

  const [jobs, cands, apps, acts] = await Promise.all([
    api('GET', '/job-orders'),
    api('GET', '/candidates?include_processing=true'),
    api('GET', '/applications'),
    api('GET', '/activity-log?limit=50'),
  ]);

  console.log(`\n  ╔══════════════════════════════╗`);
  console.log(`  ║   Job Orders:    ${String(jobs.length).padStart(3)}        ║`);
  console.log(`  ║   Candidates:    ${String(cands.length).padStart(3)}        ║`);
  console.log(`  ║   Applications:  ${String(apps.length).padStart(3)}        ║`);
  console.log(`  ║   Activity Log:  ${String(acts.length).padStart(3)}        ║`);
  console.log(`  ╚══════════════════════════════╝\n`);

  console.log('  Job Orders:');
  for (const j of jobs) console.log(`    ${j.jo_number} | ${j.title} | ${j.department_name} | ${j.status}`);

  console.log('\n  Candidates:');
  for (const c of cands) {
    const st = c.processing_status || 'completed';
    console.log(`    ${(c.full_name || '(unnamed)').padEnd(30)} | ${(c.applicant_type || '?').padEnd(8)} | ${st.padEnd(10)} | ${c.email || 'no email'}`);
  }

  if (apps.length > 0) {
    console.log('\n  Applications:');
    for (const a of apps) console.log(`    candidate ${a.candidate_id?.substring(0, 8)}... → JO ${a.job_order_id?.substring(0, 8)}... | ${a.pipeline_status} | score: ${a.match_score || 'N/A'}`);
  }

  // ── Test Results Summary ──
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log('\n\n  ╔══════════════════════════════════════════════════╗');
  console.log(`  ║   TEST RESULTS: ${passed} PASSED / ${failed} FAILED / ${total} TOTAL`);
  console.log('  ╠══════════════════════════════════════════════════╣');

  // Group by step
  const steps = {};
  for (const r of results) {
    const step = r.id.split('.')[0];
    if (!steps[step]) steps[step] = [];
    steps[step].push(r);
  }

  const stepNames = {
    '0': 'Health Check',
    '1': 'Clear Data',
    '2': 'Create JOs (Workflow 1)',
    '3': 'Upload CVs (Workflow 3)',
    '4': 'n8n Processing',
    '5': 'Deep Verification',
    '6': 'Chatbot (Workflow 4)',
  };

  for (const [step, tests] of Object.entries(steps)) {
    const sp = tests.filter(t => t.passed).length;
    const sf = tests.filter(t => !t.passed).length;
    const icon = sf === 0 ? '✅' : '❌';
    console.log(`  ║  ${icon} Step ${step}: ${stepNames[step] || 'Unknown'} — ${sp}/${tests.length} passed`);
  }

  console.log('  ╚══════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\n  ── Failed Tests ──');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`    ❌ [${r.id}] ${r.name}: ${r.detail}`);
    }
  }

  return { passed, failed, total, results };
}

// ── Main ─────────────────────────────────────────
async function main() {
  const fromStep = parseInt(process.argv.find(a => a.startsWith('--from='))?.split('=')[1] || '0');

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Exist AI Recruiter — Full E2E Integration Test      ║');
  console.log('║  Workflow 1: Resource Embeddings                      ║');
  console.log('║  Workflow 3: CV Upload to Vector DB                   ║');
  console.log('║  Workflow 4: Chatbot (RAG)                            ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  API:  ${API_URL}`);
  console.log(`  Chat: ${CHAT_WEBHOOK_URL}`);
  console.log(`  PDF1: ${PDF_RYAN}`);
  console.log(`  PDF2: ${PDF_ALEX}`);
  if (fromStep > 0) console.log(`  ⏩ Starting from step ${fromStep}`);
  console.log('');

  await healthCheck();

  if (fromStep <= 1) await clearAllData();
  else console.log('\n  ⏩ Skipping step 1 (clear data)');

  let jobOrders;
  if (fromStep <= 2) {
    jobOrders = await createJobOrders();
    console.log('\n  ⏳ Waiting 5s for JO webhooks (Workflow 1) to settle...');
    await sleep(5000);
  } else {
    console.log('\n  ⏩ Skipping step 2 (create JOs) — fetching existing...');
    jobOrders = await api('GET', '/job-orders');
    console.log(`  ✅ Found ${jobOrders.length} existing JOs`);
  }

  if (fromStep <= 3) await uploadCandidates(jobOrders);
  else console.log('\n  ⏩ Skipping step 3 (upload CVs)');

  if (fromStep <= 4) await pollForCompletion(180);
  else console.log('\n  ⏩ Skipping step 4 (poll)');

  if (fromStep <= 5) await deepVerification();
  else console.log('\n  ⏩ Skipping step 5 (verification)');

  if (fromStep <= 6) await testChatbot();
  else console.log('\n  ⏩ Skipping step 6 (chatbot)');

  const { passed, failed } = await printSummary();

  console.log(`\n${failed === 0 ? '✅' : '⚠️'} Done — ${passed}/${passed + failed} tests passed.`);
  console.log('Open http://localhost:8080 to see the data.\n');
}

main().catch(err => { console.error('❌ Fatal:', err); process.exit(1); });

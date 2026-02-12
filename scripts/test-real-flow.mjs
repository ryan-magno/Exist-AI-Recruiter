#!/usr/bin/env node
/**
 * Real-world test script for Exist AI Recruiter
 *
 * Clears all data → Creates 5 JOs (triggers webhook) → Uploads 1 PDF 5x with variations
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
const PDF_PATH = path.resolve(__dirname, '..', 'mockData', 'Ryan Gabriel Magno - Resume.pdf');

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
    console.log(`✅ Server healthy — DB: ${h.db}`);
  } catch (err) {
    console.log(`❌ Server not reachable at ${API_URL}. Is it running?`);
    console.log(`   ${err.message}`);
    process.exit(1);
  }
}

// ── Step 1: Clear all data ───────────────────────
async function clearAllData() {
  console.log('\n━━━ Step 1 ━━━ Clear ALL seeded data');

  const tables = [
    'activity_log', 'candidate_timeline', 'offers',
    'tech_interviews', 'hr_interviews', 'candidate_job_applications',
    'application_history', 'candidate_work_experience',
    'candidate_certifications', 'candidate_education',
    'cv_uploaders', 'candidates', 'job_orders',
  ];

  for (const t of tables) {
    try {
      psql(`DELETE FROM ${t};`);
      console.log(`  ✅ Cleared ${t}`);
    } catch (e) {
      console.log(`  ⚠️  ${t}: ${e.message.split('\n')[0]}`);
    }
  }

  const c = await api('GET', '/candidates?include_processing=true');
  const j = await api('GET', '/job-orders');
  console.log(`  ✅ Verified — Candidates: ${c.length}, Job Orders: ${j.length}`);
}

// ── Step 2: Create 5 Job Orders ──────────────────
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
  console.log('\n━━━ Step 2 ━━━ Create 5 Job Orders (triggers JO webhook)');
  const created = [];

  for (let i = 0; i < JOB_ORDERS.length; i++) {
    const jo = JOB_ORDERS[i];
    console.log(`  📋 Creating ${jo.jo_number} — ${jo.title}...`);
    try {
      const result = await api('POST', '/job-orders', jo);
      console.log(`  ✅ ${result.jo_number} created (${result.id})`);
      created.push(result);
      await sleep(500);
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
    }
  }

  console.log(`  ✅ Total JOs in DB: ${(await api('GET', '/job-orders')).length}`);
  return created;
}

// ── Step 3: Upload same PDF 5x with variations ──
async function uploadCandidates(jobOrders) {
  console.log('\n━━━ Step 3 ━━━ Upload 5 CVs via /webhook-proxy (triggers n8n CV processing)');

  if (!fs.existsSync(PDF_PATH)) {
    console.log(`  ❌ PDF not found at: ${PDF_PATH}`);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(PDF_PATH);
  const pdfName = path.basename(PDF_PATH);
  console.log(`  📄 Using: ${pdfName} (${(pdfBuffer.length / 1024).toFixed(1)} KB)\n`);

  const jo = (idx) => jobOrders[idx]
    ? { job_order_id: jobOrders[idx].id, job_order_title: jobOrders[idx].title, jo_number: jobOrders[idx].jo_number }
    : 'ai-decide';

  const scenarios = [
    { label: 'External → Senior Full-Stack Dev (JO-001)', uploader: 'HR Admin',        type: 'external', applying: jo(0) },
    { label: 'External → Product Manager (JO-002)',       uploader: 'Recruitment Team', type: 'external', applying: jo(1) },
    { label: 'Internal (role-change) → UX/UI (JO-003)',   uploader: 'HR Admin',        type: 'internal', applying: jo(2),
      from_date: '2023-06-01', department: 'Engineering', upload_reason: 'role-change' },
    { label: 'External → Let AI decide',                  uploader: 'Sarah Lim',       type: 'external', applying: 'ai-decide' },
    { label: 'Internal (benched) → Marketing (JO-005)',    uploader: 'HR Admin',        type: 'internal', applying: jo(4),
      from_date: '2024-01-15', department: 'Marketing', upload_reason: 'benched' },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    console.log(`  📤 Upload ${i + 1}/5: ${s.label}`);

    const formData = new FormData();
    formData.append('uploader_name', s.uploader);
    formData.append('upload_timestamp', new Date().toISOString());
    formData.append('total_files', '1');

    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('files', blob, pdfName);

    const meta = [{
      index: 0,
      filename: pdfName,
      size_bytes: pdfBuffer.length,
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
      console.log(`  ✅ ${r.status} | batch: ${r.batch_id} | candidates: ${r.candidate_ids?.join(', ')}`);
    } catch (err) {
      console.log(`  ❌ ${err.message}`);
    }

    if (i < scenarios.length - 1) {
      console.log('     ⏳ Waiting 3s...');
      await sleep(3000);
    }
  }
}

// ── Step 4: Poll for processing completion ───────
async function pollForCompletion(maxWaitSec = 120) {
  console.log(`\n━━━ Step 4 ━━━ Polling for completion (max ${maxWaitSec}s)`);

  const start = Date.now();
  let lastMsg = '';

  while ((Date.now() - start) / 1000 < maxWaitSec) {
    const all = await api('GET', '/candidates?include_processing=true');
    const proc = all.filter(c => c.processing_status === 'processing').length;
    const done = all.filter(c => c.processing_status === 'completed' || !c.processing_status).length;
    const errs = all.filter(c => c.processing_status === 'error').length;
    const msg = `Processing: ${proc} | Completed: ${done} | Errors: ${errs}`;

    if (msg !== lastMsg) { console.log(`  ℹ️  ${msg}`); lastMsg = msg; }
    if (proc === 0) { console.log(`  ✅ All done!`); return; }

    process.stdout.write('.');
    await sleep(5000);
  }
  console.log(`\n  ⚠️  Timed out — some candidates may still be processing.`);
}

// ── Step 5: Summary ──────────────────────────────
async function printSummary() {
  console.log('\n━━━ Step 5 ━━━ Final Summary');

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
}

// ── Main ─────────────────────────────────────────
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Exist AI Recruiter — Real-World Test Flow        ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log(`  API: ${API_URL}`);
  console.log(`  PDF: ${PDF_PATH}\n`);

  await healthCheck();
  await clearAllData();
  const jobOrders = await createJobOrders();

  console.log('\n  ⏳ Waiting 2s for JO webhooks to settle...');
  await sleep(2000);

  await uploadCandidates(jobOrders);
  await pollForCompletion(120);
  await printSummary();

  console.log('\n✅ Done! Open http://localhost:8080 to see the data.\n');
}

main().catch(err => { console.error('❌ Fatal:', err); process.exit(1); });

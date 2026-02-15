import { Router } from 'express';
import { query } from '../lib/db.js';
import { mutationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// =====================================================
// HR INTERVIEWS
// =====================================================
router.get('/hr-interviews', async (req, res) => {
  try {
    const { application_id, candidate_id } = req.query;
    if (application_id) return res.json((await query("SELECT * FROM hr_interviews WHERE application_id = $1", [application_id]))[0] || null);
    if (candidate_id) return res.json(await query("SELECT * FROM hr_interviews WHERE candidate_id = $1 ORDER BY created_at DESC", [candidate_id]));
    res.json(await query("SELECT * FROM hr_interviews ORDER BY created_at DESC"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/hr-interviews', mutationLimiter, async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO hr_interviews (application_id, candidate_id, interview_date, interviewer_name, interview_mode, availability, expected_salary, earliest_start_date, preferred_work_setup, notice_period, communication_rating, motivation_rating, cultural_fit_rating, professionalism_rating, strengths, concerns, verdict, verdict_rationale)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (application_id) DO UPDATE SET
        interview_date = EXCLUDED.interview_date, interviewer_name = EXCLUDED.interviewer_name, interview_mode = EXCLUDED.interview_mode,
        availability = EXCLUDED.availability, expected_salary = EXCLUDED.expected_salary, earliest_start_date = EXCLUDED.earliest_start_date, preferred_work_setup = EXCLUDED.preferred_work_setup,
        notice_period = EXCLUDED.notice_period, communication_rating = EXCLUDED.communication_rating, motivation_rating = EXCLUDED.motivation_rating,
        cultural_fit_rating = EXCLUDED.cultural_fit_rating, professionalism_rating = EXCLUDED.professionalism_rating,
        strengths = EXCLUDED.strengths, concerns = EXCLUDED.concerns, verdict = EXCLUDED.verdict, verdict_rationale = EXCLUDED.verdict_rationale,
        updated_at = now()
      RETURNING *
    `, [body.application_id, body.candidate_id, body.interview_date, body.interviewer_name, body.interview_mode, body.availability, body.expected_salary, body.earliest_start_date, body.preferred_work_setup, body.notice_period, body.communication_rating, body.motivation_rating, body.cultural_fit_rating, body.professionalism_rating, body.strengths, body.concerns, body.verdict, body.verdict_rationale]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// TECH INTERVIEWS
// =====================================================
router.get('/tech-interviews', async (req, res) => {
  try {
    const { application_id, candidate_id } = req.query;
    if (application_id) return res.json((await query("SELECT * FROM tech_interviews WHERE application_id = $1", [application_id]))[0] || null);
    if (candidate_id) return res.json(await query("SELECT * FROM tech_interviews WHERE candidate_id = $1 ORDER BY created_at DESC", [candidate_id]));
    res.json(await query("SELECT * FROM tech_interviews ORDER BY created_at DESC"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tech-interviews', mutationLimiter, async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO tech_interviews (application_id, candidate_id, interview_date, interviewer_name, interview_mode, technical_knowledge_rating, problem_solving_rating, code_quality_rating, system_design_rating, coding_challenge_score, coding_challenge_notes, technical_strengths, areas_for_improvement, verdict, verdict_rationale)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (application_id) DO UPDATE SET
        interview_date = EXCLUDED.interview_date, interviewer_name = EXCLUDED.interviewer_name, interview_mode = EXCLUDED.interview_mode,
        technical_knowledge_rating = EXCLUDED.technical_knowledge_rating, problem_solving_rating = EXCLUDED.problem_solving_rating,
        code_quality_rating = EXCLUDED.code_quality_rating, system_design_rating = EXCLUDED.system_design_rating,
        coding_challenge_score = EXCLUDED.coding_challenge_score, coding_challenge_notes = EXCLUDED.coding_challenge_notes,
        technical_strengths = EXCLUDED.technical_strengths, areas_for_improvement = EXCLUDED.areas_for_improvement,
        verdict = EXCLUDED.verdict, verdict_rationale = EXCLUDED.verdict_rationale, updated_at = now()
      RETURNING *
    `, [body.application_id, body.candidate_id, body.interview_date, body.interviewer_name, body.interview_mode, body.technical_knowledge_rating, body.problem_solving_rating, body.code_quality_rating, body.system_design_rating, body.coding_challenge_score, body.coding_challenge_notes, body.technical_strengths, body.areas_for_improvement, body.verdict, body.verdict_rationale]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// OFFERS
// =====================================================
router.get('/offers', async (req, res) => {
  try {
    const { application_id, candidate_id } = req.query;
    if (application_id) return res.json((await query("SELECT * FROM offers WHERE application_id = $1", [application_id]))[0] || null);
    if (candidate_id) return res.json(await query("SELECT * FROM offers WHERE candidate_id = $1 ORDER BY created_at DESC", [candidate_id]));
    res.json(await query("SELECT * FROM offers ORDER BY created_at DESC"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/offers', mutationLimiter, async (req, res) => {
  try {
    const body = req.body;
    const result = await query(`
      INSERT INTO offers (application_id, candidate_id, offer_date, offer_amount, position, start_date, status, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (application_id) DO UPDATE SET
        offer_date = EXCLUDED.offer_date, offer_amount = EXCLUDED.offer_amount,
        position = EXCLUDED.position, start_date = EXCLUDED.start_date, status = EXCLUDED.status,
        remarks = EXCLUDED.remarks, updated_at = now()
      RETURNING *
    `, [body.application_id, body.candidate_id, body.offer_date || null, body.offer_amount || null, body.position || null, body.start_date || null, body.status || 'pending', body.remarks || null]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

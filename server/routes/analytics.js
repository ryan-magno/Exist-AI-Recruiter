import { Router } from 'express';
import { query } from '../lib/db.js';

const router = Router();

router.get('/analytics', async (req, res) => {
  try {
    const { department, level, start_date, end_date } = req.query;

    // Build dynamic WHERE fragments for filters
    const joFilters = [];
    const appFilters = [];
    const params = [];
    let paramIdx = 1;

    if (department) {
      joFilters.push(`jo.department_name = $${paramIdx}`);
      appFilters.push(`jo.department_name = $${paramIdx}`);
      params.push(department);
      paramIdx++;
    }
    if (level) {
      joFilters.push(`jo.level = $${paramIdx}`);
      appFilters.push(`jo.level = $${paramIdx}`);
      params.push(level);
      paramIdx++;
    }
    if (start_date) {
      appFilters.push(`a.applied_date >= $${paramIdx}::timestamptz`);
      joFilters.push(`jo.created_at >= $${paramIdx}::timestamptz`);
      params.push(start_date);
      paramIdx++;
    }
    if (end_date) {
      appFilters.push(`a.applied_date <= $${paramIdx}::timestamptz`);
      joFilters.push(`jo.created_at <= $${paramIdx}::timestamptz`);
      params.push(end_date);
      paramIdx++;
    }

    const joWhere = joFilters.length > 0 ? ' AND ' + joFilters.join(' AND ') : '';
    const appJoWhere = appFilters.length > 0 ? ' AND ' + appFilters.join(' AND ') : '';
    // For queries joining application a + jo
    const appJoin = `candidate_job_applications a JOIN job_orders jo ON a.job_order_id = jo.id`;

    // Run all queries in parallel
    const [
      kpiRows,
      pipelineRows,
      deptRows,
      levelRows,
      sourceRows,
      funnelRows,
      agingRows,
      timeToFillRows,
      avgStageRows,
      deptTurnaroundRows,
      monthlyHiresRows,
      monthlyAppsRows,
      interviewVolumeRows,
      hrVerdictRows,
      techVerdictRows,
      offerRows,
      fillRateRows,
      scoreDistRows,
      workSetupRows,
    ] = await Promise.all([
      // 1. KPIs
      query(`
        SELECT
          COUNT(DISTINCT a.id) FILTER (WHERE a.pipeline_status = 'hired') AS total_hired,
          COUNT(DISTINCT a.id) FILTER (WHERE a.pipeline_status = 'hired'
            AND a.status_changed_date >= date_trunc('month', NOW())) AS hired_this_month,
          COUNT(DISTINCT jo.id) FILTER (WHERE jo.status IN ('open','pooling')) AS active_jobs,
          COUNT(DISTINCT a.id) AS total_applications,
          COUNT(DISTINCT a.candidate_id) AS unique_candidates,
          COUNT(DISTINCT a.id) FILTER (WHERE a.pipeline_status NOT IN ('rejected','hired')) AS active_pipeline,
          ROUND(AVG(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)
            FILTER (WHERE a.pipeline_status = 'hired' AND a.status_changed_date IS NOT NULL AND a.applied_date IS NOT NULL))
            AS avg_time_to_hire,
          ROUND(AVG(a.match_score) FILTER (WHERE a.match_score IS NOT NULL)) AS avg_match_score
        FROM ${appJoin}
        WHERE 1=1 ${appJoWhere}
      `, params),

      // 2. Pipeline distribution
      query(`
        SELECT a.pipeline_status AS status, COUNT(*) AS count
        FROM ${appJoin}
        WHERE 1=1 ${appJoWhere}
        GROUP BY a.pipeline_status ORDER BY count DESC
      `, params),

      // 3. Applications by department
      query(`
        SELECT jo.department_name AS department, COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'hired') AS hired,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'rejected') AS rejected,
          COUNT(*) FILTER (WHERE a.pipeline_status NOT IN ('hired','rejected')) AS active
        FROM ${appJoin}
        WHERE jo.department_name IS NOT NULL ${appJoWhere}
        GROUP BY jo.department_name ORDER BY total DESC
      `, params),

      // 4. Applications by level
      query(`
        SELECT jo.level, COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'hired') AS hired,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'rejected') AS rejected
        FROM ${appJoin}
        WHERE 1=1 ${appJoWhere}
        GROUP BY jo.level ORDER BY jo.level
      `, params),

      // 5. Internal vs External
      query(`
        SELECT c.applicant_type AS source, COUNT(*) AS count,
          ROUND(AVG(c.qualification_score) FILTER (WHERE c.qualification_score IS NOT NULL)) AS avg_score,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'hired') AS hired
        FROM ${appJoin}
          JOIN candidates c ON a.candidate_id = c.id
        WHERE 1=1 ${appJoWhere}
        GROUP BY c.applicant_type
      `, params),

      // 6. Funnel (conversion %, each stage)
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.pipeline_status IN ('hr_interview','tech_interview','offer','hired')) AS reached_hr,
          COUNT(*) FILTER (WHERE a.pipeline_status IN ('tech_interview','offer','hired')) AS reached_tech,
          COUNT(*) FILTER (WHERE a.pipeline_status IN ('offer','hired')) AS reached_offer,
          COUNT(*) FILTER (WHERE a.pipeline_status = 'hired') AS reached_hired
        FROM ${appJoin}
        WHERE 1=1 ${appJoWhere}
      `, params),

      // 7. Pipeline aging (current candidates: how long in current stage)
      query(`
        SELECT a.pipeline_status AS status,
          ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - a.status_changed_date)) / 86400)) AS avg_days,
          MAX(EXTRACT(EPOCH FROM (NOW() - a.status_changed_date)) / 86400)::int AS max_days,
          MIN(EXTRACT(EPOCH FROM (NOW() - a.status_changed_date)) / 86400)::int AS min_days,
          COUNT(*) AS count
        FROM ${appJoin}
        WHERE a.pipeline_status NOT IN ('hired','rejected')
          AND a.status_changed_date IS NOT NULL ${appJoWhere}
        GROUP BY a.pipeline_status
      `, params),

      // 8. Time-to-fill per JO (hired candidates)
      query(`
        SELECT jo.id AS jo_id, jo.title AS jo_title, jo.department_name AS department,
          jo.quantity, jo.hired_count,
          ROUND(AVG(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)) AS avg_days_to_hire,
          MIN(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)::int AS min_days,
          MAX(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)::int AS max_days,
          COUNT(*) AS hires
        FROM ${appJoin}
        WHERE a.pipeline_status = 'hired'
          AND a.status_changed_date IS NOT NULL AND a.applied_date IS NOT NULL ${appJoWhere}
        GROUP BY jo.id, jo.title, jo.department_name, jo.quantity, jo.hired_count
        ORDER BY avg_days_to_hire DESC
      `, params),

      // 9. Avg time per stage (from timeline transitions)
      query(`
        SELECT ct.to_status AS stage,
          ROUND(AVG(ct.duration_days) FILTER (WHERE ct.duration_days IS NOT NULL AND ct.duration_days > 0)) AS avg_duration,
          MAX(ct.duration_days) FILTER (WHERE ct.duration_days IS NOT NULL) AS max_duration,
          MIN(ct.duration_days) FILTER (WHERE ct.duration_days IS NOT NULL AND ct.duration_days > 0) AS min_duration,
          COUNT(*) AS transitions
        FROM candidate_timeline ct
          JOIN ${appJoin} ON ct.application_id = a.id
        WHERE 1=1 ${appJoWhere}
        GROUP BY ct.to_status
      `, params),

      // 10. Department turnaround (avg time to hire per dept)
      query(`
        SELECT jo.department_name AS department,
          ROUND(AVG(EXTRACT(EPOCH FROM (a.status_changed_date - a.applied_date)) / 86400)) AS avg_days,
          COUNT(*) AS hires
        FROM ${appJoin}
        WHERE a.pipeline_status = 'hired'
          AND a.status_changed_date IS NOT NULL AND a.applied_date IS NOT NULL
          AND jo.department_name IS NOT NULL ${appJoWhere}
        GROUP BY jo.department_name ORDER BY avg_days ASC
      `, params),

      // 11. Monthly hires trend (last 12 months)
      query(`
        SELECT to_char(date_trunc('month', a.status_changed_date), 'YYYY-MM') AS month,
          COUNT(*) AS hires
        FROM ${appJoin}
        WHERE a.pipeline_status = 'hired'
          AND a.status_changed_date >= NOW() - INTERVAL '12 months' ${appJoWhere}
        GROUP BY month ORDER BY month
      `, params),

      // 12. Monthly applications trend (last 12 months)
      query(`
        SELECT to_char(date_trunc('month', a.applied_date), 'YYYY-MM') AS month,
          COUNT(*) AS applications
        FROM ${appJoin}
        WHERE a.applied_date >= NOW() - INTERVAL '12 months' ${appJoWhere}
        GROUP BY month ORDER BY month
      `, params),

      // 13. Interview volume by month
      query(`
        SELECT to_char(date_trunc('month', hi.interview_date), 'YYYY-MM') AS month,
          'hr' AS type, COUNT(*) AS count
        FROM hr_interviews hi
          JOIN ${appJoin} ON hi.application_id = a.id
        WHERE hi.interview_date IS NOT NULL ${appJoWhere}
        GROUP BY month
        UNION ALL
        SELECT to_char(date_trunc('month', ti.interview_date), 'YYYY-MM') AS month,
          'tech' AS type, COUNT(*) AS count
        FROM tech_interviews ti
          JOIN ${appJoin} ON ti.application_id = a.id
        WHERE ti.interview_date IS NOT NULL ${appJoWhere}
        GROUP BY month
        ORDER BY month
      `, params),

      // 14. HR interview verdict distribution
      query(`
        SELECT hi.verdict, COUNT(*) AS count
        FROM hr_interviews hi
          JOIN ${appJoin} ON hi.application_id = a.id
        WHERE hi.verdict IS NOT NULL ${appJoWhere}
        GROUP BY hi.verdict
      `, params),

      // 15. Tech interview verdict distribution
      query(`
        SELECT ti.verdict, COUNT(*) AS count
        FROM tech_interviews ti
          JOIN ${appJoin} ON ti.application_id = a.id
        WHERE ti.verdict IS NOT NULL ${appJoWhere}
        GROUP BY ti.verdict
      `, params),

      // 16. Offer stats
      query(`
        SELECT o.status, COUNT(*) AS count
        FROM offers o
          JOIN ${appJoin} ON o.application_id = a.id
        WHERE 1=1 ${appJoWhere}
        GROUP BY o.status
      `, params),

      // 17. Fill rate per JO
      query(`
        SELECT jo.id, jo.title, jo.department_name AS department, jo.level,
          jo.quantity, jo.hired_count, jo.status AS jo_status,
          ROUND(jo.hired_count::numeric / NULLIF(jo.quantity, 0) * 100) AS fill_pct,
          EXTRACT(EPOCH FROM (NOW() - jo.created_at)) / 86400 AS days_open
        FROM job_orders jo
        WHERE 1=1 ${joWhere}
        ORDER BY fill_pct DESC NULLS LAST
      `, params),

      // 18. Score distribution (buckets)
      query(`
        SELECT
          CASE
            WHEN c.qualification_score >= 90 THEN '90-100'
            WHEN c.qualification_score >= 80 THEN '80-89'
            WHEN c.qualification_score >= 70 THEN '70-79'
            WHEN c.qualification_score >= 60 THEN '60-69'
            WHEN c.qualification_score >= 50 THEN '50-59'
            ELSE 'Below 50'
          END AS bucket,
          COUNT(*) AS count
        FROM ${appJoin}
          JOIN candidates c ON a.candidate_id = c.id
        WHERE c.qualification_score IS NOT NULL ${appJoWhere}
        GROUP BY bucket ORDER BY bucket
      `, params),

      // 19. Work setup distribution
      query(`
        SELECT c.preferred_work_setup AS setup, COUNT(*) AS count
        FROM ${appJoin}
          JOIN candidates c ON a.candidate_id = c.id
        WHERE c.preferred_work_setup IS NOT NULL ${appJoWhere}
        GROUP BY c.preferred_work_setup
      `, params),
    ]);

    res.json({
      kpis: kpiRows[0] || {},
      pipeline: pipelineRows,
      byDepartment: deptRows,
      byLevel: levelRows,
      bySource: sourceRows,
      funnel: funnelRows[0] || {},
      aging: agingRows,
      timeToFill: timeToFillRows,
      avgStageDuration: avgStageRows,
      deptTurnaround: deptTurnaroundRows,
      monthlyHires: monthlyHiresRows,
      monthlyApplications: monthlyAppsRows,
      interviewVolume: interviewVolumeRows,
      hrVerdicts: hrVerdictRows,
      techVerdicts: techVerdictRows,
      offers: offerRows,
      fillRate: fillRateRows,
      scoreDistribution: scoreDistRows,
      workSetup: workSetupRows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

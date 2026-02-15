import { z } from 'zod';

// =====================================================
// Zod Validation Schemas
// =====================================================

export const createJobOrderSchema = z.object({
  jo_number: z.string().min(1, 'JO number is required').optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  department_name: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  level: z.enum(['L1', 'L2', 'L3', 'L4', 'L5']).optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),
  hired_count: z.number().int().min(0).optional().nullable(),
  employment_type: z.enum(['full_time', 'part_time', 'contract']).optional().nullable(),
  requestor_name: z.string().optional().nullable(),
  required_date: z.string().optional().nullable(),
  status: z.enum(['open', 'closed', 'on_hold', 'pooling', 'archived']).optional().nullable(),
  created_by: z.string().optional().nullable(),
}).passthrough(); // Allow extra fields that validateColumns will filter

export const createCandidateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format').optional().nullable(),
  phone: z.string().optional().nullable(),
  applicant_type: z.enum(['internal', 'external']).optional().nullable(),
  skills: z.any().optional().nullable(),
  years_of_experience_text: z.string().optional().nullable(),
  preferred_work_setup: z.string().optional().nullable(),
  expected_salary: z.string().optional().nullable(),
  uploaded_by: z.string().optional().nullable(),
  google_drive_file_id: z.string().optional().nullable(),
  google_drive_file_url: z.string().optional().nullable(),
}).passthrough();

export const createApplicationSchema = z.object({
  candidate_id: z.string().uuid('Invalid candidate ID'),
  job_order_id: z.string().uuid('Invalid job order ID'),
  pipeline_status: z.enum(['hr_interview', 'tech_interview', 'offer', 'hired', 'rejected', 'pooled']).optional().nullable(),
  match_score: z.any().optional().nullable(),
  remarks: z.string().optional().nullable(),
}).passthrough();

export const createHRInterviewSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  candidate_id: z.string().uuid('Invalid candidate ID'),
  interview_date: z.string().optional().nullable(),
  interviewer_name: z.string().optional().nullable(),
  interview_mode: z.string().optional().nullable(),
  verdict: z.enum(['pass', 'fail', 'conditional', 'pending']).optional().nullable(),
  verdict_rationale: z.string().optional().nullable(),
}).passthrough(); // Allow additional HR interview fields

export const webhookProxyMetadataSchema = z.array(z.object({
  job_order_id: z.string().uuid().optional().nullable(),
  applicant_type: z.enum(['internal', 'external']).optional().nullable(),
  original_filename: z.string().optional().nullable(),
}).passthrough());

// =====================================================
// Validation Middleware Factory
// =====================================================

/**
 * Creates middleware that validates req.body against a Zod schema.
 * On success, sets req.validated = parsed data and calls next().
 * On failure, returns 422 with error details.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        error: 'Validation failed',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    req.validated = result.data;
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(422).json({
        error: 'Invalid query parameters',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}

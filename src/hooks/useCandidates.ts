import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export interface CandidateEducation { id: string; candidate_id: string; degree: string; institution: string; year: string | null; created_at: string; }
export interface CandidateCertification { id: string; candidate_id: string; name: string; issuer: string | null; year: string | null; created_at: string; }
export interface CandidateWorkExperience { id: string; candidate_id: string; company_name: string; job_title: string; duration: string | null; description: string | null; key_projects: any | null; created_at: string; }
export type ProcessingStatus = 'processing' | 'completed' | 'failed';

export interface Candidate {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  applicant_type: 'internal' | 'external';
  skills: string[] | null;
  positions_fit_for: string[] | null;
  years_of_experience: number | null;
  educational_background: string | null;
  cv_url: string | null;
  cv_filename: string | null;
  availability: string | null;
  preferred_work_setup: string | null;
  preferred_employment_type: string | null;
  expected_salary: string | null;
  earliest_start_date: string | null;
  uploaded_by: string | null;
  uploaded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  linkedin: string | null;
  current_position: string | null;
  current_company: string | null;
  years_of_experience_text: string | null;
  overall_summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  qualification_score: number | null;
  internal_upload_reason: string | null;
  internal_from_date: string | null;
  internal_to_date: string | null;
  google_drive_file_id: string | null;
  google_drive_file_url: string | null;
  batch_id: string | null;
  batch_created_at: string | null;
  processing_status: ProcessingStatus | null;
  processing_batch_id: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_index: number | null;
}

export interface CandidateFull extends Candidate {
  education: CandidateEducation[];
  certifications: CandidateCertification[];
  work_experiences: CandidateWorkExperience[];
}

export interface CandidateInsert { full_name: string; email?: string | null; phone?: string | null; applicant_type?: 'internal' | 'external'; skills?: string[] | null; years_of_experience?: number | null; educational_background?: string | null; availability?: string | null; preferred_work_setup?: string | null; expected_salary?: string | null; cv_url?: string | null; cv_filename?: string | null; uploaded_by?: string | null; }
export interface CandidateUpdate { full_name?: string; email?: string | null; phone?: string | null; applicant_type?: 'internal' | 'external'; skills?: string[] | null; years_of_experience?: number | null; educational_background?: string | null; availability?: string | null; preferred_work_setup?: string | null; expected_salary?: string | null; }

export interface WebhookCandidateData { webhook_output: any; uploader_name: string; applicant_type: 'internal' | 'external'; job_order_id?: string | null; internal_metadata?: { from_date?: string; to_date?: string; department?: string; upload_reason?: string; } | null; }

export function useCandidates() { return useQuery({ queryKey: ['candidates'], queryFn: () => azureDb.candidates.list() as Promise<Candidate[]> }); }
export function useCandidate(id: string | null) { return useQuery({ queryKey: ['candidates', id], queryFn: async () => { if (!id) return null; return azureDb.candidates.get(id) as Promise<Candidate | null>; }, enabled: !!id }); }
export function useCandidateFull(id: string | null) { return useQuery({ queryKey: ['candidates', id, 'full'], queryFn: async () => { if (!id) return null; return azureDb.candidates.getFull(id) as Promise<CandidateFull | null>; }, enabled: !!id }); }
export function useCandidateWithDetails(id: string | null) { return useQuery({ queryKey: ['candidates', id, 'details'], queryFn: async () => { if (!id) return null; return azureDb.candidates.getFull(id) as Promise<CandidateFull | null>; }, enabled: !!id }); }
export function useCreateCandidate() { const qc = useQueryClient(); return useMutation({ mutationFn: (c: CandidateInsert) => azureDb.candidates.create(c), onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); } }); }
export function useCreateCandidateFromWebhook() { const qc = useQueryClient(); return useMutation({ mutationFn: (data: WebhookCandidateData) => azureDb.candidates.createFromWebhook(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); qc.invalidateQueries({ queryKey: ['applications'] }); } }); }
export function useUpdateCandidate() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: CandidateUpdate }) => azureDb.candidates.update(id, updates), onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['candidates'] }); qc.invalidateQueries({ queryKey: ['candidates', v.id] }); } }); }
export function useDeleteCandidate() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => azureDb.candidates.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); } }); }

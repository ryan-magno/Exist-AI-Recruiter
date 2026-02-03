import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

// New interfaces for webhook-extracted data
export interface CandidateEducation {
  id: string;
  candidate_id: string;
  degree: string;
  institution: string;
  year: string | null;
  created_at: string;
}

export interface CandidateCertification {
  id: string;
  candidate_id: string;
  name: string;
  issuer: string | null;
  year: string | null;
  created_at: string;
}

export interface CandidateWorkExperience {
  id: string;
  candidate_id: string;
  company_name: string;
  job_title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  duration: string | null;
  key_projects: string[] | null;
  created_at: string;
}

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
  expected_salary: string | null;
  earliest_start_date: string | null;
  uploaded_by: string | null;
  uploaded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  // New webhook-extracted fields
  linkedin: string | null;
  current_occupation: string | null;
  years_of_experience_text: string | null;
  target_role: string | null;
  target_role_source: string | null;
  overall_summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  // Processing status fields
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

export interface CandidateInsert {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  applicant_type?: 'internal' | 'external';
  skills?: string[] | null;
  years_of_experience?: number | null;
  educational_background?: string | null;
  availability?: string | null;
  preferred_work_setup?: string | null;
  expected_salary?: string | null;
  cv_url?: string | null;
  cv_filename?: string | null;
  uploaded_by?: string | null;
}

export interface CandidateUpdate {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  applicant_type?: 'internal' | 'external';
  skills?: string[] | null;
  years_of_experience?: number | null;
  educational_background?: string | null;
  availability?: string | null;
  preferred_work_setup?: string | null;
  expected_salary?: string | null;
}

export interface WebhookCandidateData {
  webhook_output: any;
  uploader_name: string;
  applicant_type: 'internal' | 'external';
  job_order_id?: string | null;
  internal_metadata?: {
    from_date?: string;
    to_date?: string;
    department?: string;
    upload_reason?: string;
  } | null;
}

export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: () => azureDb.candidates.list() as Promise<Candidate[]>
  });
}

export function useCandidate(id: string | null) {
  return useQuery({
    queryKey: ['candidates', id],
    queryFn: async () => {
      if (!id) return null;
      return azureDb.candidates.get(id) as Promise<Candidate | null>;
    },
    enabled: !!id
  });
}

export function useCandidateFull(id: string | null) {
  return useQuery({
    queryKey: ['candidates', id, 'full'],
    queryFn: async () => {
      if (!id) return null;
      return azureDb.candidates.getFull(id) as Promise<CandidateFull | null>;
    },
    enabled: !!id
  });
}

export function useCandidateWithDetails(id: string | null) {
  return useQuery({
    queryKey: ['candidates', id, 'details'],
    queryFn: async () => {
      if (!id) return null;
      return azureDb.candidates.getFull(id) as Promise<CandidateFull | null>;
    },
    enabled: !!id
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCandidate: CandidateInsert) => azureDb.candidates.create(newCandidate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    }
  });
}

export function useCreateCandidateFromWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WebhookCandidateData) => azureDb.candidates.createFromWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CandidateUpdate }) => 
      azureDb.candidates.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates', variables.id] });
    }
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => azureDb.candidates.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    }
  });
}

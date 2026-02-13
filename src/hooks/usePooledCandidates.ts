import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export interface PooledCandidate {
  id: string;
  candidate_id: string;
  original_application_id: string;
  original_job_order_id: string;
  pooled_from_status: string;
  pool_reason: string | null;
  pool_notes: string | null;
  pooled_by: string | null;
  pooled_at: string;
  disposition: string;
  disposition_changed_at: string | null;
  disposition_notes: string | null;
  new_application_id: string | null;
  new_job_order_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  full_name: string;
  email: string | null;
  phone: string | null;
  skills: string[] | null;
  years_of_experience_text: string | null;
  current_position: string | null;
  current_company: string | null;
  qualification_score: number | null;
  applicant_type: string | null;
  linkedin: string | null;
  expected_salary: string | null;
  earliest_start_date: string | null;
  overall_summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  original_jo_number: string;
  original_jo_title: string;
  original_department: string | null;
  match_score: number | null;
  current_app_status: string;
}

export function usePooledCandidates(params?: { disposition?: string; job_order_id?: string; search?: string }) {
  return useQuery({
    queryKey: ['pooled-candidates', params],
    queryFn: () => azureDb.pooledCandidates.list(params),
    staleTime: 30_000,
  });
}

export function usePoolCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: { pool_reason?: string; pool_notes?: string; pooled_by?: string } }) =>
      azureDb.pooledCandidates.pool(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pooled-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

export function useActivatePooled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pooledId, data }: { pooledId: string; data: { target_job_order_id: string; target_pipeline_status?: string } }) =>
      azureDb.pooledCandidates.activate(pooledId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pooled-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['pooled-job-orders'] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

export function useUpdatePooledDisposition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pooledId, data }: { pooledId: string; data: { disposition: string; disposition_notes?: string } }) =>
      azureDb.pooledCandidates.updateDisposition(pooledId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pooled-candidates'] });
    },
  });
}

export function useBulkPooledAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; disposition: string; disposition_notes?: string }) =>
      azureDb.pooledCandidates.bulkAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pooled-candidates'] });
    },
  });
}

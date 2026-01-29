import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

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

export function useCandidateWithDetails(id: string | null) {
  return useQuery({
    queryKey: ['candidates', id, 'details'],
    queryFn: async () => {
      if (!id) return null;
      const candidate = await azureDb.candidates.get(id);
      return {
        ...candidate,
        workExperiences: [] // Work experience would need separate endpoint
      };
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export type HRVerdict = 'proceed_to_tech' | 'hold' | 'reject';
export type TechVerdict = 'recommend_hire' | 'consider' | 'do_not_hire';

export interface HRInterview {
  id: string;
  application_id: string;
  candidate_id: string;
  interview_date: string | null;
  interviewer_name: string | null;
  interview_mode: string | null;
  availability: string | null;
  expected_salary: string | null;
  preferred_work_setup: string | null;
  notice_period: string | null;
  communication_rating: number | null;
  motivation_rating: number | null;
  cultural_fit_rating: number | null;
  professionalism_rating: number | null;
  strengths: string | null;
  concerns: string | null;
  verdict: HRVerdict | null;
  verdict_rationale: string | null;
  created_at: string;
  updated_at: string;
}

export interface HRInterviewInsert {
  application_id: string;
  candidate_id: string;
  interview_date?: string | null;
  interviewer_name?: string | null;
  interview_mode?: string | null;
  availability?: string | null;
  expected_salary?: string | null;
  preferred_work_setup?: string | null;
  notice_period?: string | null;
  communication_rating?: number | null;
  motivation_rating?: number | null;
  cultural_fit_rating?: number | null;
  professionalism_rating?: number | null;
  strengths?: string | null;
  concerns?: string | null;
  verdict?: HRVerdict | null;
  verdict_rationale?: string | null;
}

export interface TechInterview {
  id: string;
  application_id: string;
  candidate_id: string;
  interview_date: string | null;
  interviewer_name: string | null;
  interview_mode: string | null;
  technical_knowledge_rating: number | null;
  problem_solving_rating: number | null;
  code_quality_rating: number | null;
  system_design_rating: number | null;
  coding_challenge_score: number | null;
  coding_challenge_notes: string | null;
  technical_strengths: string | null;
  areas_for_improvement: string | null;
  verdict: TechVerdict | null;
  verdict_rationale: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechInterviewInsert {
  application_id: string;
  candidate_id: string;
  interview_date?: string | null;
  interviewer_name?: string | null;
  interview_mode?: string | null;
  technical_knowledge_rating?: number | null;
  problem_solving_rating?: number | null;
  code_quality_rating?: number | null;
  system_design_rating?: number | null;
  coding_challenge_score?: number | null;
  coding_challenge_notes?: string | null;
  technical_strengths?: string | null;
  areas_for_improvement?: string | null;
  verdict?: TechVerdict | null;
  verdict_rationale?: string | null;
}

// HR Interviews
export function useHRInterview(applicationId: string | null) {
  return useQuery({
    queryKey: ['hr-interviews', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      return azureDb.hrInterviews.get(applicationId) as Promise<HRInterview | null>;
    },
    enabled: !!applicationId
  });
}

export function useHRInterviewByCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['hr-interviews', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      return azureDb.hrInterviews.listByCandidate(candidateId) as Promise<HRInterview[]>;
    },
    enabled: !!candidateId
  });
}

export function useUpsertHRInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interview: HRInterviewInsert) => azureDb.hrInterviews.upsert(interview),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['hr-interviews', variables.application_id] });
    }
  });
}

export function useUpdateHRInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HRInterview> }) => 
      azureDb.hrInterviews.upsert({ ...updates, application_id: id } as HRInterviewInsert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-interviews'] });
    }
  });
}

// Tech Interviews
export function useTechInterview(applicationId: string | null) {
  return useQuery({
    queryKey: ['tech-interviews', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      return azureDb.techInterviews.get(applicationId) as Promise<TechInterview | null>;
    },
    enabled: !!applicationId
  });
}

export function useTechInterviewByCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['tech-interviews', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      return azureDb.techInterviews.listByCandidate(candidateId) as Promise<TechInterview[]>;
    },
    enabled: !!candidateId
  });
}

export function useUpsertTechInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interview: TechInterviewInsert) => azureDb.techInterviews.upsert(interview),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tech-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['tech-interviews', variables.application_id] });
    }
  });
}

export function useUpdateTechInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TechInterview> }) => 
      azureDb.techInterviews.upsert({ ...updates, application_id: id } as TechInterviewInsert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-interviews'] });
    }
  });
}

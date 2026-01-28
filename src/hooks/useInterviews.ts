import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

export type HRInterview = Tables<'hr_interviews'>;
export type HRInterviewInsert = TablesInsert<'hr_interviews'>;
export type HRInterviewUpdate = TablesUpdate<'hr_interviews'>;
export type HRVerdict = Enums<'hr_verdict'>;

export type TechInterview = Tables<'tech_interviews'>;
export type TechInterviewInsert = TablesInsert<'tech_interviews'>;
export type TechInterviewUpdate = TablesUpdate<'tech_interviews'>;
export type TechVerdict = Enums<'tech_verdict'>;

// HR Interviews
export function useHRInterview(applicationId: string | null) {
  return useQuery({
    queryKey: ['hr-interviews', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const { data, error } = await supabase
        .from('hr_interviews')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!applicationId
  });
}

export function useHRInterviewByCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['hr-interviews', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from('hr_interviews')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId
  });
}

export function useUpsertHRInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interview: HRInterviewInsert) => {
      const { data, error } = await supabase
        .from('hr_interviews')
        .upsert(interview, { onConflict: 'application_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['hr-interviews', variables.application_id] });
    }
  });
}

export function useUpdateHRInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: HRInterviewUpdate }) => {
      const { data, error } = await supabase
        .from('hr_interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
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
      const { data, error } = await supabase
        .from('tech_interviews')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!applicationId
  });
}

export function useTechInterviewByCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['tech-interviews', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from('tech_interviews')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId
  });
}

export function useUpsertTechInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interview: TechInterviewInsert) => {
      const { data, error } = await supabase
        .from('tech_interviews')
        .upsert(interview, { onConflict: 'application_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tech-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['tech-interviews', variables.application_id] });
    }
  });
}

export function useUpdateTechInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TechInterviewUpdate }) => {
      const { data, error } = await supabase
        .from('tech_interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-interviews'] });
    }
  });
}

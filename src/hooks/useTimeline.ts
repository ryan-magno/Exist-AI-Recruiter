import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type TimelineEntry = Tables<'candidate_timeline'>;
export type TimelineInsert = TablesInsert<'candidate_timeline'>;
export type PipelineStatus = Enums<'pipeline_status'>;

export function useTimeline(applicationId: string | null) {
  return useQuery({
    queryKey: ['timeline', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      const { data, error } = await supabase
        .from('candidate_timeline')
        .select('*')
        .eq('application_id', applicationId)
        .order('changed_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!applicationId
  });
}

export function useTimelineByCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['timeline', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from('candidate_timeline')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('changed_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId
  });
}

export function useCreateTimelineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: TimelineInsert) => {
      const { data, error } = await supabase
        .from('candidate_timeline')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.application_id] });
      queryClient.invalidateQueries({ queryKey: ['timeline', 'candidate', variables.candidate_id] });
    }
  });
}

export function useApplicationHistory(candidateId: string | null) {
  return useQuery({
    queryKey: ['application-history', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from('application_history')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('applied_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId
  });
}

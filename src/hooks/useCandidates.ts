import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Candidate = Tables<'candidates'>;
export type CandidateInsert = TablesInsert<'candidates'>;
export type CandidateUpdate = TablesUpdate<'candidates'>;

export type WorkExperience = Tables<'candidate_work_experience'>;

export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useCandidate(id: string | null) {
  return useQuery({
    queryKey: ['candidates', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
}

export function useCandidateWithDetails(id: string | null) {
  return useQuery({
    queryKey: ['candidates', id, 'details'],
    queryFn: async () => {
      if (!id) return null;
      
      const [candidateRes, workExpRes] = await Promise.all([
        supabase.from('candidates').select('*').eq('id', id).single(),
        supabase.from('candidate_work_experience').select('*').eq('candidate_id', id).order('start_date', { ascending: false })
      ]);
      
      if (candidateRes.error) throw candidateRes.error;
      
      return {
        ...candidateRes.data,
        workExperiences: workExpRes.data || []
      };
    },
    enabled: !!id
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCandidate: CandidateInsert) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert(newCandidate)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    }
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CandidateUpdate }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates', variables.id] });
    }
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    }
  });
}

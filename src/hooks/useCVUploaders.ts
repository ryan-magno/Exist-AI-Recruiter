import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type CVUploader = Tables<'cv_uploaders'>;
export type CVUploaderInsert = TablesInsert<'cv_uploaders'>;

export function useCVUploaders() {
  return useQuery({
    queryKey: ['cv-uploaders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cv_uploaders')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    }
  });
}

export function useCVUploaderNames() {
  return useQuery({
    queryKey: ['cv-uploader-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cv_uploaders')
        .select('name')
        .order('name', { ascending: true });
      if (error) throw error;
      return data.map(u => u.name);
    }
  });
}

export function useCreateCVUploader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      // Check if already exists (case-insensitive)
      const { data: existing } = await supabase
        .from('cv_uploaders')
        .select('id')
        .ilike('name', name)
        .maybeSingle();
      
      if (existing) return existing;
      
      const { data, error } = await supabase
        .from('cv_uploaders')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv-uploaders'] });
      queryClient.invalidateQueries({ queryKey: ['cv-uploader-names'] });
    }
  });
}

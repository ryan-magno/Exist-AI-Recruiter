import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

export type Application = Tables<'candidate_job_applications'>;
export type ApplicationInsert = TablesInsert<'candidate_job_applications'>;
export type ApplicationUpdate = TablesUpdate<'candidate_job_applications'>;
export type PipelineStatus = Enums<'pipeline_status'>;
export type TechInterviewResult = Enums<'tech_interview_result'>;

export interface ApplicationWithDetails extends Application {
  candidate: Tables<'candidates'>;
  job_order: Tables<'job_orders'>;
}

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_job_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useApplicationsForJobOrder(jobOrderId: string | null) {
  return useQuery({
    queryKey: ['applications', 'job-order', jobOrderId],
    queryFn: async () => {
      if (!jobOrderId) return [];
      const { data, error } = await supabase
        .from('candidate_job_applications')
        .select(`
          *,
          candidate:candidates(*),
          job_order:job_orders(*)
        `)
        .eq('job_order_id', jobOrderId)
        .order('match_score', { ascending: false });
      if (error) throw error;
      return data as ApplicationWithDetails[];
    },
    enabled: !!jobOrderId
  });
}

export function useApplicationsForCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['applications', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from('candidate_job_applications')
        .select(`
          *,
          job_order:job_orders(*)
        `)
        .eq('candidate_id', candidateId)
        .order('applied_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId
  });
}

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('candidate_job_applications')
        .select(`
          *,
          candidate:candidates(*),
          job_order:job_orders(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ApplicationWithDetails;
    },
    enabled: !!id
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newApp: ApplicationInsert) => {
      const { data, error } = await supabase
        .from('candidate_job_applications')
        .insert(newApp)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ApplicationUpdate }) => {
      const { data, error } = await supabase
        .from('candidate_job_applications')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      id, 
      status,
      previousStatus 
    }: { 
      id: string; 
      status: PipelineStatus;
      previousStatus?: PipelineStatus;
    }) => {
      const now = new Date().toISOString();
      
      // Update application status
      const { data: appData, error: appError } = await supabase
        .from('candidate_job_applications')
        .update({
          pipeline_status: status,
          status_changed_date: now,
          updated_at: now
        })
        .eq('id', id)
        .select('*, candidate:candidates(*)')
        .single();
      
      if (appError) throw appError;

      // Create timeline entry
      const { error: timelineError } = await supabase
        .from('candidate_timeline')
        .insert({
          application_id: id,
          candidate_id: appData.candidate_id,
          from_status: previousStatus || null,
          to_status: status,
          changed_date: now
        });
      
      if (timelineError) console.error('Timeline error:', timelineError);
      
      return appData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    }
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidate_job_applications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });
}

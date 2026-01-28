import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type JobOrder = Tables<'job_orders'>;
export type JobOrderInsert = TablesInsert<'job_orders'>;
export type JobOrderUpdate = TablesUpdate<'job_orders'>;

export function useJobOrders() {
  return useQuery({
    queryKey: ['job-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useJobOrder(id: string | null) {
  return useQuery({
    queryKey: ['job-orders', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('job_orders')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
}

export function useCreateJobOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newJO: JobOrderInsert) => {
      const { data, error } = await supabase
        .from('job_orders')
        .insert(newJO)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
    }
  });
}

export function useUpdateJobOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: JobOrderUpdate }) => {
      const { data, error } = await supabase
        .from('job_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
    }
  });
}

export function useDeleteJobOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
    }
  });
}

export function useJobOrderCount() {
  return useQuery({
    queryKey: ['job-orders-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('job_orders')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });
}

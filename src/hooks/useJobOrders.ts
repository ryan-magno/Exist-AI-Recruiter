import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export interface JobOrder {
  id: string;
  jo_number: string;
  title: string;
  description: string | null;
  department_name: string | null;
  department_id: string | null;
  level: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  quantity: number;
  hired_count: number;
  employment_type: 'consultant' | 'project-based' | 'regular';
  requestor_name: string | null;
  required_date: string | null;
  status: 'draft' | 'in-progress' | 'fulfilled' | 'closed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobOrderInsert {
  jo_number: string;
  title: string;
  description?: string | null;
  department_name?: string | null;
  level: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  quantity?: number;
  employment_type: 'consultant' | 'project-based' | 'regular';
  requestor_name?: string | null;
  required_date?: string | null;
  status?: 'draft' | 'in-progress' | 'fulfilled' | 'closed';
}

export type JobOrderUpdate = Partial<JobOrder>;

export function useJobOrders() {
  return useQuery({
    queryKey: ['job-orders'],
    queryFn: () => azureDb.jobOrders.list() as Promise<JobOrder[]>
  });
}

export function useJobOrder(id: string | null) {
  return useQuery({
    queryKey: ['job-orders', id],
    queryFn: async () => {
      if (!id) return null;
      const orders = await azureDb.jobOrders.list();
      return orders.find((jo: JobOrder) => jo.id === id) || null;
    },
    enabled: !!id
  });
}

export function useCreateJobOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newJO: JobOrderInsert) => azureDb.jobOrders.create(newJO),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
    }
  });
}

export function useUpdateJobOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: JobOrderUpdate }) => 
      azureDb.jobOrders.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
      queryClient.invalidateQueries({ queryKey: ['job-orders', variables.id] });
    }
  });
}

export function useDeleteJobOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => azureDb.jobOrders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
    }
  });
}

export function useJobOrderCount() {
  return useQuery({
    queryKey: ['job-orders-count'],
    queryFn: async () => {
      const result = await azureDb.jobOrders.count();
      return result.count;
    }
  });
}

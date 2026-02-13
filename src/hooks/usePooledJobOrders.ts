import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export interface PooledJobOrder {
  id: string;
  jo_number: string;
  title: string;
  description: string | null;
  department_name: string | null;
  level: string;
  quantity: number | null;
  hired_count: number;
  employment_type: string;
  requestor_name: string | null;
  required_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  available_pool_count: number;
  total_pool_count: number;
}

export function usePooledJobOrders() {
  return useQuery({
    queryKey: ['pooled-job-orders'],
    queryFn: () => azureDb.pooledJobOrders.list(),
    staleTime: 30_000,
  });
}

export function useUpdateJobOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      azureDb.pooledJobOrders.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pooled-job-orders'] });
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
      queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['pooled-candidates'] });
    },
  });
}

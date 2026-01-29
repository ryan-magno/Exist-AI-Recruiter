import { useQuery } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => azureDb.departments.list() as Promise<Department[]>
  });
}

export function useDepartmentNames() {
  return useQuery({
    queryKey: ['department-names'],
    queryFn: async () => {
      const departments = await azureDb.departments.list();
      return departments.map((d: Department) => d.name);
    }
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Department = Tables<'departments'>;

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    }
  });
}

export function useDepartmentNames() {
  return useQuery({
    queryKey: ['department-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .order('name', { ascending: true });
      if (error) throw error;
      return data.map(d => d.name);
    }
  });
}

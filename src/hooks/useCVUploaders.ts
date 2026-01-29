import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export interface CVUploader {
  id: string;
  name: string;
  created_at: string;
}

export type CVUploaderInsert = { name: string };

export function useCVUploaders() {
  return useQuery({
    queryKey: ['cv-uploaders'],
    queryFn: () => azureDb.cvUploaders.list() as Promise<CVUploader[]>
  });
}

export function useCVUploaderNames() {
  return useQuery({
    queryKey: ['cv-uploader-names'],
    queryFn: async () => {
      const uploaders = await azureDb.cvUploaders.list();
      return uploaders.map((u: CVUploader) => u.name);
    }
  });
}

export function useCreateCVUploader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => azureDb.cvUploaders.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv-uploaders'] });
      queryClient.invalidateQueries({ queryKey: ['cv-uploader-names'] });
    }
  });
}

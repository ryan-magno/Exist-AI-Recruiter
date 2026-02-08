import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export type PipelineStatus = 'hr_interview' | 'tech_interview' | 'offer' | 'hired' | 'rejected';
export type TechInterviewResult = 'pending' | 'pass' | 'fail' | 'conditional';

export interface Application {
  id: string;
  candidate_id: string;
  job_order_id: string;
  pipeline_status: PipelineStatus;
  match_score: number | null;
  tech_interview_result: TechInterviewResult | null;
  employment_type: string | null;
  working_conditions: string | null;
  remarks: string | null;
  applied_date: string;
  status_changed_date: string;
  created_at: string;
  updated_at: string;
  candidate_name?: string;
  candidate_email?: string;
  skills?: string[];
  years_of_experience?: number;
  jo_number?: string;
  job_title?: string;
}

export interface ApplicationWithDetails extends Application {
  candidate?: { id: string; full_name: string; email: string | null; skills: string[] | null; years_of_experience: number | null; };
  job_order?: { id: string; jo_number: string; title: string; };
}

export interface ApplicationInsert {
  candidate_id: string;
  job_order_id: string;
  pipeline_status?: PipelineStatus;
  match_score?: number | null;
  remarks?: string | null;
}

export interface ApplicationUpdate {
  pipeline_status?: PipelineStatus;
  tech_interview_result?: TechInterviewResult;
  employment_type?: string;
  working_conditions?: string;
  remarks?: string;
}

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => azureDb.applications.list() as Promise<Application[]>
  });
}

export function useApplicationsForJobOrder(jobOrderId: string | null) {
  return useQuery({
    queryKey: ['applications', 'job-order', jobOrderId],
    queryFn: async () => {
      if (!jobOrderId) return [];
      const apps = await azureDb.applications.list({ job_order_id: jobOrderId });
      return apps.map((app: Application) => ({
        ...app,
        candidate: { id: app.candidate_id, full_name: app.candidate_name || 'Unknown', email: app.candidate_email || null, skills: app.skills || null, years_of_experience: app.years_of_experience || null },
        job_order: { id: app.job_order_id, jo_number: app.jo_number || '', title: app.job_title || '' }
      })) as ApplicationWithDetails[];
    },
    enabled: !!jobOrderId
  });
}

export function useApplicationsForCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['applications', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const apps = await azureDb.applications.list({ candidate_id: candidateId });
      return apps.map((app: Application) => ({ ...app, job_order: { id: app.job_order_id, jo_number: app.jo_number || '', title: app.job_title || '' } }));
    },
    enabled: !!candidateId
  });
}

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      if (!id) return null;
      const apps = await azureDb.applications.list();
      const app = apps.find((a: Application) => a.id === id);
      if (!app) return null;
      return { ...app, candidate: { id: app.candidate_id, full_name: app.candidate_name || 'Unknown', email: app.candidate_email || null, skills: app.skills || null, years_of_experience: app.years_of_experience || null }, job_order: { id: app.job_order_id, jo_number: app.jo_number || '', title: app.job_title || '' } } as ApplicationWithDetails;
    },
    enabled: !!id
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newApp: ApplicationInsert) => azureDb.applications.create(newApp),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applications'] }); }
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ApplicationUpdate }) => azureDb.applications.update(id, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applications'] }); }
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, previousStatus }: { id: string; status: PipelineStatus; previousStatus?: PipelineStatus; }) => {
      return azureDb.applications.update(id, { pipeline_status: status });
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
    mutationFn: async (id: string) => { throw new Error('Delete not implemented'); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applications'] }); }
  });
}

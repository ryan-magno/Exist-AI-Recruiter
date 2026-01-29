import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export type PipelineStatus = 'new' | 'screening' | 'for_hr_interview' | 'for_tech_interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';

export interface TimelineEntry {
  id: string;
  application_id: string;
  candidate_id: string;
  from_status: PipelineStatus | null;
  to_status: PipelineStatus;
  changed_date: string;
  changed_by: string | null;
  duration_days: number | null;
  notes: string | null;
  created_at: string;
}

export interface TimelineInsert {
  application_id: string;
  candidate_id: string;
  from_status?: PipelineStatus | null;
  to_status: PipelineStatus;
  notes?: string | null;
}

export function useTimeline(applicationId: string | null) {
  return useQuery({
    queryKey: ['timeline', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      return azureDb.timeline.list({ application_id: applicationId }) as Promise<TimelineEntry[]>;
    },
    enabled: !!applicationId
  });
}

export function useTimelineByCandidate(candidateId: string | null) {
  return useQuery({
    queryKey: ['timeline', 'candidate', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      return azureDb.timeline.list({ candidate_id: candidateId }) as Promise<TimelineEntry[]>;
    },
    enabled: !!candidateId
  });
}

export function useCreateTimelineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: TimelineInsert) => {
      // Timeline entries are created automatically by the edge function
      // when application status changes
      throw new Error('Timeline entries are created automatically on status change');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.application_id] });
      queryClient.invalidateQueries({ queryKey: ['timeline', 'candidate', variables.candidate_id] });
    }
  });
}

export function useApplicationHistory(candidateId: string | null) {
  return useQuery({
    queryKey: ['application-history', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      // For now, return timeline entries as history
      return azureDb.timeline.list({ candidate_id: candidateId });
    },
    enabled: !!candidateId
  });
}

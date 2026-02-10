import { useQuery } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export interface ActivityLogEntry {
  id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  performed_by_name: string | null;
  action_date: string;
  details: Record<string, any>;
  created_at: string;
}

interface UseActivityLogParams {
  entityType?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function useActivityLog(params: UseActivityLogParams = {}) {
  return useQuery({
    queryKey: ['activity-log', params],
    queryFn: () => azureDb.activityLog.list({
      entity_type: params.entityType,
      activity_type: params.activityType,
      start_date: params.startDate,
      end_date: params.endDate,
      limit: params.limit || 50,
      offset: params.offset,
    }) as Promise<ActivityLogEntry[]>,
  });
}

export const activityTypeLabels: Record<string, string> = {
  'jo_created': 'Created',
  'jo_edited': 'Edited',
  'jo_deleted': 'Deleted',
  'jo_archived': 'Archived',
  'jo_unarchived': 'Unarchived',
  'pipeline_moved': 'Pipeline Movement',
  'cv_uploaded': 'CV Uploaded',
  'hr_interview_submitted': 'Submitted',
  'hr_interview_updated': 'Updated',
  'tech_interview_submitted': 'Submitted',
  'tech_interview_updated': 'Updated',
  'offer_created': 'Created',
  'offer_updated': 'Updated',
  'profile_updated': 'Profile Updated',
};

export const pipelineStatusReadable: Record<string, string> = {
  'hr_interview': 'HR Interview',
  'tech_interview': 'Tech Interview',
  'offer': 'Offer',
  'hired': 'Hired',
  'rejected': 'Rejected',
};

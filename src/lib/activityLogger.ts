import { azureDb } from '@/lib/azureDb';

interface LogActivityParams {
  activityType: string;
  entityType: string;
  entityId: string;
  performedByName?: string | null;
  details?: Record<string, any>;
}

/**
 * Fire-and-forget activity logging.
 * Never blocks main operations — logs errors silently.
 */
export function logActivity(data: LogActivityParams) {
  azureDb.activityLog.create({
    activity_type: data.activityType,
    entity_type: data.entityType,
    entity_id: data.entityId,
    performed_by_name: data.performedByName || null,
    details: data.details || {},
  }).catch(err => console.error('Activity log error:', err));
}

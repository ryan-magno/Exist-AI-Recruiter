import { Clock } from 'lucide-react';
import { TimelineEntry, PipelineStatus, pipelineStatusLabels } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface CandidateTimelineProps {
  timeline: TimelineEntry[];
  appliedDate: string;
}

const getStatusLabel = (status: PipelineStatus | 'applied'): string => {
  if (status === 'applied') return 'Applied';
  return pipelineStatusLabels[status];
};

const getStatusColor = (status: PipelineStatus | 'applied'): string => {
  switch (status) {
    case 'applied':
      return 'bg-gray-400';
    case 'new-match':
      return 'bg-sky-500';
    case 'hr-interview':
      return 'bg-violet-500';
    case 'offer':
      return 'bg-amber-500';
    case 'hired':
      return 'bg-emerald-500';
    case 'rejected':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export function CandidateTimeline({ timeline, appliedDate }: CandidateTimelineProps) {
  // Build timeline entries including the initial "Applied" entry
  const fullTimeline = [
    {
      id: 'applied',
      status: 'applied' as const,
      date: appliedDate,
      durationDays: timeline.length > 0 ? timeline[0].durationDays : undefined
    },
    ...timeline.map((entry, index) => ({
      id: entry.id,
      status: entry.toStatus,
      date: entry.date,
      durationDays: index < timeline.length - 1 ? timeline[index + 1].durationDays : undefined
    }))
  ];

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Full Timeline</span>
      </div>

      <div className="relative">
        {fullTimeline.map((entry, index) => {
          const isLast = index === fullTimeline.length - 1;
          const statusColor = getStatusColor(entry.status);

          return (
            <div key={entry.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute left-[9px] top-5 w-0.5 h-[calc(100%-12px)] bg-border" />
              )}

              {/* Status dot */}
              <div className={cn(
                'relative z-10 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center shrink-0',
                isLast ? 'ring-2 ring-primary ring-offset-2' : '',
                statusColor
              )}>
                <div className="w-2 h-2 rounded-full bg-white/40" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    isLast ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {getStatusLabel(entry.status)}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(entry.date)}
                  </span>
                </div>
                {entry.durationDays !== undefined && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Duration: {entry.durationDays} day{entry.durationDays !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
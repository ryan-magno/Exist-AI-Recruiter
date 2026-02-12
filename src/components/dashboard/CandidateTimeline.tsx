import { Clock, Loader2 } from 'lucide-react';
import { useTimeline, TimelineEntry as DBTimelineEntry, PipelineStatus as DBPipelineStatus } from '@/hooks/useTimeline';
import { cn } from '@/lib/utils';

interface CandidateTimelineProps {
  applicationId: string;
  appliedDate: string;
  horizontal?: boolean;
}

// Map DB pipeline status to display labels
const pipelineStatusLabels: Record<DBPipelineStatus | 'applied', string> = {
  'applied': 'Applied',
  'hr_interview': 'For HR Interview',
  'tech_interview': 'For Tech Interview',
  'offer': 'Offer',
  'hired': 'Hired',
  'rejected': 'Rejected'
};

const getStatusLabel = (status: DBPipelineStatus | 'applied'): string => {
  return pipelineStatusLabels[status] || status;
};

const getStatusColor = (status: DBPipelineStatus | 'applied'): string => {
  switch (status) {
    case 'applied':
      return 'bg-gray-400';
    case 'hr_interview':
      return 'bg-sky-500';
    case 'tech_interview':
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
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export function CandidateTimeline({ applicationId, appliedDate, horizontal }: CandidateTimelineProps) {
  const { data: timelineData, isLoading } = useTimeline(applicationId);

  if (isLoading) {
    return (
      <div className="p-3 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Loading timeline...</span>
      </div>
    );
  }

  // Build timeline entries including the initial "Applied" entry
  const timeline = [...(timelineData || [])];
  const reversedTimeline = [...timeline].reverse();
  const fullTimeline = [
    {
      id: 'applied',
      status: 'applied' as const,
      date: appliedDate,
      durationDays: reversedTimeline.length > 0 ? reversedTimeline[0].duration_days : undefined
    },
    ...reversedTimeline.map((entry, index) => ({
      id: entry.id,
      status: entry.to_status,
      date: entry.changed_date,
      durationDays: index < reversedTimeline.length - 1 ? reversedTimeline[index + 1].duration_days : undefined
    }))
  ];

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Full Timeline</span>
      </div>

      {fullTimeline.length <= 1 ? (
        <p className="text-xs text-muted-foreground italic">No status changes recorded yet.</p>
      ) : horizontal ? (
        /* ── Horizontal layout ── */
        <div className="flex items-center gap-0 overflow-x-auto">
          {fullTimeline.map((entry, index) => {
            const isLast = index === fullTimeline.length - 1;
            const statusColor = getStatusColor(entry.status);
            return (
              <div key={entry.id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center gap-0.5">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 border-background flex items-center justify-center',
                    isLast ? 'ring-2 ring-primary ring-offset-1' : '',
                    statusColor
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <span className={cn('text-[10px] font-medium whitespace-nowrap', isLast ? 'text-foreground' : 'text-muted-foreground')}>
                    {getStatusLabel(entry.status)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{formatDate(entry.date)}</span>
                  {entry.durationDays != null && (
                    <span className="text-[9px] text-muted-foreground">{entry.durationDays}d</span>
                  )}
                </div>
                {!isLast && <div className="w-6 h-0.5 bg-border mx-1 mt-[-16px]" />}
              </div>
            );
          })}
        </div>
      ) : (
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
                  {entry.durationDays !== undefined && entry.durationDays !== null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Duration: {entry.durationDays} day{entry.durationDays !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

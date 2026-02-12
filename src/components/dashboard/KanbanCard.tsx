import { Loader2, Phone } from 'lucide-react';
import { Candidate } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import existLogo from '@/assets/exist-logo.png';

interface KanbanCardProps {
  candidate: Candidate;
  onClick?: () => void;
}

export function KanbanCard({ candidate, onClick }: KanbanCardProps) {
  const { toast } = useToast();
  const isProcessing = candidate.processingStatus === 'processing';
  const isFailed = candidate.processingStatus === 'failed';

  const getScoreClass = (score: number): string => {
    if (score >= 75) return 'match-score-high';
    if (score >= 50) return 'match-score-medium';
    return 'match-score-low';
  };

  // Render processing state
  if (isProcessing) {
    return (
      <div
        className="kanban-card bg-card border border-dashed border-amber-300 rounded-lg p-3 cursor-not-allowed opacity-80"
        title="AI analysis in progress (typically 30-45 seconds)"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-xs font-medium text-amber-600">Processing...</span>
              </div>
              <span className="status-badge text-xs bg-amber-100 text-amber-700 border-amber-300 px-2 py-0.5 rounded-full">
                AI Analysis
              </span>
            </div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <div className="flex flex-wrap gap-1 mb-2">
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-10 rounded" />
            </div>
            <p className="text-xs text-muted-foreground italic">
              Extracting skills, experience, and match score...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render failed state
  if (isFailed) {
    return (
      <div
        className="kanban-card bg-card border border-dashed border-red-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm text-red-600 truncate">
                Processing Failed
              </p>
              <span className="status-badge text-xs bg-red-100 text-red-700 border-red-300 px-2 py-0.5 rounded-full">
                Error
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {candidate.name || 'Unable to process CV'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal candidate card
  return (
    <div
      className={cn(
        'kanban-card bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm text-foreground truncate">
              {candidate.name}
            </p>
            <span className={cn('status-badge text-xs', getScoreClass(candidate.qualificationScore ?? candidate.matchScore))}>
              {candidate.qualificationScore != null ? `${candidate.qualificationScore}` : `${candidate.matchScore}%`}
            </span>
          </div>
          
          {/* Mobile number with copy functionality */}
          {candidate.phone && (
            <button
              className="text-xs text-muted-foreground leading-tight mb-2 truncate flex items-center gap-1 hover:text-primary transition-colors"
              onClick={(e) => { 
                e.stopPropagation(); 
                navigator.clipboard.writeText(candidate.phone); 
                toast({ description: 'Phone copied' }); 
              }}
              title="Click to copy"
            >
              <Phone className="w-3 h-3 flex-shrink-0" />
              {candidate.phone}
            </button>
          )}
          
          <div className="flex flex-wrap gap-1 mb-2">
            {candidate.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{candidate.skills.length - 3}
              </span>
            )}
          </div>

          {/* Status badges row */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Tech Interview Result */}
              {candidate.techInterviewResult && candidate.techInterviewResult !== 'pending' && (
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                  candidate.techInterviewResult === 'pass' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                )}>
                  Tech: {candidate.techInterviewResult === 'pass' ? 'Pass' : 'Fail'}
                </span>
              )}
              {/* Offer Status */}
              {candidate.offerStatus && (
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded border',
                  candidate.offerStatus === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  candidate.offerStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                  candidate.offerStatus === 'withdrawn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-muted text-muted-foreground border-border'
                )}>
                  Offer: {candidate.offerStatus.charAt(0).toUpperCase() + candidate.offerStatus.slice(1)}
                </span>
              )}
            </div>

            {/* Internal badge */}
            {candidate.applicantType === 'internal' && (
              <img 
                src={existLogo} 
                alt="Internal" 
                className="w-4 h-4 object-contain"
                title="Internal Employee"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

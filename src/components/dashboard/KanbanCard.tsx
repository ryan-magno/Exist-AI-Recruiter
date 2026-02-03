import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2 } from 'lucide-react';
import { Candidate } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import existLogo from '@/assets/exist-logo.png';

interface KanbanCardProps {
  candidate: Candidate;
  isDragging?: boolean;
  onClick?: () => void;
}

export function KanbanCard({ candidate, isDragging, onClick }: KanbanCardProps) {
  const isProcessing = candidate.processingStatus === 'processing';
  const isFailed = candidate.processingStatus === 'failed';
  
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingState } = useDraggable({
    id: candidate.id,
    disabled: isProcessing, // Disable drag when processing
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDraggingState ? 0.5 : 1,
  };

  const getScoreClass = (score: number): string => {
    if (score >= 90) return 'match-score-high';
    if (score >= 75) return 'match-score-medium';
    return 'match-score-low';
  };

  // Render processing state
  if (isProcessing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="kanban-card bg-card border border-dashed border-amber-300 rounded-lg p-3 cursor-not-allowed opacity-80"
        title="AI analysis in progress (typically 30-45 seconds)"
      >
        <div className="flex items-start gap-2">
          <div className="p-1 -ml-1">
            <GripVertical className="w-4 h-4 text-muted-foreground/30" />
          </div>
          
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
        ref={setNodeRef}
        style={style}
        className="kanban-card bg-card border border-dashed border-red-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <div className="flex items-start gap-2">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          
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
      ref={setNodeRef}
      style={style}
      className={cn(
        'kanban-card bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'shadow-lg ring-2 ring-primary opacity-90'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm text-foreground truncate">
              {candidate.name}
            </p>
            <span className={cn('status-badge text-xs', getScoreClass(candidate.matchScore))}>
              {candidate.matchScore}%
            </span>
          </div>
          
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

          {/* Internal badge only - no tag for external candidates */}
          {candidate.applicantType === 'internal' && (
            <div className="flex items-center justify-end">
              <img 
                src={existLogo} 
                alt="Internal" 
                className="w-4 h-4 object-contain"
                title="Internal Employee"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

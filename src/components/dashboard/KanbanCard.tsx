import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Tag } from 'lucide-react';
import { Candidate } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  candidate: Candidate;
  isDragging?: boolean;
  onClick?: () => void;
}

export function KanbanCard({ candidate, isDragging, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingState } = useDraggable({
    id: candidate.id,
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

          {/* Internal/External badge at bottom */}
          <div className="flex items-center justify-end">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1',
              candidate.applicantType === 'internal' 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-slate-100 text-slate-600 border-slate-300'
            )}>
              <Tag className="w-2.5 h-2.5" />
              {candidate.applicantType === 'internal' ? 'Internal' : 'External'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

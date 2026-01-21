import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Mail, MessageSquare, Trash2, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Candidate, PipelineStatus, pipelineStatusLabels, techInterviewLabels, techInterviewColors, TechInterviewResult } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { CandidateModal } from '@/components/modals/CandidateModal';
import { EmailModal } from '@/components/modals/EmailModal';
import { cn } from '@/lib/utils';

interface DashboardKanbanProps {
  candidates: Candidate[];
}

// Define visible columns for dashboard (excluding rejected)
const columns: { id: PipelineStatus; title: string }[] = [
  { id: 'new-match', title: 'For HR Interview' },
  { id: 'hr-interview', title: 'For Tech Interview' },
  { id: 'offer', title: 'Offer' },
  { id: 'hired', title: 'Hired' },
];

// Stage aging utility functions
function getStageAgingDays(statusChangedDate: string): number {
  const changed = new Date(statusChangedDate);
  const now = new Date();
  return Math.floor((now.getTime() - changed.getTime()) / (1000 * 60 * 60 * 24));
}

function getStageAgingLabel(days: number): string {
  if (days === 0) return 'Moved today';
  if (days === 1) return 'Moved yesterday';
  return `${days}d in stage`;
}

function getStageAgingColor(days: number): string {
  if (days < 3) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (days <= 7) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function formatStageDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}

// Kanban Card Component
interface KanbanCardProps {
  candidate: Candidate;
  isDragging?: boolean;
  onOpenProfile: (candidate: Candidate) => void;
  onOpenNotes: (candidate: Candidate) => void;
  onEmail: (candidate: Candidate) => void;
  onDelete: (id: string) => void;
  onTechInterviewChange: (id: string, result: TechInterviewResult) => void;
}

function KanbanCard({ 
  candidate, 
  isDragging, 
  onOpenProfile, 
  onOpenNotes, 
  onEmail, 
  onDelete,
  onTechInterviewChange 
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingState } = useDraggable({
    id: candidate.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDraggingState ? 0.5 : 1,
  };

  const getScoreClass = (score: number): string => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 75) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const agingDays = getStageAgingDays(candidate.statusChangedDate);
  const showTechInterview = candidate.pipelineStatus !== 'new-match';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all',
        isDragging && 'shadow-lg ring-2 ring-primary opacity-90'
      )}
      onClick={() => onOpenProfile(candidate)}
    >
      {/* Header with drag handle and score */}
      <div className="flex items-start gap-2 mb-2">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-semibold text-sm text-foreground truncate">
              {candidate.name}
            </p>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold border shrink-0', getScoreClass(candidate.matchScore))}>
              {candidate.matchScore}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {candidate.email}
          </p>
        </div>
      </div>

      {/* Stage Aging Indicator */}
      <div className={cn(
        'flex items-center justify-between px-2 py-1.5 rounded-md border mb-2 text-xs',
        getStageAgingColor(agingDays)
      )}>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{getStageAgingLabel(agingDays)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Since {formatStageDate(candidate.statusChangedDate)}</span>
        </div>
      </div>

      {/* Tech Interview Status - only show if not in For HR Interview */}
      {showTechInterview && (
        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={candidate.techInterviewResult}
            onValueChange={(value) => onTechInterviewChange(candidate.id, value as TechInterviewResult)}
          >
            <SelectTrigger className={cn("h-7 text-xs border w-full", techInterviewColors[candidate.techInterviewResult])}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(techInterviewLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-1 border-t" onClick={(e) => e.stopPropagation()}>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEmail(candidate)} title="Send email">
          <Mail className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onOpenNotes(candidate)} title="View notes">
          <MessageSquare className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(candidate.id)} title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// Column Component
interface KanbanColumnProps {
  id: string;
  title: string;
  candidates: Candidate[];
  onOpenProfile: (candidate: Candidate) => void;
  onOpenNotes: (candidate: Candidate) => void;
  onEmail: (candidate: Candidate) => void;
  onDelete: (id: string) => void;
  onTechInterviewChange: (id: string, result: TechInterviewResult) => void;
}

function KanbanColumn({ id, title, candidates, onOpenProfile, onOpenNotes, onEmail, onDelete, onTechInterviewChange }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {candidates.length}
        </span>
      </div>
      
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[400px] p-2 rounded-lg bg-muted/30 border border-dashed border-border space-y-2 transition-all',
          isOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
        )}
      >
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Drop candidates here
          </p>
        ) : (
          candidates.map((candidate) => (
            <KanbanCard
              key={candidate.id}
              candidate={candidate}
              onOpenProfile={onOpenProfile}
              onOpenNotes={onOpenNotes}
              onEmail={onEmail}
              onDelete={onDelete}
              onTechInterviewChange={onTechInterviewChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Main Dashboard Kanban Component
export function DashboardKanban({ candidates }: DashboardKanbanProps) {
  const { updateCandidatePipelineStatus, updateCandidateTechInterviewResult, deleteCandidate } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);
  const [initialTab, setInitialTab] = useState<string>('profile');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const candidateId = active.id as string;
      const newStatus = over.id as PipelineStatus;
      
      // Check if dropped on a column
      if (columns.some(col => col.id === newStatus)) {
        updateCandidatePipelineStatus(candidateId, newStatus);
      }
    }
  };

  const handleOpenProfile = (candidate: Candidate) => {
    setInitialTab('profile');
    setSelectedCandidate(candidate);
  };

  const handleOpenNotes = (candidate: Candidate) => {
    setInitialTab('notes');
    setSelectedCandidate(candidate);
  };

  const activeCandidate = candidates.find(c => c.id === activeId);

  const getCandidatesForColumn = (status: PipelineStatus) => {
    return candidates
      .filter(c => c.pipelineStatus === status)
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              candidates={getCandidatesForColumn(column.id)}
              onOpenProfile={handleOpenProfile}
              onOpenNotes={handleOpenNotes}
              onEmail={setEmailCandidate}
              onDelete={deleteCandidate}
              onTechInterviewChange={updateCandidateTechInterviewResult}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCandidate ? (
            <div className="bg-card border rounded-lg p-3 shadow-lg ring-2 ring-primary opacity-90 w-72">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground truncate flex-1">
                  {activeCandidate.name}
                </p>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {activeCandidate.matchScore}%
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CandidateModal 
        candidate={selectedCandidate} 
        onClose={() => setSelectedCandidate(null)}
        initialTab={initialTab}
      />
      
      <EmailModal
        open={!!emailCandidate}
        onClose={() => setEmailCandidate(null)}
        candidate={emailCandidate}
      />
    </>
  );
}

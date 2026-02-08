import { useState, useEffect } from 'react';
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
import { GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { Candidate, PipelineStatus, pipelineStatusLabels, TechInterviewResult } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { CandidateProfileView } from '@/components/candidate/CandidateProfileView';
import { EmailModal } from '@/components/modals/EmailModal';
import { cn } from '@/lib/utils';

interface DashboardKanbanProps {
  candidates: Candidate[];
}

const columns: { id: PipelineStatus; title: string }[] = [
  { id: 'hr_interview', title: 'For HR Interview' },
  { id: 'tech_interview', title: 'For Tech Interview' },
  { id: 'offer', title: 'Offer' },
  { id: 'hired', title: 'Hired' },
  { id: 'rejected', title: 'Rejected' },
];

// ── Compressed 72px Kanban Card ──
interface KanbanCardProps {
  candidate: Candidate;
  isSelected?: boolean;
  onSelect: () => void;
}

function CompactKanbanCard({ candidate, isSelected, onSelect }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    disabled: candidate.processingStatus === 'processing',
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const score = candidate.qualificationScore ?? candidate.matchScore;
  const getScoreStyles = (s: number) => {
    if (s >= 70) return 'bg-green-100 text-green-700 border-green-300';
    if (s >= 50) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const statusLabel = pipelineStatusLabels[candidate.pipelineStatus] || candidate.pipelineStatus;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'flex items-center h-[72px] px-2 gap-2 rounded-lg cursor-pointer transition-all duration-150',
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-600 border border-blue-200 shadow-sm'
          : 'border border-transparent hover:bg-secondary hover:shadow-sm'
      )}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      {/* Score Badge */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border text-sm font-bold',
        getScoreStyles(score)
      )}>
        {score}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{candidate.name}</p>
        <p className="text-xs text-muted-foreground truncate">{candidate.positionApplied}</p>
      </div>

      {/* Status Pill */}
      <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
        {statusLabel}
      </span>
    </div>
  );
}

// ── Kanban Column with collapse for empty ──
interface ColumnProps {
  id: string;
  title: string;
  candidates: Candidate[];
  selectedId: string | null;
  onSelect: (c: Candidate) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function KanbanColumnView({ id, title, candidates, selectedId, onSelect, isCollapsed, onToggleCollapse }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isEmpty = candidates.length === 0;

  if (isCollapsed) {
    return (
      <div
        className="w-10 bg-muted rounded-lg flex items-start justify-center pt-3 cursor-pointer hover:bg-secondary transition-colors flex-shrink-0"
        onClick={onToggleCollapse}
        title={`Expand ${title}`}
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('flex-shrink-0 w-72 flex flex-col', isEmpty && 'opacity-50')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
            {candidates.length}
          </span>
        </div>
        {isEmpty && (
          <button onClick={onToggleCollapse} title="Collapse column" className="p-0.5 hover:bg-muted rounded">
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-lg p-2 space-y-1 min-h-[200px] border border-dashed transition-all',
          isOver ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-1' : 'border-border bg-muted/30'
        )}
      >
        {isEmpty ? (
          <p className="text-xs text-muted-foreground text-center py-6">No candidates</p>
        ) : (
          candidates.map((c) => (
            <CompactKanbanCard
              key={c.id}
              candidate={c}
              isSelected={selectedId === c.id}
              onSelect={() => onSelect(c)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard Kanban ──
export function DashboardKanban({ candidates }: DashboardKanbanProps) {
  const { updateCandidatePipelineStatus, updateCandidateTechInterviewResult, deleteCandidate, selectedJoId } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedCandidate(null);
  }, [selectedJoId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const newStatus = over.id as PipelineStatus;
      if (columns.some(col => col.id === newStatus)) {
        updateCandidatePipelineStatus(active.id as string, newStatus);
      }
    }
  };

  const toggleCollapse = (colId: string) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      next.has(colId) ? next.delete(colId) : next.add(colId);
      return next;
    });
  };

  const getCandidatesForColumn = (status: PipelineStatus) =>
    candidates.filter(c => c.pipelineStatus === status).sort((a, b) => (b.qualificationScore ?? b.matchScore) - (a.qualificationScore ?? a.matchScore));

  const activeCandidate = candidates.find(c => c.id === activeId);

  if (selectedCandidate) {
    return <CandidateProfileView candidate={selectedCandidate} onBack={() => setSelectedCandidate(null)} />;
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumnView
              key={column.id}
              id={column.id}
              title={column.title}
              candidates={getCandidatesForColumn(column.id)}
              selectedId={selectedCandidate?.id || null}
              onSelect={setSelectedCandidate}
              isCollapsed={collapsedColumns.has(column.id)}
              onToggleCollapse={() => toggleCollapse(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCandidate ? (
            <div className="bg-card border rounded-lg p-3 shadow-md ring-2 ring-primary opacity-90 w-64">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground truncate flex-1">{activeCandidate.name}</p>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {activeCandidate.qualificationScore ?? activeCandidate.matchScore}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <EmailModal open={!!emailCandidate} onClose={() => setEmailCandidate(null)} candidate={emailCandidate} />
    </>
  );
}

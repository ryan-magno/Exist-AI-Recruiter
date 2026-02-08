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
import { GripVertical, ChevronLeft, ChevronRight, Clock, Mail, Trash2, Loader2 } from 'lucide-react';
import { Candidate, PipelineStatus, pipelineStatusLabels, TechInterviewResult } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { CandidateProfileView } from '@/components/candidate/CandidateProfileView';
import { EmailModal } from '@/components/modals/EmailModal';
import { CandidateTimeline } from '@/components/dashboard/CandidateTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import existLogo from '@/assets/exist-logo.png';

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

// ── Helper: compute stage age label ──
function getStageAge(statusChangedDate: string): string {
  if (!statusChangedDate) return '';
  const changed = new Date(statusChangedDate);
  if (isNaN(changed.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - changed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const dateLabel = changed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (diffDays === 0) return `Moved today`;
  if (diffDays === 1) return `Since yesterday · ${dateLabel}`;
  return `${diffDays}d ago · Since ${dateLabel}`;
}

// ── Kanban Card (restored old design) ──
interface KanbanCardProps {
  candidate: Candidate;
  isSelected?: boolean;
  onSelect: () => void;
  onEmail: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function CompactKanbanCard({ candidate, isSelected, onSelect, onEmail, onDelete }: KanbanCardProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const isProcessing = candidate.processingStatus === 'processing';
  const isFailed = candidate.processingStatus === 'failed';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    disabled: isProcessing,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const score = candidate.qualificationScore ?? candidate.matchScore;
  const getScoreClass = (s: number): string => {
    if (s >= 90) return 'match-score-high';
    if (s >= 75) return 'match-score-medium';
    return 'match-score-low';
  };

  const stageAge = getStageAge(candidate.statusChangedDate);

  // Processing state
  if (isProcessing) {
    return (
      <div ref={setNodeRef} style={style}
        className="bg-card border border-dashed border-amber-300 rounded-lg p-3 cursor-not-allowed opacity-80"
        title="AI analysis in progress (typically 30-45 seconds)"
      >
        <div className="flex items-start gap-2">
          <div className="p-1 -ml-1"><GripVertical className="w-4 h-4 text-muted-foreground/30" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-xs font-medium text-amber-600">Processing...</span>
              </div>
              <span className="status-badge text-xs bg-amber-100 text-amber-700 border-amber-300 px-2 py-0.5 rounded-full">AI Analysis</span>
            </div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <div className="flex flex-wrap gap-1 mb-2">
              <Skeleton className="h-5 w-12 rounded" /><Skeleton className="h-5 w-16 rounded" /><Skeleton className="h-5 w-10 rounded" />
            </div>
            <p className="text-xs text-muted-foreground italic">Extracting skills, experience, and match score...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'kanban-card bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'shadow-lg ring-2 ring-primary opacity-90'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Row 1: Name + Score */}
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm text-foreground truncate">{candidate.name}</p>
            <span className={cn('status-badge text-[10px]', getScoreClass(score))}>
              {candidate.qualificationScore != null ? `${candidate.qualificationScore}` : `${candidate.matchScore}%`}
            </span>
          </div>
          
          {/* Row 2: Skills */}
          <div className="flex flex-wrap gap-1 mb-2">
            {candidate.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{skill}</span>
            ))}
            {candidate.skills.length > 3 && (
              <span className="text-xs text-muted-foreground">+{candidate.skills.length - 3}</span>
            )}
          </div>

          {/* Row 3: Status badges */}
          <div className="flex items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-1 flex-wrap">
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
            {candidate.applicantType === 'internal' && (
              <img src={existLogo} alt="Internal" className="w-4 h-4 object-contain" title="Internal Employee" />
            )}
          </div>

          {/* Row 4: Stage age */}
          {stageAge && (
            <p className="text-[10px] text-muted-foreground mb-2">{stageAge}</p>
          )}

          {/* Row 5: Action buttons */}
          <div className="flex items-center gap-1 border-t border-border pt-2">
            <button
              title="Timeline History"
              aria-label="View timeline history"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowTimeline(!showTimeline); }}
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              title="Send Email"
              aria-label="Send email to candidate"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
              onClick={onEmail}
            >
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              title="Delete Candidate"
              aria-label="Delete candidate"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors ml-auto"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline expandable section */}
      {showTimeline && candidate.applicationId && (
        <div className="mt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <CandidateTimeline applicationId={candidate.applicationId} appliedDate={candidate.appliedDate} />
        </div>
      )}
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
  onEmail: (c: Candidate) => void;
  onDelete: (c: Candidate) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function KanbanColumnView({ id, title, candidates, selectedId, onSelect, onEmail, onDelete, isCollapsed, onToggleCollapse }: ColumnProps) {
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
          'flex-1 rounded-lg p-2 space-y-2 min-h-[200px] border transition-all',
          isOver ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-1' : 'border-border bg-secondary/80'
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
              onEmail={(e) => { e.stopPropagation(); onEmail(c); }}
              onDelete={(e) => { e.stopPropagation(); onDelete(c); }}
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
              onEmail={setEmailCandidate}
              onDelete={(c) => {
                if (confirm(`Delete candidate "${c.name}"?`)) {
                  deleteCandidate(c.id);
                }
              }}
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

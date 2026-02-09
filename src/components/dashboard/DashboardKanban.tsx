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
import { GripVertical, ChevronLeft, ChevronRight, Clock, Mail, Trash2, Loader2, Calendar } from 'lucide-react';
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
function getStageAge(statusChangedDate: string): { ageText: string; dateText: string } {
  if (!statusChangedDate) return { ageText: '', dateText: '' };
  const changed = new Date(statusChangedDate);
  if (isNaN(changed.getTime())) return { ageText: '', dateText: '' };
  const now = new Date();
  const diffMs = now.getTime() - changed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const dateLabel = changed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const ageText = diffDays === 0 ? 'Moved today' : diffDays === 1 ? 'Since yesterday' : `${diffDays}d ago`;
  return { ageText, dateText: `Since ${dateLabel}` };
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

  // Determine which status badges to show based on pipeline stage
  const isInTechInterview = candidate.pipelineStatus === 'tech_interview';
  const isInOffer = candidate.pipelineStatus === 'offer';
  const isInternal = candidate.applicantType === 'internal';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'kanban-card bg-white shadow-sm rounded-lg px-3 py-3 cursor-pointer hover:shadow-md transition-shadow',
        isInternal ? 'border border-green-400' : 'border border-gray-200',
        isDragging && 'shadow-lg ring-2 ring-primary opacity-90'
      )}
      onClick={onSelect}
    >
      {/* Header: Drag Handle | Name | Score */}
      <div className="flex items-center gap-2">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <p className="font-semibold text-sm text-gray-900 truncate flex-1">{candidate.name}</p>
        <span className={cn('status-badge text-[10px] flex-shrink-0', getScoreClass(score))}>
          {candidate.qualificationScore != null ? `${candidate.qualificationScore}` : `${candidate.matchScore}%`}
        </span>
      </div>

      {/* Green Stage Age Bar */}
      {stageAge.ageText && (
        <div className="mt-2 bg-green-50 border border-green-200 text-green-700 rounded-md px-3 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{stageAge.ageText}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="font-medium">{stageAge.dateText}</span>
          </div>
        </div>
      )}

      {/* Tech / Offer Status Pills */}
      {isInTechInterview && (
        <div className={cn(
          'mt-2 w-full rounded-md px-3 py-1.5 text-xs font-medium border flex items-center',
          candidate.techInterviewResult === 'pass'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
            : candidate.techInterviewResult === 'fail'
            ? 'bg-red-50 text-red-700 border-red-300'
            : 'bg-gray-50 text-gray-600 border-gray-300'
        )}>
          Tech: {candidate.techInterviewResult 
            ? candidate.techInterviewResult.charAt(0).toUpperCase() + candidate.techInterviewResult.slice(1)
            : 'Pending'}
        </div>
      )}
      {isInOffer && (
        <div className={cn(
          'mt-2 w-full rounded-md px-3 py-1.5 text-xs font-medium border flex items-center',
          candidate.offerStatus === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
          candidate.offerStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-300' :
          candidate.offerStatus === 'withdrawn' ? 'bg-amber-50 text-amber-700 border-amber-300' :
          'bg-gray-50 text-gray-600 border-gray-300'
        )}>
          Offer: {candidate.offerStatus 
            ? candidate.offerStatus.charAt(0).toUpperCase() + candidate.offerStatus.slice(1)
            : 'Pending'}
        </div>
      )}

      {/* Footer: Tags + Actions */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        {/* Left: Internal/External tag */}
        <div>
          {isInternal && (
            <div className="inline-flex items-center gap-1 text-green-600 font-bold text-xs">
              <img src={existLogo} alt="Internal" className="w-3.5 h-3.5 object-contain" />
              Internal
            </div>
          )}
        </div>

        {/* Right: 3 action icons */}
        <div className="flex items-center gap-3">
          <button
            title="Timeline History"
            aria-label="View timeline history"
            className="p-1 rounded hover:bg-muted transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowTimeline(!showTimeline); }}
          >
            <Clock className="w-5 h-5 text-gray-500" />
          </button>
          <button
            title="Send Email"
            aria-label="Send email to candidate"
            className="p-1 rounded hover:bg-muted transition-colors"
            onClick={onEmail}
          >
            <Mail className="w-5 h-5 text-gray-500" />
          </button>
          <button
            title="Delete Candidate"
            aria-label="Delete candidate"
            className="p-1 rounded hover:bg-red-50 transition-colors"
            onClick={onDelete}
          >
            <Trash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* Timeline expandable section */}
      {showTimeline && candidate.applicationId && (
        <div className="mt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
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
          isOver ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-1' : 'border-slate-300 bg-slate-100'
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

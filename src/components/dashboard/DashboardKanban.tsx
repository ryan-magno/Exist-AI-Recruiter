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
import { GripVertical, Mail, MessageSquare, Trash2, Clock, Calendar, History, Tag, UserPlus, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Candidate, PipelineStatus, pipelineStatusLabels, techInterviewLabels, techInterviewColors, TechInterviewResult } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { CandidateProfileView } from '@/components/candidate/CandidateProfileView';
import { EmailModal } from '@/components/modals/EmailModal';
import { CandidateTimeline } from './CandidateTimeline';
import { cn } from '@/lib/utils';

interface DashboardKanbanProps {
  candidates: Candidate[];
}

// Offer status types
type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | '';

const offerStatusLabels: Record<OfferStatus, string> = {
  '': 'Not Set',
  'pending': 'Pending',
  'accepted': 'Accepted',
  'rejected': 'Rejected',
  'withdrawn': 'Withdrawn',
  'expired': 'Expired'
};

const offerStatusColors: Record<OfferStatus, string> = {
  '': 'bg-slate-100 text-slate-600 border-slate-300',
  'pending': 'bg-amber-100 text-amber-700 border-amber-300',
  'accepted': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'rejected': 'bg-red-100 text-red-700 border-red-300',
  'withdrawn': 'bg-blue-100 text-blue-700 border-blue-300',
  'expired': 'bg-slate-100 text-slate-600 border-slate-300'
};

// Define visible columns for dashboard (including rejected)
const columns: { id: PipelineStatus; title: string }[] = [
  { id: 'hr_interview', title: 'For HR Interview' },
  { id: 'tech_interview', title: 'For Tech Interview' },
  { id: 'offer', title: 'Offer' },
  { id: 'hired', title: 'Hired' },
  { id: 'rejected', title: 'Rejected' },
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
  onToggleTimeline: (id: string) => void;
  onOfferStatusChange: (candidate: Candidate, remarks: string) => void;
  showTimeline: boolean;
}

function KanbanCard({ 
  candidate, 
  isDragging, 
  onOpenProfile, 
  onOpenNotes, 
  onEmail, 
  onDelete,
  onTechInterviewChange,
  onToggleTimeline,
  onOfferStatusChange,
  showTimeline
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingState } = useDraggable({
    id: candidate.id,
  });
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerRemarks, setOfferRemarks] = useState('');
  const [selectedOfferStatus, setSelectedOfferStatus] = useState<OfferStatus>('');

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
  const showTechInterview = candidate.pipelineStatus !== 'hr_interview';
  const isOfferStage = candidate.pipelineStatus === 'offer';
  const isHiredStage = candidate.pipelineStatus === 'hired';
  const isInternal = candidate.applicantType === 'internal';

  // Get offer status from candidate (simulated)
  const currentOfferStatus: OfferStatus = (candidate as any).offerStatus || '';

  const handleOfferStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOfferDialog(true);
  };

  const handleOfferSubmit = () => {
    onOfferStatusChange(candidate, offerRemarks);
    setShowOfferDialog(false);
    setOfferRemarks('');
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-card border rounded-lg cursor-pointer hover:shadow-md transition-all',
          isDragging && 'shadow-lg ring-2 ring-primary opacity-90'
        )}
      >
        <div className="p-3" onClick={() => onOpenProfile(candidate)}>
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
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {candidate.name}
                  </p>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold border shrink-0', getScoreClass(candidate.matchScore))}>
                  {candidate.matchScore}%
                </span>
              </div>
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

          {/* Tech Interview Result - Display only (read-only badge), not editable */}
          {showTechInterview && !isOfferStage && !isHiredStage && candidate.techInterviewResult !== 'pending' && (
            <div className="mb-2">
              <span className={cn('inline-flex items-center px-2 py-1 rounded text-xs font-medium border', techInterviewColors[candidate.techInterviewResult])}>
                Tech: {techInterviewLabels[candidate.techInterviewResult]}
              </span>
            </div>
          )}

          {/* Offer Status - only show in offer stage */}
          {isOfferStage && (
            <div className="mb-2" onClick={(e) => e.stopPropagation()}>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide">
                Offer Status
              </label>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-7 text-xs w-full justify-between", currentOfferStatus && offerStatusColors[currentOfferStatus])}
                onClick={handleOfferStatusClick}
              >
                <span className="flex items-center gap-1">
                  <FileCheck className="w-3 h-3" />
                  {offerStatusLabels[currentOfferStatus] || 'Set Status'}
                </span>
              </Button>
            </div>
          )}

          {/* HRIS Button - only show in hired stage */}
          {isHiredStage && (
            <div className="mb-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full gap-1.5 bg-primary/5 border-primary/30 text-primary hover:bg-primary/10"
              >
                <UserPlus className="w-3 h-3" />
                Add to HRIS
              </Button>
            </div>
          )}

          {/* Actions Row with Internal Badge */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t" onClick={(e) => e.stopPropagation()}>
            {/* Internal/External Badge */}
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-0.5',
              isInternal 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-slate-100 text-slate-600 border-slate-300'
            )}>
              <Tag className="w-2.5 h-2.5" />
              {isInternal ? 'Internal' : 'External'}
            </span>
            
            <div className="flex items-center gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className={cn("h-7 w-7", showTimeline && "bg-primary/10 text-primary")} 
                onClick={() => onToggleTimeline(candidate.id)} 
                title="View timeline"
              >
                <History className="w-3.5 h-3.5" />
              </Button>
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
        </div>

        {/* Timeline Section - Expandable */}
        {showTimeline && (
          <div className="border-t bg-muted/30">
            <CandidateTimeline 
              applicationId={(candidate as any).applicationId || candidate.id} 
              appliedDate={candidate.appliedDate} 
            />
          </div>
        )}
      </div>

      {/* Offer Status Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Update Offer Status</DialogTitle>
            <DialogDescription>
              Select the offer status for {candidate.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={selectedOfferStatus}
                onValueChange={(val) => setSelectedOfferStatus(val as OfferStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(offerStatusLabels).filter(([k]) => k !== '').map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks (optional)</label>
              <Input
                placeholder="Add remarks..."
                value={offerRemarks}
                onChange={(e) => setOfferRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferDialog(false)}>Cancel</Button>
            <Button onClick={handleOfferSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
  onToggleTimeline: (id: string) => void;
  onOfferStatusChange: (candidate: Candidate, remarks: string) => void;
  expandedTimelineId: string | null;
}

function KanbanColumn({ id, title, candidates, onOpenProfile, onOpenNotes, onEmail, onDelete, onTechInterviewChange, onToggleTimeline, onOfferStatusChange, expandedTimelineId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-64">
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
              onToggleTimeline={onToggleTimeline}
              onOfferStatusChange={onOfferStatusChange}
              showTimeline={expandedTimelineId === candidate.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Main Dashboard Kanban Component
export function DashboardKanban({ candidates }: DashboardKanbanProps) {
  const { updateCandidatePipelineStatus, updateCandidateTechInterviewResult, deleteCandidate, selectedJoId } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  // Close candidate profile when job order selection changes
  useEffect(() => {
    setSelectedCandidate(null);
  }, [selectedJoId]);

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
    setSelectedCandidate(candidate);
  };

  const handleOpenNotes = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleToggleTimeline = (candidateId: string) => {
    setExpandedTimelineId(prev => prev === candidateId ? null : candidateId);
  };

  const handleOfferStatusChange = (candidate: Candidate, remarks: string) => {
    // This would update the candidate's offer status
    console.log('Offer status change:', candidate.id, remarks);
  };

  // Close profile when needed
  const handleBackFromProfile = () => {
    setSelectedCandidate(null);
  };

  const activeCandidate = candidates.find(c => c.id === activeId);

  const getCandidatesForColumn = (status: PipelineStatus) => {
    return candidates
      .filter(c => c.pipelineStatus === status)
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  // If a candidate is selected, show the full-page profile view
  if (selectedCandidate) {
    return (
      <CandidateProfileView 
        candidate={selectedCandidate} 
        onBack={handleBackFromProfile} 
      />
    );
  }

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
              onToggleTimeline={handleToggleTimeline}
              onOfferStatusChange={handleOfferStatusChange}
              expandedTimelineId={expandedTimelineId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCandidate ? (
            <div className="bg-card border rounded-lg p-3 shadow-lg ring-2 ring-primary opacity-90 w-64">
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
      
      <EmailModal
        open={!!emailCandidate}
        onClose={() => setEmailCandidate(null)}
        candidate={emailCandidate}
      />
    </>
  );
}

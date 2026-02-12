import { useState, useMemo, Fragment } from 'react';
import { Mail, Phone, Briefcase, ChevronDown, ChevronUp, Clock, XCircle, Trash2 } from 'lucide-react';
import { Candidate, PipelineStatus, pipelineStatusLabels } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { EmailModal } from '@/components/modals/EmailModal';
import { CandidateTimeline } from '@/components/dashboard/CandidateTimeline';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import existLogo from '@/assets/exist-logo.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DashboardTableViewProps {
  candidates: Candidate[];
  onSelectCandidate?: (candidate: Candidate) => void;
}

const STATUS_ORDER: PipelineStatus[] = ['hr_interview', 'tech_interview', 'offer', 'hired', 'rejected'];

const STATUS_ICONS: Record<string, { color: string; bg: string }> = {
  hr_interview: { color: 'text-blue-600', bg: 'bg-blue-100' },
  tech_interview: { color: 'text-purple-600', bg: 'bg-purple-100' },
  offer: { color: 'text-emerald-600', bg: 'bg-emerald-100' },
  hired: { color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { color: 'text-red-600', bg: 'bg-red-100' },
  other: { color: 'text-gray-600', bg: 'bg-gray-100' },
};

// ── Helpers ──

function getStageAge(statusChangedDate: string): { ageText: string; dateText: string; days: number } {
  if (!statusChangedDate) return { ageText: '', dateText: '', days: 0 };
  const changed = new Date(statusChangedDate);
  if (isNaN(changed.getTime())) return { ageText: '', dateText: '', days: 0 };
  const now = new Date();
  const diffMs = now.getTime() - changed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const dateLabel = changed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const ageText = diffDays === 0 ? 'Moved today' : diffDays === 1 ? 'Since yesterday' : `${diffDays}d ago`;
  return { ageText, dateText: `Since ${dateLabel}`, days: diffDays };
}

function getAgeColors(days: number) {
  if (days <= 5) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
  if (days <= 10) return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' };
  return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' };
}

function getScoreStyle(score: number) {
  if (score >= 75) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

function formatStartDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return dateStr;
  }
}

// ── Component ──

export function DashboardTableView({ candidates, onSelectCandidate }: DashboardTableViewProps) {
  const { deleteCandidate, updateCandidatePipelineStatus } = useApp();
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);
  const [rejectCandidate, setRejectCandidate] = useState<Candidate | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [timelineCandidateId, setTimelineCandidateId] = useState<string | null>(null);

  const toggleSection = (status: string) => {
    setExpandedSections(prev => ({ ...prev, [status]: prev[status] === undefined ? false : !prev[status] }));
  };

  const groupedCandidates = useMemo(() => {
    const sortWithinGroup = (list: Candidate[]) =>
      [...list].sort((a, b) => {
        if (a.applicantType === 'internal' && b.applicantType !== 'internal') return -1;
        if (a.applicantType !== 'internal' && b.applicantType === 'internal') return 1;
        return (b.qualificationScore ?? b.matchScore) - (a.qualificationScore ?? a.matchScore);
      });

    const groups = STATUS_ORDER.map(status => ({
      status,
      label: pipelineStatusLabels[status] || status,
      candidates: sortWithinGroup(candidates.filter(c => c.pipelineStatus === status)),
    }));

    const otherCandidates = candidates.filter(c => !STATUS_ORDER.includes(c.pipelineStatus));
    if (otherCandidates.length > 0) {
      groups.push({ status: 'other' as PipelineStatus, label: 'Other', candidates: sortWithinGroup(otherCandidates) });
    }

    return groups.filter(g => g.candidates.length > 0);
  }, [candidates]);

  return (
    <>
      <div className="space-y-4">
        {groupedCandidates.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm px-6 py-12 text-center text-muted-foreground text-sm">
            No candidates found matching your criteria.
          </div>
        ) : (
          groupedCandidates.map(group => {
            const isExpanded = expandedSections[group.status] ?? true;
            const statusStyle = STATUS_ICONS[group.status] || STATUS_ICONS.other;

            return (
              <div key={group.status} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(group.status)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', statusStyle.bg)}>
                      <span className={cn('text-xs font-bold', statusStyle.color)}>{group.candidates.length}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                    <span className="text-xs text-muted-foreground">
                      {group.candidates.length} candidate{group.candidates.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {/* Table */}
                {isExpanded && (
                  <div className="border-t overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          <th className="px-2 py-2 w-11 text-center">Score</th>
                          <th className="px-2 py-2 w-[28%]">Candidate</th>
                          <th className="px-2 py-2 w-[24%]">Experience</th>
                          <th className="px-2 py-2 w-[10%] text-center">Salary</th>
                          <th className="px-2 py-2 w-[10%] text-center">Start</th>
                          <th className="px-2 py-2 w-[10%] text-center">Aging</th>
                          <th className="px-2 py-2 w-[100px] text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {group.candidates.map(candidate => {
                          const score = candidate.qualificationScore ?? candidate.matchScore;
                          const stageAge = getStageAge(candidate.statusChangedDate);
                          const ageColors = stageAge.days > 0 ? getAgeColors(stageAge.days) : null;
                          const isInternal = candidate.applicantType === 'internal';

                          return (
                            <Fragment key={candidate.id}>
                              <tr
                                className={cn('hover:bg-muted/30 transition-colors cursor-pointer group/row', isInternal && 'bg-green-50/30')}
                                onClick={() => onSelectCandidate?.(candidate)}
                              >
                                {/* Score */}
                                <td className="px-2 py-2 align-middle text-center">
                                  <div className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border shadow-sm', getScoreStyle(score))}>
                                    {score}
                                  </div>
                                </td>

                                {/* Candidate Details */}
                                <td className="px-2 py-2 align-top">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold text-xs text-foreground truncate">{candidate.name}</span>
                                      {isInternal && (
                                        <span className="inline-flex items-center gap-0.5 text-green-600 font-bold text-[9px] shrink-0">
                                          <img src={existLogo} alt="Internal" className="w-2.5 h-2.5 object-contain" />
                                          INT
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{candidate.email}</div>
                                    {candidate.phone && (
                                      <button
                                        className="text-[11px] text-muted-foreground hover:text-primary transition-colors mt-0.5"
                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(candidate.phone); toast.success('Phone copied'); }}
                                        title="Click to copy"
                                      >
                                        <Phone className="w-3 h-3 inline mr-0.5" />{candidate.phone}
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Experience */}
                                <td className="px-2 py-2 align-top">
                                  <div className="flex flex-col gap-0">
                                    <span className="text-xs font-medium text-foreground line-clamp-1" title={candidate.currentPosition}>
                                      {candidate.currentPosition || '-'}
                                    </span>
                                    {candidate.currentCompany && (
                                      <span className="text-[11px] text-muted-foreground line-clamp-1" title={candidate.currentCompany}>
                                        @ {candidate.currentCompany}
                                      </span>
                                    )}
                                    {candidate.experience && (
                                      <span className="inline-flex mt-0.5 items-center px-1.5 py-0 rounded border border-border bg-background text-muted-foreground text-[10px] font-medium w-fit">
                                        <Briefcase className="w-2.5 h-2.5 mr-0.5" />
                                        {candidate.experience}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Expected Salary */}
                                <td className="px-2 py-2 align-middle text-center">
                                  <span className="text-xs font-medium text-foreground">
                                    {candidate.expectedSalary || '-'}
                                  </span>
                                </td>

                                {/* Start Date */}
                                <td className="px-2 py-2 align-middle text-center">
                                  <span className="text-xs text-foreground">
                                    {candidate.earliestStartDate ? formatStartDate(candidate.earliestStartDate) : '-'}
                                  </span>
                                </td>

                                {/* Aging */}
                                <td className="px-2 py-2 align-middle text-center">
                                  {stageAge.ageText && ageColors ? (
                                    <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium', ageColors.bg, ageColors.border, ageColors.text)}>
                                      <Clock className="w-3 h-3" />
                                      <span>{stageAge.ageText}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-2 py-2 align-middle text-center" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      title="Timeline"
                                      className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                      onClick={() => setTimelineCandidateId(prev => prev === candidate.id ? null : candidate.id)}
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      title="Email"
                                      className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                      onClick={() => setEmailCandidate(candidate)}
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </button>
                                    {candidate.pipelineStatus !== 'rejected' && candidate.pipelineStatus !== 'hired' && (
                                      <button
                                        title="Reject"
                                        className="p-1 rounded-full hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
                                        onClick={() => setRejectCandidate(candidate)}
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      title="Delete"
                                      className="p-1 rounded-full hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
                                      onClick={() => {
                                        if (confirm(`Delete candidate "${candidate.name}"?`)) {
                                          deleteCandidate(candidate.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Timeline Expandable Row — horizontal layout */}
                              {timelineCandidateId === candidate.id && candidate.applicationId && (
                                <tr key={`timeline-${candidate.id}`} className="bg-muted/20">
                                  <td colSpan={7} className="px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                        Timeline — {candidate.name}
                                      </span>
                                      <button
                                        className="text-[10px] text-muted-foreground hover:text-foreground"
                                        onClick={() => setTimelineCandidateId(null)}
                                      >
                                        Close
                                      </button>
                                    </div>
                                    <CandidateTimeline applicationId={candidate.applicationId} appliedDate={candidate.appliedDate} horizontal />
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Email Modal */}
      <EmailModal open={!!emailCandidate} onClose={() => setEmailCandidate(null)} candidate={emailCandidate} />

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectCandidate} onOpenChange={(open) => { if (!open) setRejectCandidate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <AlertDialogTitle>Reject Candidate?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to reject <strong>{rejectCandidate?.name}</strong>? They will be moved to the rejected column.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rejectCandidate) updateCandidatePipelineStatus(rejectCandidate.id, 'rejected');
                setRejectCandidate(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

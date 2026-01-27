import { History, Calendar, Briefcase, Building, FileText, Clock } from 'lucide-react';
import { Candidate, pipelineStatusLabels, pipelineStatusColors } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface ApplicationHistoryTabProps {
  candidate: Candidate;
}

export function ApplicationHistoryTab({ candidate }: ApplicationHistoryTabProps) {
  const history = candidate.applicationHistory || [];
  
  const getOutcomeStyle = (outcome: string) => {
    switch (outcome) {
      case 'hired':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'withdrawn':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Previous Applications</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          This is the candidate's first application to the company.
        </p>
        <div className="mt-4 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium border border-emerald-200">
          First-time Applicant
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 text-slate-700 mb-2">
          <History className="w-5 h-5" />
          <h4 className="font-semibold">Application History</h4>
          <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full ml-auto">
            {history.length} previous application{history.length > 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          This candidate has applied to the company before. Review their previous applications below.
        </p>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((entry) => (
          <div 
            key={entry.id} 
            className="bg-card rounded-xl border shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      {entry.joNumber}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-semibold border capitalize',
                      getOutcomeStyle(entry.outcome)
                    )}>
                      {entry.outcome}
                    </span>
                  </div>
                  <h5 className="font-semibold text-foreground">{entry.position}</h5>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Applied {formatDate(entry.appliedDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{entry.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">{formatDate(entry.statusDate)}</span>
                </div>
              </div>

              {/* Farthest Status */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-medium text-slate-600">Farthest Status Reached</span>
                </div>
                <div className={cn(
                  'inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border',
                  pipelineStatusColors[entry.farthestStatus]
                )}>
                  {pipelineStatusLabels[entry.farthestStatus]}
                </div>
              </div>

              {/* Notes */}
              {entry.notes && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Notes</span>
                  </div>
                  <p className="text-sm text-slate-700">{entry.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

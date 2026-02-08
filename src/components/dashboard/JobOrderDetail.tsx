import { useState } from 'react';
import { Calendar, Briefcase, Edit, XCircle, Sparkles, RefreshCw, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Building, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { JobOrder, joStatusLabels, levelLabels, employmentTypeLabels } from '@/data/mockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
import { useNavigate } from 'react-router-dom';
import { EditJobOrderModal } from '@/components/modals/EditJobOrderModal';
import { RichTextContent } from '@/components/ui/RichTextEditor';

interface JobOrderDetailProps {
  jobOrder: JobOrder;
  matchCount: number;
}

export function JobOrderDetail({ jobOrder, matchCount }: JobOrderDetailProps) {
  const navigate = useNavigate();
  const { updateJobOrderStatus, updateJobOrder, isFindingMatches, setIsFindingMatches, setSelectedJoId, markJoAsFulfilled } = useApp();
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showFulfilledDialog, setShowFulfilledDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getAgingDays = (createdDate: string): number => {
    const created = new Date(createdDate);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAgingColor = (days: number): string => {
    if (days <= 7) return 'text-emerald-600';
    if (days <= 14) return 'text-amber-600';
    if (days <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleClose = () => {
    updateJobOrderStatus(jobOrder.id, 'closed');
    setShowCloseDialog(false);
    setSelectedJoId(null);
    toast.success(`${jobOrder.title} closed and moved to archive`);
    setTimeout(() => navigate('/archive'), 2000);
  };

  const handleMarkFulfilled = () => {
    markJoAsFulfilled(jobOrder.id);
    setShowFulfilledDialog(false);
    setSelectedJoId(null);
    setTimeout(() => navigate('/archive'), 2000);
  };

  const handleFindBestMatch = async () => {
    setIsFindingMatches(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsFindingMatches(false);
    toast.success('Best matches updated based on latest AI analysis');
  };

  // Check if description is long (more than 150 chars of text content)
  const plainTextDescription = jobOrder.description.replace(/<[^>]*>/g, '');
  const isLongDescription = plainTextDescription.length > 150;

  const agingDays = getAgingDays(jobOrder.createdDate);

  return (
    <>
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">
                {jobOrder.joNumber}
              </span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border',
                jobOrder.status === 'open' && 'bg-sky-100 text-sky-700 border-sky-300',
                jobOrder.status === 'pooling' && 'bg-emerald-100 text-emerald-700 border-emerald-300',
                jobOrder.status === 'on_hold' && 'bg-amber-100 text-amber-600 border-amber-300',
                jobOrder.status === 'archived' && 'bg-slate-100 text-slate-600 border-slate-300',
                jobOrder.status === 'closed' && 'bg-slate-100 text-slate-500 border-slate-300'
              )}>
                {joStatusLabels[jobOrder.status]}
              </span>
              <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {jobOrder.hiredCount}/{jobOrder.quantity} Filled
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2 truncate">
              {jobOrder.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                <span>{jobOrder.department}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>{levelLabels[jobOrder.level]}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded">{employmentTypeLabels[jobOrder.employmentType]}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Required by {formatDate(jobOrder.requiredDate)}</span>
              </div>
              {jobOrder.requestorName && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>Requested by {jobOrder.requestorName}</span>
                </div>
              )}
            </div>
            
            {/* Created Date and Aging */}
            <div className="flex items-center gap-4 text-sm mt-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(jobOrder.createdDate)}</span>
              </div>
              <div className={cn('flex items-center gap-1 font-medium', getAgingColor(agingDays))}>
                <Clock className="w-4 h-4" />
                <span>{agingDays} days open</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="default" 
              size="sm" 
              className="gap-1.5"
              onClick={handleFindBestMatch}
              disabled={isFindingMatches}
            >
              {isFindingMatches ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Re-ranking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Find Best Match
                </>
              )}
            </Button>
            {jobOrder.hiredCount >= jobOrder.quantity && jobOrder.status !== 'closed' && jobOrder.status !== 'archived' && (
              <Button 
                variant="default" 
                size="sm" 
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowFulfilledDialog(true)}
              >
                <CheckCircle className="w-4 h-4" />
                Mark Fulfilled
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowCloseDialog(true)}
            >
              <XCircle className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>

        {/* Job Description Container */}
        <div className="mt-3 bg-muted/30 rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Job Description</p>
          {isLongDescription ? (
            <>
              {isExpanded ? (
                <div className="max-h-64 overflow-y-auto pr-2">
                  <RichTextContent 
                    content={jobOrder.description} 
                    className="text-sm text-foreground leading-relaxed"
                  />
                </div>
              ) : (
                <div className="overflow-hidden max-h-16">
                  <RichTextContent 
                    content={jobOrder.description} 
                    className="text-sm text-foreground leading-relaxed"
                  />
                </div>
              )}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-primary font-medium flex items-center gap-1 mt-2 hover:underline"
              >
                {isExpanded ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>See more <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            </>
          ) : (
            <RichTextContent 
              content={jobOrder.description} 
              className="text-sm text-foreground leading-relaxed"
            />
          )}
        </div>
      </div>

      {/* Close JO Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <AlertDialogTitle>Close Job Order?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to close "<strong>{jobOrder.title}</strong>"? This will move it to the archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Close JO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fulfilled Dialog */}
      <AlertDialog open={showFulfilledDialog} onOpenChange={setShowFulfilledDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <AlertDialogTitle>Mark as Fulfilled?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              All {jobOrder.quantity} position(s) for "<strong>{jobOrder.title}</strong>" have been filled. Would you like to close this JO and move it to the archive?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkFulfilled} className="bg-emerald-600 hover:bg-emerald-700">
              Close & Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit JO Modal */}
      <EditJobOrderModal
        jobOrder={jobOrder}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(updates) => updateJobOrder(jobOrder.id, updates)}
      />
    </>
  );
}

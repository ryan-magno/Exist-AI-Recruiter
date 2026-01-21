import { useState } from 'react';
import { Calendar, Briefcase, Edit, XCircle, Sparkles, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { JobOrder, joStatusLabels } from '@/data/mockData';
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

interface JobOrderDetailProps {
  jobOrder: JobOrder;
  matchCount: number;
}

export function JobOrderDetail({ jobOrder, matchCount }: JobOrderDetailProps) {
  const navigate = useNavigate();
  const { updateJobOrderStatus, isFindingMatches, setIsFindingMatches, setSelectedJoId } = useApp();
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const handleClose = () => {
    updateJobOrderStatus(jobOrder.id, 'closed');
    setShowCloseDialog(false);
    setSelectedJoId(null);
    toast.success(`${jobOrder.title} closed and moved to archive`);
    
    // Optional: Navigate to archive after a delay
    setTimeout(() => {
      navigate('/archive');
    }, 2000);
  };

  const handleFindBestMatch = async () => {
    setIsFindingMatches(true);
    // Simulate AI re-ranking
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsFindingMatches(false);
    toast.success('Best matches updated based on latest AI analysis');
  };

  return (
    <>
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {jobOrder.joNumber}
              </span>
              <span className={cn(
                'status-badge uppercase text-[11px] font-semibold tracking-wide',
                jobOrder.status === 'in-progress' && 'bg-blue-100 text-blue-700',
                jobOrder.status === 'fulfilled' && 'bg-primary text-primary-foreground',
                jobOrder.status === 'draft' && 'bg-muted text-muted-foreground',
                jobOrder.status === 'closed' && 'bg-gray-100 text-gray-600'
              )}>
                {joStatusLabels[jobOrder.status]}
              </span>
              {jobOrder.hiredCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  Hired: {jobOrder.hiredCount}/{jobOrder.quantity}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {jobOrder.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>{jobOrder.level}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Required by {new Date(jobOrder.requiredDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit className="w-4 h-4" />
              Edit JO
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowCloseDialog(true)}
            >
              <XCircle className="w-4 h-4" />
              Close JO
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          {jobOrder.description}
        </p>
      </div>

      {/* Close JO Confirmation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <AlertDialogTitle>Close Job Order?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              Are you sure you want to close "<strong>{jobOrder.title}</strong>"? This will move it to the archive and stop active recruitment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Close JO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { Calendar, Briefcase, Edit, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { JobOrder, joStatusLabels } from '@/data/mockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface JobOrderDetailProps {
  jobOrder: JobOrder;
  matchCount: number;
}

export function JobOrderDetail({ jobOrder, matchCount }: JobOrderDetailProps) {
  const { updateJobOrderStatus } = useApp();

  const handleClose = () => {
    updateJobOrderStatus(jobOrder.id, 'closed');
    toast.success('Job Order closed', {
      description: `${jobOrder.joNumber} has been moved to archive.`
    });
  };

  return (
    <div className="p-6 border-b border-border bg-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {jobOrder.joNumber}
            </span>
            <span className={cn(
              'status-badge',
              jobOrder.status === 'in-progress' && 'bg-primary/10 text-primary',
              jobOrder.status === 'job-offer' && 'bg-warning/10 text-warning',
              jobOrder.status === 'draft' && 'bg-muted text-muted-foreground'
            )}>
              {joStatusLabels[jobOrder.status]}
            </span>
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
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit className="w-4 h-4" />
            Edit JO
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={handleClose}
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
  );
}

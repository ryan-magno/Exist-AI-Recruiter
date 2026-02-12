import { motion } from 'framer-motion';
import { Users, Calendar, Clock, AlertCircle, Zap, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { JobOrder } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface JobOrderListProps {
  jobOrders: JobOrder[];
}

interface SmartAction {
  label: string;
  priority: 'critical' | 'high' | 'tech' | 'closing';
  icon: typeof AlertCircle;
}

export function JobOrderList({ jobOrders }: JobOrderListProps) {
  const { selectedJoId, setSelectedJoId, getMatchesForJo } = useApp();

  const getAgingDays = (createdDate: string): number => {
    if (!createdDate) return 0;
    const created = new Date(createdDate);
    if (isNaN(created.getTime())) return 0;
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

  // Get smart actions for a job order
  const getSmartActions = (joId: string): SmartAction[] => {
    const matches = getMatchesForJo(joId);
    const actions: SmartAction[] = [];

    // Count candidates in each stage
    const forHrCount = matches.filter(c => c.pipelineStatus === 'hr_interview').length;
    const forTechCount = matches.filter(c => c.pipelineStatus === 'tech_interview').length;
    const offerCount = matches.filter(c => c.pipelineStatus === 'offer').length;
    const totalActive = matches.filter(c => !['rejected', 'hired'].includes(c.pipelineStatus)).length;

    // Priority order: Critical (red) > High (orange) > Tech (violet) > Closing (green)
    
    // If pipeline is empty -> "Source Candidates" (Red - Critical)
    if (totalActive === 0) {
      actions.push({
        label: 'Source Candidates',
        priority: 'critical',
        icon: AlertCircle
      });
    }

    // If there are new applicants -> "N for HR Interview" (Orange - High Priority)
    if (forHrCount > 0) {
      actions.push({
        label: `${forHrCount} for HR Interview${forHrCount > 1 ? 's' : ''}`,
        priority: 'high',
        icon: Zap
      });
    }

    // If candidates are in tech stage -> "N for Tech Interviews" (Violet - Tech)
    if (forTechCount > 0) {
      actions.push({
        label: `${forTechCount} for Tech Interview${forTechCount > 1 ? 's' : ''}`,
        priority: 'tech',
        icon: Zap
      });
    }

    // If candidates are in offer stage -> "Finalize N Offers" (Green - Closing)
    if (offerCount > 0) {
      actions.push({
        label: `Finalize ${offerCount} Offer${offerCount > 1 ? 's' : ''}`,
        priority: 'closing',
        icon: Zap
      });
    }

    // Return max 3 actions (HR, Tech, Offer)
    return actions.slice(0, 3);
  };

  const getActionStyles = (priority: SmartAction['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'tech':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'closing':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getIconColor = (priority: SmartAction['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'tech':
        return 'text-violet-600';
      case 'closing':
        return 'text-emerald-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-3 space-y-2">
        {jobOrders.map((jo, index) => {
          const agingDays = getAgingDays(jo.createdDate);
          const isSelected = selectedJoId === jo.id;
          const smartActions = getSmartActions(jo.id);

          return (
            <motion.div
              key={jo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              onClick={() => setSelectedJoId(jo.id)}
              className={cn(
                'p-3 cursor-pointer rounded-xl border transition-all duration-150',
                isSelected 
                  ? 'bg-primary/5 border-primary shadow-sm' 
                  : 'bg-card border-border hover:border-primary/30 hover:shadow-sm'
              )}
            >
              {/* Header: Title & Hired Count */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                  {jo.title}
                </h3>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md shrink-0">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">
                    {jo.hiredCount}/{jo.quantity}
                  </span>
                </div>
              </div>

              {/* Department */}
              <p className="text-xs text-muted-foreground mb-2">
                {jo.department}
              </p>

              {/* Created Date and Aging */}
              <div className="flex items-center gap-3 text-xs mb-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(jo.createdDate)}</span>
                </div>
                <div className={cn('flex items-center gap-1 font-medium', getAgingColor(agingDays))}>
                  <Clock className="w-3 h-3" />
                  <span>{agingDays}d open</span>
                </div>
              </div>

              {/* Smart Actions */}
              {smartActions.length > 0 && (
                <div className="space-y-1.5">
                  {smartActions.map((action, actionIndex) => {
                    const ActionIcon = action.icon;
                    return (
                      <div
                        key={actionIndex}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium',
                          getActionStyles(action.priority)
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <ActionIcon className={cn('w-3.5 h-3.5', getIconColor(action.priority))} />
                          <span>{action.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No Actions State */}
              {smartActions.length === 0 && (
                <p className="text-xs text-muted-foreground">All actions complete</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
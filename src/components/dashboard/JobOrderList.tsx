import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { JobOrder } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface JobOrderListProps {
  jobOrders: JobOrder[];
}

export function JobOrderList({ jobOrders }: JobOrderListProps) {
  const { selectedJoId, setSelectedJoId, getMatchesForJo } = useApp();

  const getAgingDays = (createdDate: string): number => {
    const created = new Date(createdDate);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAgingLabel = (days: number): string => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return '1 week ago';
    return `${Math.floor(days / 7)} weeks ago`;
  };

  // Get pipeline counts for a job order
  const getPipelineCounts = (joId: string) => {
    const matches = getMatchesForJo(joId);
    const counts = {
      new: 0,
      hrInterview: 0,
      techInterview: 0,
      offer: 0,
      hired: 0
    };

    matches.forEach(candidate => {
      switch (candidate.pipelineStatus) {
        case 'new-match':
          counts.new++;
          break;
        case 'hr-interview':
          counts.hrInterview++;
          break;
        case 'tech-interview':
          counts.techInterview++;
          break;
        case 'offer':
          counts.offer++;
          break;
        case 'hired':
          counts.hired++;
          break;
      }
    });

    return counts;
  };

  return (
    <div className="space-y-2 p-2">
      {jobOrders.map((jo, index) => {
        const agingDays = getAgingDays(jo.createdDate);
        const matches = getMatchesForJo(jo.id);
        const isSelected = selectedJoId === jo.id;
        const pipeline = getPipelineCounts(jo.id);
        const totalActive = matches.filter(c => c.pipelineStatus !== 'rejected' && c.pipelineStatus !== 'hired').length;
        const remaining = jo.quantity - jo.hiredCount;

        // Calculate pipeline bar widths
        const total = pipeline.new + pipeline.hrInterview + pipeline.techInterview + pipeline.offer + pipeline.hired;
        const getWidth = (count: number) => total > 0 ? (count / total) * 100 : 0;

        return (
          <motion.div
            key={jo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => setSelectedJoId(jo.id)}
            className={cn(
              'p-4 cursor-pointer rounded-xl border transition-all duration-150',
              isSelected 
                ? 'bg-primary/5 border-primary shadow-sm' 
                : 'bg-card border-border hover:border-primary/30 hover:shadow-sm'
            )}
          >
            {/* Header: Title & Hired Count */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">
                {jo.title}
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md shrink-0">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {jo.hiredCount}/{jo.quantity}
                </span>
              </div>
            </div>

            {/* Department & Age */}
            <p className="text-xs text-muted-foreground mb-3">
              {jo.department} • {getAgingLabel(agingDays)}
            </p>

            {/* Pipeline Progress Bar */}
            {total > 0 && (
              <>
                <div className="flex h-2 rounded-full overflow-hidden bg-muted mb-2">
                  {pipeline.new > 0 && (
                    <div 
                      className="bg-slate-400 transition-all duration-300" 
                      style={{ width: `${getWidth(pipeline.new)}%` }}
                    />
                  )}
                  {(pipeline.hrInterview + pipeline.techInterview) > 0 && (
                    <div 
                      className="bg-blue-500 transition-all duration-300" 
                      style={{ width: `${getWidth(pipeline.hrInterview + pipeline.techInterview)}%` }}
                    />
                  )}
                  {pipeline.offer > 0 && (
                    <div 
                      className="bg-emerald-500 transition-all duration-300" 
                      style={{ width: `${getWidth(pipeline.offer)}%` }}
                    />
                  )}
                  {pipeline.hired > 0 && (
                    <div 
                      className="bg-emerald-600 transition-all duration-300" 
                      style={{ width: `${getWidth(pipeline.hired)}%` }}
                    />
                  )}
                </div>

                {/* Pipeline Labels */}
                <div className="flex items-center gap-4 text-[10px] mb-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-muted-foreground">New ({pipeline.new})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Active ({pipeline.hrInterview + pipeline.techInterview})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Offer ({pipeline.offer})</span>
                  </div>
                </div>
              </>
            )}

            {/* Footer: Active Candidates */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary font-medium">
                {totalActive} Active Candidate{totalActive !== 1 ? 's' : ''}
              </span>
              {remaining > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {remaining} more needed
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
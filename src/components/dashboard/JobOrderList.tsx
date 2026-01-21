import { motion } from 'framer-motion';
import { Users, Calendar, Clock } from 'lucide-react';
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

  const getAgingColor = (days: number): string => {
    if (days <= 7) return 'text-emerald-600';
    if (days <= 14) return 'text-amber-600';
    if (days <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get pipeline counts for a job order
  const getPipelineCounts = (joId: string) => {
    const matches = getMatchesForJo(joId);
    const counts = {
      forHr: 0,
      forTech: 0,
      offer: 0,
      hired: 0
    };

    matches.forEach(candidate => {
      switch (candidate.pipelineStatus) {
        case 'new-match':
          counts.forHr++;
          break;
        case 'hr-interview':
        case 'tech-interview':
          counts.forTech++;
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
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-2 space-y-2">
        {jobOrders.map((jo, index) => {
          const agingDays = getAgingDays(jo.createdDate);
          const matches = getMatchesForJo(jo.id);
          const isSelected = selectedJoId === jo.id;
          const pipeline = getPipelineCounts(jo.id);

          // Calculate pipeline bar widths
          const total = pipeline.forHr + pipeline.forTech + pipeline.offer + pipeline.hired;
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
                <div className={cn('flex items-center gap-1', getAgingColor(agingDays))}>
                  <Clock className="w-3 h-3" />
                  <span>{agingDays}d open</span>
                </div>
              </div>

              {/* Pipeline Progress Bar */}
              {total > 0 && (
                <>
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted mb-2">
                    {pipeline.forHr > 0 && (
                      <div 
                        className="bg-sky-500 transition-all duration-300" 
                        style={{ width: `${getWidth(pipeline.forHr)}%` }}
                      />
                    )}
                    {pipeline.forTech > 0 && (
                      <div 
                        className="bg-violet-500 transition-all duration-300" 
                        style={{ width: `${getWidth(pipeline.forTech)}%` }}
                      />
                    )}
                    {pipeline.offer > 0 && (
                      <div 
                        className="bg-amber-500 transition-all duration-300" 
                        style={{ width: `${getWidth(pipeline.offer)}%` }}
                      />
                    )}
                    {pipeline.hired > 0 && (
                      <div 
                        className="bg-emerald-500 transition-all duration-300" 
                        style={{ width: `${getWidth(pipeline.hired)}%` }}
                      />
                    )}
                  </div>

                  {/* Pipeline Labels */}
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span className="text-muted-foreground">HR ({pipeline.forHr})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-violet-500" />
                      <span className="text-muted-foreground">Tech ({pipeline.forTech})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Offer ({pipeline.offer})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">Hired ({pipeline.hired})</span>
                    </div>
                  </div>
                </>
              )}

              {/* Footer: Active Candidates */}
              {total === 0 && (
                <p className="text-xs text-muted-foreground">No candidates yet</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

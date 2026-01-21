import { motion } from 'framer-motion';
import { Users, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { JobOrder, joStatusLabels, levelLabels } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface JobOrderListProps {
  jobOrders: JobOrder[];
}

export function JobOrderList({ jobOrders }: JobOrderListProps) {
  const { selectedJoId, setSelectedJoId, getMatchesForJo, isVectorized } = useApp();

  const getAgingDays = (createdDate: string): number => {
    const created = new Date(createdDate);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAgingColor = (days: number): string => {
    if (days < 7) return 'text-emerald-600';
    if (days < 14) return 'text-amber-600';
    return 'text-red-600';
  };

  const getAgingDot = (days: number): string => {
    if (days < 7) return 'bg-emerald-500';
    if (days < 14) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="divide-y divide-border/50">
      {jobOrders.map((jo, index) => {
        const agingDays = getAgingDays(jo.createdDate);
        const matches = getMatchesForJo(jo.id);
        const isSelected = selectedJoId === jo.id;

        return (
          <motion.div
            key={jo.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedJoId(jo.id)}
            className={cn(
              'p-3 cursor-pointer transition-all duration-200',
              isSelected 
                ? 'bg-primary/10 border-l-4 border-l-primary' 
                : 'hover:bg-muted/50 border-l-4 border-l-transparent'
            )}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {jo.joNumber}
                </span>
                <span 
                  className={cn("w-2 h-2 rounded-full", getAgingDot(agingDays))} 
                  title={`Open for ${agingDays} days`}
                />
              </div>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border',
                jo.status === 'in-progress' && 'bg-sky-100 text-sky-700 border-sky-300',
                jo.status === 'fulfilled' && 'bg-emerald-100 text-emerald-700 border-emerald-300',
                jo.status === 'draft' && 'bg-slate-100 text-slate-600 border-slate-300'
              )}>
                {joStatusLabels[jo.status]}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground text-sm mb-1.5 line-clamp-1">
              {jo.title}
            </h3>

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>Qty: {jo.quantity}</span>
              </div>

              <div className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium',
                isVectorized && matches.length > 0 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {isVectorized ? matches.length : 0} Matches
              </div>

              {jo.hiredCount > 0 && (
                <span className="text-[10px] font-medium text-emerald-600">
                  {jo.hiredCount}/{jo.quantity} Hired
                </span>
              )}
            </div>

            {/* Aging & Level */}
            <div className="flex items-center justify-between mt-2">
              <div className={cn('flex items-center gap-1 text-[10px]', getAgingColor(agingDays))}>
                <Clock className="w-3 h-3" />
                <span>Open {agingDays}d</span>
              </div>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-medium">
                {levelLabels[jo.level] || jo.level}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

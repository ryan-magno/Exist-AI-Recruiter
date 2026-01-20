import { motion } from 'framer-motion';
import { Calendar, Users, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { JobOrder, joStatusLabels } from '@/data/mockData';
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
    if (days < 7) return 'text-green-600';
    if (days < 14) return 'text-orange-500';
    return 'text-red-500';
  };

  const getAgingDot = (days: number): string => {
    if (days < 7) return 'bg-green-500';
    if (days < 14) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="divide-y divide-border">
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
              'p-4 cursor-pointer transition-all duration-200',
              isSelected 
                ? 'bg-accent border-l-4 border-l-primary' 
                : 'hover:bg-muted/50 border-l-4 border-l-transparent'
            )}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {jo.joNumber}
                </span>
                {/* Aging Dot Indicator */}
                <span 
                  className={cn("w-2 h-2 rounded-full", getAgingDot(agingDays))} 
                  title={`Open for ${agingDays} days`}
                />
              </div>
              <span className={cn(
                'status-badge',
                jo.status === 'in-progress' && 'bg-primary/10 text-primary',
                jo.status === 'fulfilled' && 'bg-primary text-primary-foreground',
                jo.status === 'draft' && 'bg-muted text-muted-foreground'
              )}>
                {joStatusLabels[jo.status]}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
              {jo.title}
            </h3>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm">
              {/* Quantity */}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>Qty: {jo.quantity}</span>
              </div>

              {/* Matches */}
              <div className={cn(
                'flex items-center gap-1.5',
                isVectorized && matches.length > 0 ? 'text-primary' : 'text-muted-foreground'
              )}>
                <div className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  isVectorized && matches.length > 0 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {isVectorized ? matches.length : 0} Matches
                </div>
              </div>
            </div>

            {/* Aging Indicator */}
            <div className="flex items-center justify-between mt-3">
              <div className={cn('flex items-center gap-1.5 text-xs', getAgingColor(agingDays))}>
                <Clock className="w-3.5 h-3.5" />
                <span>Open for {agingDays} days</span>
              </div>
              <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                {jo.level}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

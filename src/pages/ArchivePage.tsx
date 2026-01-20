import { motion } from 'framer-motion';
import { Archive, FileText, Calendar, Users, CheckCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { joStatusLabels } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function ArchivePage() {
  const { jobOrders } = useApp();

  const archivedOrders = jobOrders.filter(
    jo => jo.status === 'closed' || jo.status === 'fulfilled'
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Archive className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Archived Job Orders
              </h1>
              <p className="text-muted-foreground">
                View closed and fulfilled positions
              </p>
            </div>
          </div>
        </div>

        {/* Archive List */}
        {archivedOrders.length === 0 ? (
          <EmptyArchiveState />
        ) : (
          <div className="space-y-4">
            {archivedOrders.map((jo, index) => (
              <motion.div
                key={jo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl border shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {jo.joNumber}
                        </span>
                        <span className={cn(
                          "status-badge",
                          jo.status === 'fulfilled' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          {jo.status === 'fulfilled' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {joStatusLabels[jo.status]}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {jo.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {jo.description}
                </p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Qty: {jo.quantity}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(jo.createdDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs">
                      {jo.level}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function EmptyArchiveState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
        <Archive className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Archived Orders
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Closed and fulfilled job orders will appear here for your records.
      </p>
    </motion.div>
  );
}

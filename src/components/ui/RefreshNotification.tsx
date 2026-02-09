import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Button } from './button';

interface RefreshNotificationProps {
  show: boolean;
  candidateCount: number;
  onRefresh: () => void;
}

export function RefreshNotification({ 
  show, 
  candidateCount, 
  onRefresh 
}: RefreshNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3">
            <span className="text-sm font-medium">
              {candidateCount} new candidate{candidateCount > 1 ? 's' : ''} ready
            </span>
            <Button
              onClick={onRefresh}
              size="sm"
              variant="secondary"
              className="gap-1.5 h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

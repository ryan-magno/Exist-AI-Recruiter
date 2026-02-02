import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Users } from 'lucide-react';
import { Button } from './button';

interface RefreshNotificationProps {
  show: boolean;
  candidateCount: number;
  onRefresh: () => void;
  onDismiss: () => void;
}

export function RefreshNotification({ 
  show, 
  candidateCount, 
  onRefresh, 
  onDismiss 
}: RefreshNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="bg-primary text-primary-foreground rounded-lg shadow-2xl p-4 pr-10 max-w-sm border border-primary/20">
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-full">
                <Users className="h-5 w-5" />
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-sm">
                  {candidateCount} New Candidate{candidateCount > 1 ? 's' : ''} Added!
                </h4>
                <p className="text-xs text-primary-foreground/80 mt-1">
                  AI processing complete. Refresh to see the new data.
                </p>
                
                <Button
                  onClick={onRefresh}
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Now
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

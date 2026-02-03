import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Cpu } from 'lucide-react';

interface ProcessingIndicatorProps {
  count: number;
}

export function ProcessingIndicator({ count }: ProcessingIndicatorProps) {
  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3">
          <div className="relative">
            <Cpu className="h-5 w-5 text-amber-600" />
            <motion.div
              className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-amber-500 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
            <span className="text-sm font-medium text-amber-800">
              Processing {count} CV{count > 1 ? 's' : ''}...
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

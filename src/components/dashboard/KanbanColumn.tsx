import { motion } from 'framer-motion';
import { Candidate } from '@/data/mockData';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
}

export function KanbanColumn({ id, title, candidates, onCandidateClick }: KanbanColumnProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 w-64"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {candidates.length}
        </span>
      </div>
      
      <div className="kanban-column space-y-3">
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No candidates
          </p>
        ) : (
          candidates.map((candidate) => (
            <KanbanCard
              key={candidate.id}
              candidate={candidate}
              onClick={() => onCandidateClick(candidate)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

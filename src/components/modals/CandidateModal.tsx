import { Candidate } from '@/data/mockData';
import { CandidateProfileView } from '@/components/candidate/CandidateProfileView';
import { cn } from '@/lib/utils';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  initialTab?: string;
}

export function CandidateModal({ candidate, onClose, initialTab = 'profile' }: CandidateModalProps) {
  if (!candidate) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-black/50 transition-opacity",
        candidate ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    >
      <div 
        className="absolute inset-4 bg-background rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CandidateProfileView candidate={candidate} onBack={onClose} />
      </div>
    </div>
  );
}

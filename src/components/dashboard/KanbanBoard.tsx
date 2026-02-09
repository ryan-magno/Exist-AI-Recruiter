import { useState } from 'react';
import { Candidate, PipelineStatus } from '@/data/mockData';
import { KanbanColumn } from './KanbanColumn';
import { CandidateModal } from '@/components/modals/CandidateModal';

interface KanbanBoardProps {
  candidates: Candidate[];
}

const columns: { id: PipelineStatus; title: string }[] = [
  { id: 'hr_interview', title: 'For HR Interview' },
  { id: 'tech_interview', title: 'For Tech Interview' },
  { id: 'offer', title: 'Offer' },
  { id: 'hired', title: 'Hired' },
  { id: 'rejected', title: 'Rejected' },
];

export function KanbanBoard({ candidates }: KanbanBoardProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const getCandidatesForColumn = (status: PipelineStatus) => {
    return candidates.filter(c => c.pipelineStatus === status);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            candidates={getCandidatesForColumn(column.id)}
            onCandidateClick={setSelectedCandidate}
          />
        ))}
      </div>

      <CandidateModal 
        candidate={selectedCandidate} 
        onClose={() => setSelectedCandidate(null)} 
      />
    </>
  );
}

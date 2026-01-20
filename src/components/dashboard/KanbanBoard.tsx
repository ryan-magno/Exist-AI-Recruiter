import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Candidate, statusLabels } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { CandidateModal } from '@/components/modals/CandidateModal';

interface KanbanBoardProps {
  candidates: Candidate[];
}

const columns: { id: Candidate['status']; title: string }[] = [
  { id: 'new', title: 'New Match' },
  { id: 'interview', title: 'Interview' },
  { id: 'offer', title: 'Offer' },
  { id: 'hired', title: 'Hired' },
  { id: 'pooled', title: 'Pooled' },
  { id: 'rejected', title: 'Rejected' },
];

export function KanbanBoard({ candidates }: KanbanBoardProps) {
  const { updateCandidateStatus } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const candidateId = active.id as string;
      const newStatus = over.id as Candidate['status'];
      
      // Check if dropped on a column
      if (columns.some(col => col.id === newStatus)) {
        updateCandidateStatus(candidateId, newStatus);
      }
    }
  };

  const activeCandidate = candidates.find(c => c.id === activeId);

  const getCandidatesForColumn = (status: Candidate['status']) => {
    return candidates.filter(c => c.status === status);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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

        <DragOverlay>
          {activeCandidate ? (
            <KanbanCard candidate={activeCandidate} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CandidateModal 
        candidate={selectedCandidate} 
        onClose={() => setSelectedCandidate(null)} 
      />
    </>
  );
}

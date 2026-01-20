import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Candidate, statusLabels } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { CandidateModal } from '@/components/modals/CandidateModal';
import { cn } from '@/lib/utils';

interface CandidateListViewProps {
  candidates: Candidate[];
}

export function CandidateListView({ candidates }: CandidateListViewProps) {
  const { updateCandidateStatus } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const sortedCandidates = [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  const getScoreClass = (score: number): string => {
    if (score >= 90) return 'match-score-high';
    if (score >= 75) return 'match-score-medium';
    return 'match-score-low';
  };

  return (
    <>
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[100px]">Score</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCandidates.map((candidate, index) => (
              <motion.tr
                key={candidate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedCandidate(candidate)}
              >
                <TableCell>
                  <span className={cn('status-badge font-semibold', getScoreClass(candidate.matchScore))}>
                    {candidate.matchScore}%
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={candidate.status}
                    onValueChange={(value) => updateCandidateStatus(candidate.id, value as Candidate['status'])}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      <CandidateModal 
        candidate={selectedCandidate} 
        onClose={() => setSelectedCandidate(null)} 
      />
    </>
  );
}

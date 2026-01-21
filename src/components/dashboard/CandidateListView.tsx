import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Trash2 } from 'lucide-react';
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
import { Candidate, pipelineStatusLabels, pipelineStatusColors, PipelineStatus, techInterviewLabels, techInterviewColors, TechInterviewResult } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { CandidateModal } from '@/components/modals/CandidateModal';
import { EmailModal } from '@/components/modals/EmailModal';
import { cn } from '@/lib/utils';

interface CandidateListViewProps {
  candidates: Candidate[];
}

export function CandidateListView({ candidates }: CandidateListViewProps) {
  const { updateCandidatePipelineStatus, updateCandidateTechInterviewResult, deleteCandidate } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);
  const [initialTab, setInitialTab] = useState<string>('profile');

  const sortedCandidates = [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  const getScoreClass = (score: number): string => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 75) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const handleOpenNotes = (candidate: Candidate) => {
    setInitialTab('notes');
    setSelectedCandidate(candidate);
  };

  const handleOpenProfile = (candidate: Candidate) => {
    setInitialTab('profile');
    setSelectedCandidate(candidate);
  };

  return (
    <>
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[70px]">Score</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead className="min-w-[160px]">Status</TableHead>
              <TableHead className="min-w-[140px]">Tech Interview</TableHead>
              <TableHead className="w-[110px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCandidates.map((candidate, index) => (
              <motion.tr
                key={candidate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleOpenProfile(candidate)}
              >
                <TableCell>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-bold border', getScoreClass(candidate.matchScore))}>
                    {candidate.matchScore}%
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-foreground">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground">{candidate.email}</p>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={candidate.pipelineStatus}
                    onValueChange={(value) => updateCandidatePipelineStatus(candidate.id, value as PipelineStatus)}
                  >
                    <SelectTrigger className={cn("h-8 text-xs border min-w-[150px]", pipelineStatusColors[candidate.pipelineStatus])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(pipelineStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={candidate.techInterviewResult}
                    onValueChange={(value) => updateCandidateTechInterviewResult(candidate.id, value as TechInterviewResult)}
                  >
                    <SelectTrigger className={cn("h-8 text-xs border", techInterviewColors[candidate.techInterviewResult])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(techInterviewLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEmailCandidate(candidate)}>
                      <Mail className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenNotes(candidate)}>
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteCandidate(candidate.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
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
        initialTab={initialTab}
      />
      
      <EmailModal
        open={!!emailCandidate}
        onClose={() => setEmailCandidate(null)}
        candidate={emailCandidate}
      />
    </>
  );
}

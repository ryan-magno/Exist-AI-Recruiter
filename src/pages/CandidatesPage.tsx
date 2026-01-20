import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { pipelineStatusLabels, pipelineStatusColors, PipelineStatus } from '@/data/mockData';
import { CandidateModal } from '@/components/modals/CandidateModal';
import { EmailModal } from '@/components/modals/EmailModal';
import { cn } from '@/lib/utils';

export default function CandidatesPage() {
  const { getAllCandidates, updateCandidatePipelineStatus, jobOrders, isVectorized } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [emailCandidate, setEmailCandidate] = useState<any>(null);
  
  const candidates = getAllCandidates();

  const getJobTitle = (joId?: string) => {
    if (!joId) return 'Unassigned';
    const jo = jobOrders.find(j => j.id === joId);
    return jo?.title || 'Unknown';
  };

  const getScoreClass = (score: number): string => {
    if (score >= 90) return 'match-score-high';
    if (score >= 75) return 'match-score-medium';
    return 'match-score-low';
  };

  if (!isVectorized) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Candidates</h1>
            <p className="text-muted-foreground">Master list of all applicants</p>
          </div>
        </div>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Upload and vectorize CVs to see candidates here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Candidates</h1>
            <p className="text-muted-foreground">{candidates.length} applicants in system</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px]">Score</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied For</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate, index) => (
                <motion.tr
                  key={candidate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <TableCell>
                    <span className={cn('status-badge font-semibold', getScoreClass(candidate.matchScore))}>
                      {candidate.matchScore}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-foreground">{getJobTitle(candidate.assignedJoId)}</p>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={candidate.pipelineStatus}
                      onValueChange={(value) => updateCandidatePipelineStatus(candidate.id, value as PipelineStatus)}
                    >
                      <SelectTrigger className={cn("h-8 text-xs", pipelineStatusColors[candidate.pipelineStatus])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(pipelineStatusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEmailCandidate(candidate)}>
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedCandidate(candidate)}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      <EmailModal open={!!emailCandidate} onClose={() => setEmailCandidate(null)} candidate={emailCandidate} />
    </div>
  );
}

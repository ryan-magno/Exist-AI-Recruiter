import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Search, X, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { pipelineStatusLabels, pipelineStatusColors, PipelineStatus } from '@/data/mockData';
import { CandidateModal } from '@/components/modals/CandidateModal';
import { EmailModal } from '@/components/modals/EmailModal';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function CandidatesPage() {
  const navigate = useNavigate();
  const { getAllCandidates, updateCandidatePipelineStatus, jobOrders, isVectorized, setSelectedJoId } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [emailCandidate, setEmailCandidate] = useState<any>(null);
  const [initialTab, setInitialTab] = useState('profile');

  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const candidates = getAllCandidates();

  const getDepartment = (joId?: string) => {
    if (!joId) return 'Unassigned';
    return jobOrders.find(j => j.id === joId)?.department || 'Unknown';
  };

  const getJobTitle = (joId?: string) => {
    if (!joId) return 'Unassigned';
    return jobOrders.find(j => j.id === joId)?.title || 'Unknown';
  };

  const filteredCandidates = useMemo(() => {
    const activeJoIds = new Set(
      jobOrders
        .filter(jo => jo.status === 'open' || jo.status === 'pooling' || jo.status === 'on_hold')
        .map(jo => jo.id)
    );

    return candidates
      .filter(candidate => {
        if (!candidate.assignedJoId || !activeJoIds.has(candidate.assignedJoId)) return false;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.positionApplied.toLowerCase().includes(searchLower) ||
          candidate.skills.some((s: string) => s.toLowerCase().includes(searchLower));
        const matchesPipeline = pipelineFilter === 'all' || candidate.pipelineStatus === pipelineFilter;
        const matchesDept = departmentFilter === 'all' || getDepartment(candidate.assignedJoId) === departmentFilter;
        return matchesSearch && matchesPipeline && matchesDept;
      })
      .sort((a, b) => (b.qualificationScore ?? b.matchScore) - (a.qualificationScore ?? a.matchScore));
  }, [candidates, searchQuery, pipelineFilter, departmentFilter, jobOrders]);

  const getScoreStyles = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const handleViewJo = (joId: string) => { setSelectedJoId(joId); navigate('/dashboard'); };
  const handleOpenProfile = (c: any) => { setInitialTab('profile'); setSelectedCandidate(c); };
  const clearFilters = () => { setSearchQuery(''); setPipelineFilter('all'); setDepartmentFilter('all'); };
  const hasActiveFilters = searchQuery || pipelineFilter !== 'all' || departmentFilter !== 'all';
  const uniqueDepartments = [...new Set(jobOrders.map(jo => jo.department))];

  if (!isVectorized) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-6 h-6 text-muted-foreground" />
          <h1>All Candidates</h1>
        </div>
        <div className="text-center py-16 bg-card rounded-lg border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No candidates yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload and vectorize CVs to begin matching</p>
          <Button onClick={() => navigate('/upload')}>Go to Upload</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h1>All Candidates</h1>
          <span className="text-sm text-muted-foreground">• {candidates.length} total</span>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-3 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, position, or skills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
            <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
              <SelectTrigger className="w-[160px] h-8 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(pipelineStatusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[160px] h-8 text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {uniqueDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 text-xs">
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground mt-2">{filteredCandidates.length} of {candidates.length} shown</p>
          )}
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">No candidates found</h3>
              <p className="text-xs text-muted-foreground mb-3">Try adjusting your filters</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[80px] text-center">Score</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Applied For</TableHead>
                  <TableHead className="min-w-[160px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((c) => {
                  const score = c.qualificationScore ?? c.matchScore;
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-secondary/50 transition-colors duration-150"
                      onClick={() => handleOpenProfile(c)}
                    >
                      <TableCell className="text-center">
                        <span className={cn(
                          'inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border',
                          getScoreStyles(score)
                        )}>
                          {score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button className="text-left hover:text-primary transition-colors" onClick={() => c.assignedJoId && handleViewJo(c.assignedJoId)}>
                          <p className="text-sm font-medium text-foreground">{getJobTitle(c.assignedJoId)}</p>
                          <p className="text-xs text-muted-foreground">{getDepartment(c.assignedJoId)}</p>
                        </button>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={c.pipelineStatus} onValueChange={(v) => updateCandidatePipelineStatus(c.id, v as PipelineStatus)}>
                          <SelectTrigger className={cn(
                            "h-7 text-xs",
                            pipelineStatusColors[c.pipelineStatus],
                            c.pipelineStatus === 'hr_interview' && 'bg-blue-50 border-blue-200'
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(pipelineStatusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            title="Send Email"
                            aria-label="Send email"
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary transition-colors"
                            onClick={() => setEmailCandidate(c)}
                          >
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            title="View Profile"
                            aria-label="View profile"
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary transition-colors"
                            onClick={() => handleOpenProfile(c)}
                          >
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {filteredCandidates.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
          </p>
        )}
      </motion.div>

      <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} initialTab={initialTab} />
      <EmailModal open={!!emailCandidate} onClose={() => setEmailCandidate(null)} candidate={emailCandidate} />
    </div>
  );
}

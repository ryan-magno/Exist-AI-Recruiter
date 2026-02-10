import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Search, X, Filter, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import { format, subDays, isAfter, isBefore, parseISO } from 'date-fns';

type SortField = 'score' | 'name' | 'appliedDate' | 'startDate' | 'salary' | 'company';
type SortDir = 'asc' | 'desc';

export default function CandidatesPage() {
  const navigate = useNavigate();
  const { getAllCandidates, deleteCandidate, jobOrders, isVectorized, setSelectedJoId } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [emailCandidate, setEmailCandidate] = useState<any>(null);
  const [initialTab, setInitialTab] = useState('profile');

  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('appliedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const candidates = getAllCandidates();

  const getDepartment = (joId?: string) => {
    if (!joId) return 'Unassigned';
    return jobOrders.find(j => j.id === joId)?.department || 'Unknown';
  };

  const getJobTitle = (joId?: string) => {
    if (!joId) return 'Unassigned';
    return jobOrders.find(j => j.id === joId)?.title || 'Unknown';
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const filteredCandidates = useMemo(() => {
    const activeJoIds = new Set(
      jobOrders
        .filter(jo => jo.status === 'open' || jo.status === 'pooling' || jo.status === 'on_hold')
        .map(jo => jo.id)
    );

    let result = candidates.filter(candidate => {
      if (!candidate.assignedJoId || !activeJoIds.has(candidate.assignedJoId)) return false;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.positionApplied.toLowerCase().includes(searchLower) ||
        candidate.skills.some((s: string) => s.toLowerCase().includes(searchLower)) ||
        (candidate.currentCompany || '').toLowerCase().includes(searchLower);
      const matchesPipeline = pipelineFilter === 'all' || candidate.pipelineStatus === pipelineFilter;
      const matchesDept = departmentFilter === 'all' || getDepartment(candidate.assignedJoId) === departmentFilter;
      const matchesType = typeFilter === 'all' || candidate.applicantType === typeFilter;

      let matchesDate = true;
      if (dateRangeFilter !== 'all' && candidate.appliedDate) {
        try {
          const applied = parseISO(candidate.appliedDate);
          const now = new Date();
          if (dateRangeFilter === '7d') matchesDate = isAfter(applied, subDays(now, 7));
          else if (dateRangeFilter === '30d') matchesDate = isAfter(applied, subDays(now, 30));
          else if (dateRangeFilter === '90d') matchesDate = isAfter(applied, subDays(now, 90));
        } catch { matchesDate = true; }
      }

      return matchesSearch && matchesPipeline && matchesDept && matchesType && matchesDate;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'score': cmp = (a.qualificationScore ?? a.matchScore) - (b.qualificationScore ?? b.matchScore); break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'appliedDate': cmp = (a.appliedDate || '').localeCompare(b.appliedDate || ''); break;
        case 'startDate': cmp = (a.earliestStartDate || '').localeCompare(b.earliestStartDate || ''); break;
        case 'salary': cmp = (a.expectedSalary || '').localeCompare(b.expectedSalary || ''); break;
        case 'company': cmp = (a.currentCompany || '').localeCompare(b.currentCompany || ''); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [candidates, searchQuery, pipelineFilter, departmentFilter, typeFilter, dateRangeFilter, jobOrders, sortField, sortDir]);

  const getScoreStyles = (score: number) => {
    if (score >= 75) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return '-';
    try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d; }
  };

  const handleViewJo = (joId: string) => { setSelectedJoId(joId); navigate('/dashboard'); };
  const handleOpenProfile = (c: any) => { setInitialTab('profile'); setSelectedCandidate(c); };
  const clearFilters = () => { setSearchQuery(''); setPipelineFilter('all'); setDepartmentFilter('all'); setTypeFilter('all'); setDateRangeFilter('all'); };
  const hasActiveFilters = searchQuery || pipelineFilter !== 'all' || departmentFilter !== 'all' || typeFilter !== 'all' || dateRangeFilter !== 'all';
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
        <div className="flex items-center gap-2.5 mb-5">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">All Candidates</h1>
          <span className="text-sm text-muted-foreground font-medium">• {filteredCandidates.length} of {candidates.length}</span>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-3 mb-4">
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search name, position, skills, company..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
              <SelectTrigger className="w-[145px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(pipelineStatusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[145px] h-9 text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {uniqueDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Applied" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 text-xs px-3">
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">No candidates found</h3>
              <p className="text-xs text-muted-foreground mb-4">Try adjusting your filters</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="w-[55px] text-center px-2 cursor-pointer select-none" onClick={() => toggleSort('score')}>
                      <div className="flex items-center justify-center gap-1">Score <SortIcon field="score" /></div>
                    </TableHead>
                    <TableHead className="min-w-[170px] px-3 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                      <div className="flex items-center gap-1">Candidate <SortIcon field="name" /></div>
                    </TableHead>
                    <TableHead className="w-[70px] px-2 text-center">Type</TableHead>
                    <TableHead className="min-w-[130px] px-3 cursor-pointer select-none" onClick={() => toggleSort('company')}>
                      <div className="flex items-center gap-1">Company <SortIcon field="company" /></div>
                    </TableHead>
                    <TableHead className="min-w-[170px] px-3">Applied For</TableHead>
                    <TableHead className="min-w-[110px] px-2 cursor-pointer select-none" onClick={() => toggleSort('salary')}>
                      <div className="flex items-center gap-1">Salary <SortIcon field="salary" /></div>
                    </TableHead>
                    <TableHead className="min-w-[100px] px-2 cursor-pointer select-none" onClick={() => toggleSort('startDate')}>
                      <div className="flex items-center gap-1">Start Date <SortIcon field="startDate" /></div>
                    </TableHead>
                    <TableHead className="min-w-[100px] px-2 cursor-pointer select-none" onClick={() => toggleSort('appliedDate')}>
                      <div className="flex items-center gap-1">Applied <SortIcon field="appliedDate" /></div>
                    </TableHead>
                    <TableHead className="w-[120px] px-2 text-center">Status</TableHead>
                    <TableHead className="w-[75px] px-2 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((c) => {
                    const score = c.qualificationScore ?? c.matchScore;
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-secondary/50 transition-colors duration-150 h-[52px]"
                        onClick={() => handleOpenProfile(c)}
                      >
                        <TableCell className="text-center px-2 py-2">
                          <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border', getScoreStyles(score))}>
                            {score}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <p className="text-sm font-semibold text-foreground leading-tight truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">{c.email}</p>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-center">
                          {c.applicantType === 'internal' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">Int</span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-muted/50 border border-border">Ext</span>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <p className="text-xs text-foreground truncate">{c.currentCompany || '-'}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.currentPosition || ''}</p>
                        </TableCell>
                        <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <button className="text-left hover:text-primary transition-colors group" onClick={() => c.assignedJoId && handleViewJo(c.assignedJoId)}>
                            <p className="text-xs font-medium text-foreground leading-tight truncate group-hover:text-primary">{getJobTitle(c.assignedJoId)}</p>
                            <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">{getDepartment(c.assignedJoId)}</p>
                          </button>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <p className="text-xs text-foreground truncate">{c.expectedSalary || '-'}</p>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <p className="text-xs text-foreground">{formatDate(c.earliestStartDate)}</p>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <p className="text-xs text-foreground">{formatDate(c.appliedDate)}</p>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-center">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap",
                            pipelineStatusColors[c.pipelineStatus],
                            c.pipelineStatus === 'hr_interview' && 'bg-blue-50 border-blue-200 text-blue-700'
                          )}>
                            {pipelineStatusLabels[c.pipelineStatus]}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-0.5">
                            <button title="Send Email" aria-label="Send email" className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary transition-colors" onClick={() => setEmailCandidate(c)}>
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button title="Delete Candidate" aria-label="Delete candidate" className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors" onClick={() => { if (confirm(`Delete candidate "${c.name}"?`)) deleteCandidate(c.id); }}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive/60 hover:text-destructive" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {filteredCandidates.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Showing {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
            {sortField !== 'appliedDate' && ` • Sorted by ${sortField}`}
          </p>
        )}
      </motion.div>

      <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} initialTab={initialTab} />
      <EmailModal open={!!emailCandidate} onClose={() => setEmailCandidate(null)} candidate={emailCandidate} />
    </div>
  );
}

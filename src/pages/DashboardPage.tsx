import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Search, X, Filter, Building, Clock, LayoutGrid, List, Droplets, PauseCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/AppContext';
import { JobOrderList } from '@/components/dashboard/JobOrderList';
import { JobOrderDetail } from '@/components/dashboard/JobOrderDetail';
import { DashboardKanban } from '@/components/dashboard/DashboardKanban';
import { DashboardTableView } from '@/components/dashboard/DashboardTableView';
import { CandidateProfileView } from '@/components/candidate/CandidateProfileView';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pipelineStatusLabels, PipelineStatus, Candidate } from '@/data/mockData';

export default function DashboardPage() {
  const { selectedJoId, jobOrders, isVectorized, getMatchesForJo } = useApp();
  
  // Filter state for candidates
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState<string>('all');
  const [scoreSort, setScoreSort] = useState<string>('none');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(() => {
    return (localStorage.getItem('jo-view-mode') as 'kanban' | 'table') || 'kanban';
  });

  const handleViewModeChange = (mode: 'kanban' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('jo-view-mode', mode);
  };

  // Filter state for job orders
  const [joDepartmentFilter, setJoDepartmentFilter] = useState<string>('all');
  const [joAgingFilter, setJoAgingFilter] = useState<string>('all');

  // Collapsible section state
  const [openExpanded, setOpenExpanded] = useState(true);
  const [onHoldExpanded, setOnHoldExpanded] = useState(true);
  const [poolingExpanded, setPoolingExpanded] = useState(true);

  // Close candidate profile when a different JO is selected
  useEffect(() => {
    setSelectedCandidate(null);
  }, [selectedJoId]);

  const selectedJo = jobOrders.find(jo => jo.id === selectedJoId);
  const matches = selectedJoId ? getMatchesForJo(selectedJoId) : [];

  // Get aging days for a job order
  const getAgingDays = (createdDate: string): number => {
    if (!createdDate) return 0;
    const created = new Date(createdDate);
    if (isNaN(created.getTime())) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filter active job orders and sort by newest first
  const activeJobOrders = useMemo(() => {
    return jobOrders
      .filter(jo => {
        if (jo.status === 'closed' || jo.status === 'archived') return false;
        
        // Department filter
        if (joDepartmentFilter !== 'all' && jo.department !== joDepartmentFilter) return false;
        
        // Aging filter
        if (joAgingFilter !== 'all') {
          const days = getAgingDays(jo.createdDate);
          switch (joAgingFilter) {
            case 'fresh': // < 7 days
              if (days >= 7) return false;
              break;
            case 'moderate': // 7-14 days
              if (days < 7 || days > 14) return false;
              break;
            case 'aging': // 14-30 days
              if (days < 14 || days > 30) return false;
              break;
            case 'stale': // > 30 days
              if (days <= 30) return false;
              break;
          }
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }, [jobOrders, joDepartmentFilter, joAgingFilter]);

  // Split JOs by status sections
  const openJobOrders = useMemo(() => activeJobOrders.filter(jo => jo.status === 'open'), [activeJobOrders]);
  const onHoldJobOrders = useMemo(() => activeJobOrders.filter(jo => jo.status === 'on_hold'), [activeJobOrders]);
  const poolingJobOrders = useMemo(() => activeJobOrders.filter(jo => jo.status === 'pooling'), [activeJobOrders]);

  // Filter candidates
  const filteredMatches = useMemo(() => {
    const filtered = matches.filter(candidate => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower) ||
        candidate.skills.some((skill: string) => skill.toLowerCase().includes(searchLower));
      
      const matchesStatus = statusFilter === 'all' || candidate.pipelineStatus === statusFilter;
      const matchesType = applicantTypeFilter === 'all' || candidate.applicantType === applicantTypeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    if (scoreSort === 'asc') {
      filtered.sort((a, b) => (a.qualificationScore ?? 0) - (b.qualificationScore ?? 0));
    } else if (scoreSort === 'desc') {
      filtered.sort((a, b) => (b.qualificationScore ?? 0) - (a.qualificationScore ?? 0));
    }

    return filtered;
  }, [matches, searchQuery, statusFilter, applicantTypeFilter, scoreSort]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || applicantTypeFilter !== 'all' || scoreSort !== 'none';
  const hasJoFilters = joDepartmentFilter !== 'all' || joAgingFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setApplicantTypeFilter('all');
    setScoreSort('none');
  };

  const clearJoFilters = () => {
    setJoDepartmentFilter('all');
    setJoAgingFilter('all');
  };

  // Get unique departments from job orders
  const uniqueDepartments = [...new Set(jobOrders.map(jo => jo.department))];

  return (
    <div className="h-screen flex">
      {/* Left Pane: JO List - Fixed width, not resizable */}
      <div className="w-80 h-full bg-card overflow-hidden flex flex-col border-r border-border shrink-0">
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Job Orders</h2>
            <p className="text-xs text-muted-foreground">
              {openJobOrders.length} open · {onHoldJobOrders.length} hold · {poolingJobOrders.length} pooling
            </p>
          </div>
        </div>

        {/* JO Filters */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={joDepartmentFilter} onValueChange={setJoDepartmentFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={joAgingFilter} onValueChange={setJoAgingFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Days Open" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="fresh">Fresh (&lt; 7 days)</SelectItem>
                <SelectItem value="moderate">Moderate (7-14 days)</SelectItem>
                <SelectItem value="aging">Aging (14-30 days)</SelectItem>
                <SelectItem value="stale">Stale (&gt; 30 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasJoFilters && (
            <Button variant="ghost" size="sm" onClick={clearJoFilters} className="w-full h-7 text-xs gap-1">
              <X className="w-3 h-3" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {/* Open JOs */}
          <button
            onClick={() => setOpenExpanded(!openExpanded)}
            className="w-full px-3 pt-3 pb-1 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-emerald-600">
              <FileText className="w-3 h-3" />
              Open ({openJobOrders.length})
            </div>
            {openExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          {openExpanded && (
            openJobOrders.length > 0 ? (
              <JobOrderList jobOrders={openJobOrders} />
            ) : (
              <p className="px-3 pb-2 text-xs text-muted-foreground">No open job orders</p>
            )
          )}

          {/* On Hold JOs */}
          {onHoldJobOrders.length > 0 && (
            <>
              <button
                onClick={() => setOnHoldExpanded(!onHoldExpanded)}
                className="w-full px-3 pt-2 pb-1 border-t border-border mt-1 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-blue-600">
                  <PauseCircle className="w-3 h-3" />
                  On Hold ({onHoldJobOrders.length})
                </div>
                {onHoldExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              {onHoldExpanded && <JobOrderList jobOrders={onHoldJobOrders} />}
            </>
          )}

          {/* Pooling JOs */}
          {poolingJobOrders.length > 0 && (
            <>
              <button
                onClick={() => setPoolingExpanded(!poolingExpanded)}
                className="w-full px-3 pt-2 pb-1 border-t border-border mt-1 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-amber-600">
                  <Droplets className="w-3 h-3" />
                  Pooling ({poolingJobOrders.length})
                </div>
                {poolingExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              {poolingExpanded && <JobOrderList jobOrders={poolingJobOrders} />}
            </>
          )}
        </div>
      </div>

      {/* Right Pane: Detail View - Scrollable */}
      <div className="flex-1 h-full bg-background overflow-auto">
        {selectedCandidate ? (
          <CandidateProfileView candidate={selectedCandidate} onBack={() => setSelectedCandidate(null)} />
        ) : selectedJo ? (
          <div className="min-h-full">
            <JobOrderDetail jobOrder={selectedJo} matchCount={filteredMatches.length} />
            
            {/* Candidates Header with Filter */}
            <div className="px-4 py-3 border-b border-border bg-card/50">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {filteredMatches.length} Matched Candidates
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {selectedJo.hiredCount}/{selectedJo.quantity} filled
                  </span>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleViewModeChange('kanban')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Kanban
                  </button>
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    Table
                  </button>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(pipelineStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={applicantTypeFilter} onValueChange={setApplicantTypeFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue placeholder="Applicant Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={scoreSort} onValueChange={setScoreSort}>
                  <SelectTrigger className="w-[160px] h-8 text-sm">
                    <SelectValue placeholder="Sort by Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sort</SelectItem>
                    <SelectItem value="desc">Score: High → Low</SelectItem>
                    <SelectItem value="asc">Score: Low → High</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4">
              {!isVectorized ? (
                <EmptyVectorizationState />
              ) : filteredMatches.length === 0 ? (
                hasActiveFilters ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Filter className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No candidates match your filters</h3>
                    <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or status filter</p>
                    <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                  </div>
                ) : (
                  <EmptyMatchesState />
                )
              ) : viewMode === 'kanban' ? (
                <DashboardKanban candidates={filteredMatches} onSelectCandidate={setSelectedCandidate} />
              ) : (
                <DashboardTableView candidates={filteredMatches} onSelectCandidate={setSelectedCandidate} />
              )}
            </div>
          </div>
        ) : (
          <EmptySelectionState />
        )}
      </div>
    </div>
  );
}

const EmptySelectionState = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">Select a Job Order</h3>
      <p className="text-muted-foreground text-sm">Choose a job order from the list to view matched candidates.</p>
    </motion.div>
  </div>
);

const EmptyVectorizationState = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center">
    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Users className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">No Candidates Yet</h3>
    <p className="text-muted-foreground text-sm max-w-md">
      Upload and vectorize candidate CVs to enable AI-powered matching.
    </p>
  </motion.div>
);

const EmptyMatchesState = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center">
    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Users className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">No Matches Found</h3>
    <p className="text-muted-foreground text-sm max-w-md">No candidates currently match this job order's requirements.</p>
  </motion.div>
);

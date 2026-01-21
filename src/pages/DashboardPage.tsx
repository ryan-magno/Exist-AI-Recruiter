import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/AppContext';
import { JobOrderList } from '@/components/dashboard/JobOrderList';
import { JobOrderDetail } from '@/components/dashboard/JobOrderDetail';
import { CandidateListView } from '@/components/dashboard/CandidateListView';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pipelineStatusLabels, PipelineStatus } from '@/data/mockData';

export default function DashboardPage() {
  const { selectedJoId, jobOrders, isVectorized, getMatchesForJo } = useApp();
  
  // Filter state for candidates
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedJo = jobOrders.find(jo => jo.id === selectedJoId);
  const matches = selectedJoId ? getMatchesForJo(selectedJoId) : [];

  const activeJobOrders = jobOrders.filter(
    jo => jo.status !== 'closed' && jo.status !== 'fulfilled'
  );

  // Filter candidates
  const filteredMatches = useMemo(() => {
    return matches.filter(candidate => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower) ||
        candidate.skills.some((skill: string) => skill.toLowerCase().includes(searchLower));
      
      const matchesStatus = statusFilter === 'all' || candidate.pipelineStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [matches, searchQuery, statusFilter]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div className="h-screen flex">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Pane: JO List */}
        <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
          <div className="h-full bg-card overflow-hidden flex flex-col border-r border-border">
            <div className="p-4 flex items-center gap-2 border-b border-border">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Job Orders</h2>
                <p className="text-xs text-muted-foreground">
                  {activeJobOrders.length} active
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <JobOrderList jobOrders={activeJobOrders} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Pane: Detail View */}
        <ResizablePanel defaultSize={65}>
          <div className="h-full bg-background overflow-hidden flex flex-col">
            {selectedJo ? (
              <>
                <JobOrderDetail jobOrder={selectedJo} matchCount={filteredMatches.length} />
                
                {/* Candidates Header with Filter */}
                <div className="px-4 py-3 border-b border-border bg-card/50">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {filteredMatches.length} Matched Candidates
                      </span>
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

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5">
                        <X className="w-3.5 h-3.5" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  {!isVectorized ? (
                    <EmptyVectorizationState />
                  ) : filteredMatches.length === 0 ? (
                    hasActiveFilters ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Filter className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No candidates match your filters</h3>
                        <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or status filter</p>
                        <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                      </div>
                    ) : (
                      <EmptyMatchesState />
                    )
                  ) : (
                    <CandidateListView candidates={filteredMatches} />
                  )}
                </div>
              </>
            ) : (
              <EmptySelectionState />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function EmptySelectionState() {
  return (
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
}

function EmptyVectorizationState() {
  return (
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
}

function EmptyMatchesState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No Matches Found</h3>
      <p className="text-muted-foreground text-sm max-w-md">No candidates currently match this job order's requirements.</p>
    </motion.div>
  );
}
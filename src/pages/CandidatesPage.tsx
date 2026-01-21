import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, MessageSquare, Search, X, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { pipelineStatusLabels, pipelineStatusColors, PipelineStatus, departmentOptions } from '@/data/mockData';
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
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  const candidates = getAllCandidates();

  // Get department for a candidate based on their assigned JO
  const getDepartment = (joId?: string) => {
    if (!joId) return 'Unassigned';
    const jo = jobOrders.find(j => j.id === joId);
    return jo?.department || 'Unknown';
  };

  // Sort by score (highest first) and filter
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(candidate => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.positionApplied.toLowerCase().includes(searchLower) ||
          candidate.skills.some((skill: string) => skill.toLowerCase().includes(searchLower));
        
        const matchesPipeline = pipelineFilter === 'all' || candidate.pipelineStatus === pipelineFilter;
        
        const candidateDept = getDepartment(candidate.assignedJoId);
        const matchesDepartment = departmentFilter === 'all' || candidateDept === departmentFilter;
        
        return matchesSearch && matchesPipeline && matchesDepartment;
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [candidates, searchQuery, pipelineFilter, departmentFilter, jobOrders]);

  const getJobTitle = (joId?: string) => {
    if (!joId) return 'Unassigned';
    const jo = jobOrders.find(j => j.id === joId);
    return jo?.title || 'Unknown';
  };

  const getScoreClass = (score: number): string => {
    if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 70) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const handleViewJo = (joId: string) => {
    setSelectedJoId(joId);
    navigate('/dashboard');
  };

  const handleOpenNotes = (candidate: any) => {
    setInitialTab('notes');
    setSelectedCandidate(candidate);
  };

  const handleOpenProfile = (candidate: any) => {
    setInitialTab('profile');
    setSelectedCandidate(candidate);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPipelineFilter('all');
    setDepartmentFilter('all');
  };

  const hasActiveFilters = searchQuery || pipelineFilter !== 'all' || departmentFilter !== 'all';

  // Get unique departments from job orders
  const uniqueDepartments = [...new Set(jobOrders.map(jo => jo.department))];

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
        <div className="text-center py-16 bg-card rounded-xl border">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No candidates in the system yet</h3>
          <p className="text-muted-foreground mb-6">Upload and vectorize CVs to begin matching candidates</p>
          <Button onClick={() => navigate('/upload')}>Go to Upload</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Candidates</h1>
            <p className="text-muted-foreground">System-wide applicant pool • {candidates.length} total</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, position, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Pipeline Status Filter */}
            <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pipeline Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(pipelineStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
          
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No candidates found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[100px]">Score</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="min-w-[180px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate, index) => (
                  <motion.tr
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleOpenProfile(candidate)}
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
                      <button 
                        className="text-left hover:text-primary transition-colors"
                        onClick={() => candidate.assignedJoId && handleViewJo(candidate.assignedJoId)}
                      >
                        <p className="text-foreground font-medium">{getDepartment(candidate.assignedJoId)}</p>
                        <p className="text-xs text-muted-foreground">{getJobTitle(candidate.assignedJoId)}</p>
                      </button>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={candidate.pipelineStatus}
                        onValueChange={(value) => updateCandidatePipelineStatus(candidate.id, value as PipelineStatus)}
                      >
                        <SelectTrigger className={cn("h-8 text-xs min-w-[160px]", pipelineStatusColors[candidate.pipelineStatus])}>
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
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                          onClick={() => setEmailCandidate(candidate)}
                          title="Send email to candidate"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8" 
                          onClick={() => handleOpenNotes(candidate)}
                          title="View/edit notes"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8" 
                          onClick={() => handleOpenProfile(candidate)}
                          title="View profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Showing count */}
        {filteredCandidates.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
          </p>
        )}
      </motion.div>

      <CandidateModal 
        candidate={selectedCandidate} 
        onClose={() => setSelectedCandidate(null)} 
        initialTab={initialTab}
      />
      <EmailModal open={!!emailCandidate} onClose={() => setEmailCandidate(null)} candidate={emailCandidate} />
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Users, Droplets, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePooledJobOrders, useUpdateJobOrderStatus, PooledJobOrder } from '@/hooks/usePooledJobOrders';
import { usePooledCandidates, PooledCandidate } from '@/hooks/usePooledCandidates';
import { joStatusLabels, levelLabels, employmentTypeLabels, pipelineStatusLabels, pipelineStatusColors, PipelineStatus } from '@/data/mockData';
import { MoveToActiveJOModal } from '@/components/modals/MoveToActiveJOModal';
import { CandidateProfileView } from '@/components/candidate/CandidateProfileView';
import { useJobOrders } from '@/hooks/useJobOrders';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

type SortField = 'joNumber' | 'title' | 'department' | 'poolCount' | 'updatedAt';
type SortDir = 'asc' | 'desc';

export default function PooledJobOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedJO, setExpandedJO] = useState<string | null>(null);
  
  // Modals
  const [activateRecord, setActivateRecord] = useState<PooledCandidate | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const { data: pooledJOs = [], isLoading } = usePooledJobOrders();
  const { data: allPooled = [] } = usePooledCandidates();
  const { data: allJOs = [] } = useJobOrders();
  const updateStatus = useUpdateJobOrderStatus();

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const filtered = useMemo(() => {
    let result = [...pooledJOs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(jo =>
        jo.jo_number?.toLowerCase().includes(q) ||
        jo.title?.toLowerCase().includes(q) ||
        (jo.department_name || '').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'joNumber': return dir * (a.jo_number || '').localeCompare(b.jo_number || '');
        case 'title': return dir * (a.title || '').localeCompare(b.title || '');
        case 'department': return dir * (a.department_name || '').localeCompare(b.department_name || '');
        case 'poolCount': return dir * ((Number(a.available_pool_count) || 0) - (Number(b.available_pool_count) || 0));
        case 'updatedAt': return dir * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        default: return 0;
      }
    });
    return result;
  }, [pooledJOs, searchQuery, sortField, sortDir]);

  const handleStatusChange = async (joId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: joId, status: newStatus });
      toast.success(`Job order status changed to ${joStatusLabels[newStatus as keyof typeof joStatusLabels] || newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Get pooled candidates for a specific JO
  const getCandidatesForJO = (joId: string) =>
    allPooled.filter(p => p.original_job_order_id === joId && p.disposition === 'available');

  const openCandidateProfile = (pooled: PooledCandidate) => {
    setSelectedCandidate({
      id: pooled.candidate_id,
      applicationId: pooled.original_application_id,
      name: pooled.full_name,
      email: pooled.email || '',
      phone: pooled.phone || '',
      linkedIn: pooled.linkedin || '',
      matchScore: pooled.qualification_score || pooled.match_score || 0,
      pipelineStatus: 'pooled' as PipelineStatus,
      skills: pooled.skills || [],
      experience: pooled.years_of_experience_text || '',
      currentPosition: pooled.current_position || '',
      currentCompany: pooled.current_company || '',
      expectedSalary: pooled.expected_salary || '',
      overallSummary: pooled.overall_summary || '',
      strengths: pooled.strengths || [],
      weaknesses: pooled.weaknesses || [],
      applicantType: pooled.applicant_type || 'external',
      assignedJoId: pooled.original_job_order_id,
      positionApplied: pooled.original_jo_title,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="p-4 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-semibold">Pooled Job Orders</h1>
          <Badge variant="outline" className="text-xs">{filtered.length} JO{filtered.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search JO number, title, department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-8 px-2" />
              <TableHead className="w-[12%] px-2">
                <button onClick={() => toggleSort('joNumber')} className="flex items-center gap-1 text-xs font-medium">
                  JO # <SortIcon field="joNumber" />
                </button>
              </TableHead>
              <TableHead className="w-[25%] px-2">
                <button onClick={() => toggleSort('title')} className="flex items-center gap-1 text-xs font-medium">
                  Title <SortIcon field="title" />
                </button>
              </TableHead>
              <TableHead className="w-[15%] px-2">
                <button onClick={() => toggleSort('department')} className="flex items-center gap-1 text-xs font-medium">
                  Department <SortIcon field="department" />
                </button>
              </TableHead>
              <TableHead className="w-[10%] px-2 text-xs font-medium">Level</TableHead>
              <TableHead className="w-[10%] px-2 text-xs font-medium">Status</TableHead>
              <TableHead className="w-[12%] px-2">
                <button onClick={() => toggleSort('poolCount')} className="flex items-center gap-1 text-xs font-medium">
                  Pool <SortIcon field="poolCount" />
                </button>
              </TableHead>
              <TableHead className="w-[16%] px-2">
                <button onClick={() => toggleSort('updatedAt')} className="flex items-center gap-1 text-xs font-medium">
                  Last Updated <SortIcon field="updatedAt" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                  No pooled job orders found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(jo => {
                const isExpanded = expandedJO === jo.id;
                const pooledForJO = getCandidatesForJO(jo.id);
                return (
                  <React.Fragment key={jo.id}>
                    <TableRow
                      className="hover:bg-muted/20 cursor-pointer"
                      onClick={() => setExpandedJO(isExpanded ? null : jo.id)}
                    >
                      <TableCell className="px-2">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </TableCell>
                      <TableCell className="px-2 text-xs font-medium">{jo.jo_number}</TableCell>
                      <TableCell className="px-2 text-xs">{jo.title}</TableCell>
                      <TableCell className="px-2 text-xs text-muted-foreground">{jo.department_name || '—'}</TableCell>
                      <TableCell className="px-2 text-xs">{levelLabels[jo.level as keyof typeof levelLabels] || jo.level}</TableCell>
                      <TableCell className="px-2">
                        <Select value={jo.status} onValueChange={(val) => handleStatusChange(jo.id, val)}>
                          <SelectTrigger className="h-6 text-[10px] w-24 border-0 bg-transparent px-0" onClick={e => e.stopPropagation()}>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0',
                              jo.status === 'pooling' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                              jo.status === 'open' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                              jo.status === 'closed' ? 'bg-red-100 text-red-700 border-red-300' :
                              'bg-gray-100 text-gray-600 border-gray-300'
                            )}>
                              {joStatusLabels[jo.status as keyof typeof joStatusLabels] || jo.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent onClick={e => e.stopPropagation()}>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="pooling">Pooling</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-2">
                        <div className="flex items-center gap-1.5">
                          <Droplets className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-medium">{Number(jo.available_pool_count)}</span>
                          <span className="text-[10px] text-muted-foreground">/ {Number(jo.total_pool_count)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 text-xs text-muted-foreground">
                        {format(new Date(jo.updated_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>

                    {/* Expanded: show pooled candidates for this JO */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0 bg-muted/10">
                          <div className="px-6 py-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Available pooled candidates ({pooledForJO.length})</p>
                            {pooledForJO.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">No available candidates in pool for this JO.</p>
                            ) : (
                              <div className="space-y-1">
                                {pooledForJO.map(pc => (
                                  <div key={pc.id} className="flex items-center gap-3 px-3 py-1.5 rounded hover:bg-background/60 text-xs">
                                    <div className={cn(
                                      'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0',
                                      (pc.qualification_score || pc.match_score || 0) >= 80 ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                                      (pc.qualification_score || pc.match_score || 0) >= 60 ? 'border-amber-400 bg-amber-50 text-amber-700' :
                                      'border-gray-300 bg-gray-50 text-gray-600'
                                    )}>
                                      {pc.qualification_score || pc.match_score || '—'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); openCandidateProfile(pc); }}>
                                        {pc.full_name}
                                      </span>
                                      <span className="text-muted-foreground ml-2">
                                        {pc.current_position ? `${pc.current_position}${pc.current_company ? ` at ${pc.current_company}` : ''}` : ''}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', pipelineStatusColors[pc.pooled_from_status as PipelineStatus] || '')}>
                                      {pipelineStatusLabels[pc.pooled_from_status as PipelineStatus] || pc.pooled_from_status}
                                    </Badge>
                                    <span className="text-muted-foreground text-[10px]">{format(new Date(pc.pooled_at), 'MMM d')}</span>
                                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); setActivateRecord(pc); }}>
                                      Move to Active JO
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Move to Active JO Modal */}
      {activateRecord && (
        <MoveToActiveJOModal
          pooledRecord={activateRecord}
          open={!!activateRecord}
          onOpenChange={(open) => { if (!open) setActivateRecord(null); }}
          jobOrders={allJOs?.filter(j => j.status === 'open' || j.status === 'on_hold') || []}
        />
      )}

      {/* Candidate Profile Drawer */}
      <AnimatePresence>
        {selectedCandidate && (
          <>
            <motion.div
              key="drawer-backdrop"
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSelectedCandidate(null)}
            />
            <motion.div
              key="drawer-panel"
              className="fixed top-0 right-0 bottom-0 w-2/3 min-w-[640px] bg-card z-50 shadow-2xl border-l overflow-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            >
              <CandidateProfileView candidate={selectedCandidate} onBack={() => setSelectedCandidate(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

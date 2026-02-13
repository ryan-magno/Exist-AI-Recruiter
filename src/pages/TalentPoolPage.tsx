import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Search, X, Filter, ArrowUpDown, ArrowUp, ArrowDown, UserPlus, Archive, CheckCircle2, XCircle, Pause, MoreHorizontal, Eye, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePooledCandidates, useUpdatePooledDisposition, useBulkPooledAction, PooledCandidate } from '@/hooks/usePooledCandidates';
import { usePooledJobOrders } from '@/hooks/usePooledJobOrders';
import { useJobOrders } from '@/hooks/useJobOrders';
import { pipelineStatusLabels, pipelineStatusColors, PipelineStatus } from '@/data/mockData';
import { CandidateProfileView } from '@/components/candidate/CandidateProfileView';
import { MoveToActiveJOModal } from '@/components/modals/MoveToActiveJOModal';
import { EmailModal } from '@/components/modals/EmailModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

const dispositionLabels: Record<string, string> = {
  available: 'Available',
  not_suitable: 'Not Suitable',
  on_hold: 'On Hold',
  activated: 'Activated',
  archived: 'Archived',
};

const dispositionColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  not_suitable: 'bg-red-100 text-red-700 border-red-300',
  on_hold: 'bg-amber-100 text-amber-700 border-amber-300',
  activated: 'bg-blue-100 text-blue-700 border-blue-300',
  archived: 'bg-gray-100 text-gray-500 border-gray-300',
};

type SortField = 'score' | 'name' | 'pooledAt' | 'salary' | 'experience' | 'position';
type SortDir = 'asc' | 'desc';

export default function TalentPoolPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState<string>('available');
  const [joFilter, setJoFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('pooledAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [activateRecord, setActivateRecord] = useState<PooledCandidate | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<any>(null);

  const { data: pooledCandidates = [], isLoading } = usePooledCandidates({
    disposition: dispositionFilter !== 'all' ? dispositionFilter : undefined,
    search: searchQuery || undefined,
  });
  const { data: pooledJOs = [] } = usePooledJobOrders();
  const { data: allJOs = [] } = useJobOrders();
  const updateDisposition = useUpdatePooledDisposition();
  const bulkAction = useBulkPooledAction();

  // Sort & filter
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const filteredCandidates = useMemo(() => {
    let result = [...pooledCandidates];
    if (joFilter !== 'all') result = result.filter(p => p.original_job_order_id === joFilter);

    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'score': return dir * ((a.qualification_score || 0) - (b.qualification_score || 0));
        case 'name': return dir * (a.full_name || '').localeCompare(b.full_name || '');
        case 'pooledAt': return dir * (new Date(a.pooled_at).getTime() - new Date(b.pooled_at).getTime());
        case 'salary': return dir * ((parseFloat(a.expected_salary || '0') || 0) - (parseFloat(b.expected_salary || '0') || 0));
        case 'experience': return dir * ((parseFloat(a.years_of_experience_text || '0') || 0) - (parseFloat(b.years_of_experience_text || '0') || 0));
        case 'position': return dir * (a.current_position || '').localeCompare(b.current_position || '');
        default: return 0;
      }
    });
    return result;
  }, [pooledCandidates, joFilter, sortField, sortDir]);

  const allSelected = filteredCandidates.length > 0 && filteredCandidates.every(c => selectedIds.has(c.id));
  const someSelected = filteredCandidates.some(c => selectedIds.has(c.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDisposition = async (disposition: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await bulkAction.mutateAsync({ ids, disposition });
      toast.success(`${ids.length} candidate(s) marked as ${dispositionLabels[disposition] || disposition}`);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.message || 'Bulk action failed');
    }
  };

  const handleDispositionChange = async (pooledId: string, disposition: string) => {
    try {
      await updateDisposition.mutateAsync({ pooledId, data: { disposition } });
      toast.success(`Disposition updated to ${dispositionLabels[disposition] || disposition}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update disposition');
    }
  };

  const openCandidateProfile = (pooled: PooledCandidate) => {
    // Build a minimal candidate object for the profile view
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

  // Unique JOs for filter dropdown
  const joOptions = useMemo(() => {
    const map = new Map<string, string>();
    pooledCandidates.forEach(p => {
      if (!map.has(p.original_job_order_id)) {
        map.set(p.original_job_order_id, `${p.original_jo_number} - ${p.original_jo_title}`);
      }
    });
    return Array.from(map.entries());
  }, [pooledCandidates]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="p-4 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-semibold">Talent Pool</h1>
          <Badge variant="outline" className="text-xs">{filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, email, position..."
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

        <Select value={dispositionFilter} onValueChange={setDispositionFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Disposition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dispositions</SelectItem>
            {Object.entries(dispositionLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={joFilter} onValueChange={setJoFilter}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="All Job Orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Job Orders</SelectItem>
            {joOptions.map(([id, label]) => (
              <SelectItem key={id} value={id}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bulk actions */}
        {someSelected && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkDisposition('on_hold')}>
              <Pause className="w-3 h-3 mr-1" /> On Hold
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkDisposition('not_suitable')}>
              <XCircle className="w-3 h-3 mr-1" /> Not Suitable
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkDisposition('archived')}>
              <Archive className="w-3 h-3 mr-1" /> Archive
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkDisposition('available')}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Available
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b">
              <TableHead className="w-8 px-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
              </TableHead>
              <TableHead className="w-[55px] text-center px-2 cursor-pointer select-none" onClick={() => toggleSort('score')}>
                <div className="flex items-center justify-center gap-1">Score <SortIcon field="score" /></div>
              </TableHead>
              <TableHead className="min-w-[170px] px-3 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1">Candidate <SortIcon field="name" /></div>
              </TableHead>
              <TableHead className="min-w-[130px] px-3 cursor-pointer select-none" onClick={() => toggleSort('position')}>
                <div className="flex items-center gap-1">Current Role <SortIcon field="position" /></div>
              </TableHead>
              <TableHead className="min-w-[170px] px-3">Original JO</TableHead>
              <TableHead className="w-[100px] px-2 text-center">Pooled From</TableHead>
              <TableHead className="min-w-[100px] px-2 cursor-pointer select-none" onClick={() => toggleSort('pooledAt')}>
                <div className="flex items-center gap-1">Pooled <SortIcon field="pooledAt" /></div>
              </TableHead>
              <TableHead className="w-[110px] px-2 text-center">Disposition</TableHead>
              <TableHead className="w-[75px] px-2 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Loading pool...</TableCell>
              </TableRow>
            ) : filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                  No pooled candidates found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map(pooled => (
                <TableRow key={pooled.id} className="cursor-pointer hover:bg-secondary/50 transition-colors duration-150 h-[52px]" onClick={() => openCandidateProfile(pooled)}>
                  <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(pooled.id)} onCheckedChange={() => toggleOne(pooled.id)} />
                  </TableCell>
                  <TableCell className="text-center px-2 py-2">
                    <span className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border',
                      (pooled.qualification_score || pooled.match_score || 0) >= 75 ? 'bg-green-100 text-green-700 border-green-300' :
                      (pooled.qualification_score || pooled.match_score || 0) >= 50 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                      'bg-red-100 text-red-700 border-red-300'
                    )}>
                      {pooled.qualification_score || pooled.match_score || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">{pooled.full_name}</p>
                    {pooled.phone && (
                      <button
                        className="text-xs text-muted-foreground leading-tight mt-0.5 truncate flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(pooled.phone); toast.success('Phone copied'); }}
                        title="Click to copy"
                      >
                        <Phone className="w-3 h-3" />
                        {pooled.phone}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <p className="text-xs text-foreground truncate">{pooled.current_position || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{pooled.current_company || ''}</p>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <p className="text-xs font-medium text-foreground leading-tight truncate">{pooled.original_jo_number}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">{pooled.original_jo_title}</p>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap',
                      pipelineStatusColors[pooled.pooled_from_status as PipelineStatus] || 'bg-gray-100'
                    )}>
                      {pipelineStatusLabels[pooled.pooled_from_status as PipelineStatus] || pooled.pooled_from_status}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <p className="text-xs text-foreground">{format(new Date(pooled.pooled_at), 'MMM d, yyyy')}</p>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap',
                      dispositionColors[pooled.disposition] || 'bg-gray-100'
                    )}>
                      {dispositionLabels[pooled.disposition] || pooled.disposition}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary transition-colors">
                            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openCandidateProfile(pooled)}>
                          <Eye className="w-3.5 h-3.5 mr-2" /> View Profile
                        </DropdownMenuItem>
                        {pooled.disposition === 'available' && (
                          <DropdownMenuItem onClick={() => setActivateRecord(pooled)}>
                            <UserPlus className="w-3.5 h-3.5 mr-2" /> Move to Active JO
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {pooled.disposition !== 'available' && (
                          <DropdownMenuItem onClick={() => handleDispositionChange(pooled.id, 'available')}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark Available
                          </DropdownMenuItem>
                        )}
                        {pooled.disposition !== 'on_hold' && (
                          <DropdownMenuItem onClick={() => handleDispositionChange(pooled.id, 'on_hold')}>
                            <Pause className="w-3.5 h-3.5 mr-2" /> Put On Hold
                          </DropdownMenuItem>
                        )}
                        {pooled.disposition !== 'not_suitable' && (
                          <DropdownMenuItem onClick={() => handleDispositionChange(pooled.id, 'not_suitable')}>
                            <XCircle className="w-3.5 h-3.5 mr-2" /> Not Suitable
                          </DropdownMenuItem>
                        )}
                        {pooled.disposition !== 'archived' && (
                          <DropdownMenuItem onClick={() => handleDispositionChange(pooled.id, 'archived')}>
                            <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {pooled.email && (
                          <DropdownMenuItem onClick={() => setEmailCandidate({ name: pooled.full_name, email: pooled.email })}>
                            <Mail className="w-3.5 h-3.5 mr-2" /> Send Email
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Move to Active JO Modal */}
      {activateRecord && (
        <MoveToActiveJOModal
          pooledRecord={activateRecord}
          open={!!activateRecord}
          onOpenChange={(open) => { if (!open) setActivateRecord(null); }}
          jobOrders={allJOs?.filter(j => j.status === 'open' || j.status === 'on_hold') || []}
        />
      )}

      {/* Email Modal */}
      {emailCandidate && (
        <EmailModal
          open={!!emailCandidate}
          onClose={() => setEmailCandidate(null)}
          candidate={emailCandidate}
        />
      )}
    </motion.div>
  );
}

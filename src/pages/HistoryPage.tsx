import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { History, Briefcase, Users, Upload, UserCheck, Cpu, Gift, UserCog, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useActivityLog, activityTypeLabels, pipelineStatusReadable, type ActivityLogEntry } from '@/hooks/useActivityLog';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

function getDateRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const end = endOfDay(now).toISOString();
  switch (preset) {
    case 'today': return { start: startOfDay(now).toISOString(), end };
    case '7d': return { start: subDays(now, 7).toISOString(), end };
    case '30d': return { start: subDays(now, 30).toISOString(), end };
    case '90d': return { start: subDays(now, 90).toISOString(), end };
    default: return { start: subDays(now, 30).toISOString(), end };
  }
}

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), 'MMM d, yyyy h:mm a'); } catch { return dateStr; }
}

function formatShortDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  try { return format(new Date(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
}

function VerdictBadge({ verdict }: { verdict: string | null | undefined }) {
  if (!verdict) return <span className="text-muted-foreground">-</span>;
  const colors: Record<string, string> = {
    pass: 'bg-green-100 text-green-700 border-green-300',
    fail: 'bg-red-100 text-red-700 border-red-300',
    conditional: 'bg-amber-100 text-amber-700 border-amber-300',
    pending: 'bg-gray-100 text-gray-600 border-gray-300',
  };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', colors[verdict] || colors.pending)}>{verdict.charAt(0).toUpperCase() + verdict.slice(1)}</span>;
}

// ── Column definition for FilterableSection ──

interface ColumnDef {
  key: string;
  header: string;
  getValue: (entry: ActivityLogEntry) => string;
  render?: (entry: ActivityLogEntry) => React.ReactNode;
}

type SortDir = 'asc' | 'desc' | null;
interface ColumnFilters { [columnKey: string]: string; }
interface SortState { key: string | null; dir: SortDir; }

// ── FilterableSection ──

interface FilterableSectionProps {
  title: string;
  icon: React.ReactNode;
  entries: ActivityLogEntry[];
  isLoading: boolean;
  columns: ColumnDef[];
  emptyMessage: string;
}

function FilterableSection({ title, icon, entries, isLoading, columns, emptyMessage }: FilterableSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [showCount, setShowCount] = useState(20);
  const [filters, setFilters] = useState<ColumnFilters>({});
  const [sort, setSort] = useState<SortState>({ key: null, dir: null });
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);

  const hasActiveFilters = Object.values(filters).some(v => v.length > 0);

  const getUniqueValues = useCallback((columnKey: string) => {
    const col = columns.find(c => c.key === columnKey);
    if (!col) return [];
    const values = new Set<string>();
    entries.forEach(e => { const v = col.getValue(e); if (v && v !== '-') values.add(v); });
    return Array.from(values).sort();
  }, [entries, columns]);

  const processedEntries = useMemo(() => {
    let result = entries;
    const activeFilters = Object.entries(filters).filter(([, v]) => v.length > 0);
    if (activeFilters.length > 0) {
      result = result.filter(entry =>
        activeFilters.every(([colKey, filterVal]) => {
          const col = columns.find(c => c.key === colKey);
          if (!col) return true;
          return col.getValue(entry).toLowerCase().includes(filterVal.toLowerCase());
        })
      );
    }
    if (sort.key && sort.dir) {
      const col = columns.find(c => c.key === sort.key);
      if (col) {
        result = [...result].sort((a, b) => {
          const cmp = col.getValue(a).localeCompare(col.getValue(b), undefined, { numeric: true, sensitivity: 'base' });
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [entries, filters, sort, columns]);

  const toggleSort = (colKey: string) => {
    setSort(prev => {
      if (prev.key !== colKey) return { key: colKey, dir: 'asc' };
      if (prev.dir === 'asc') return { key: colKey, dir: 'desc' };
      return { key: null, dir: null };
    });
  };

  const setFilter = (colKey: string, value: string) => setFilters(prev => ({ ...prev, [colKey]: value }));
  const clearAllFilters = () => { setFilters({}); setSort({ key: null, dir: null }); };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">
            ({processedEntries.length}{processedEntries.length !== entries.length ? ` of ${entries.length}` : ''})
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
              <Filter className="w-2.5 h-2.5" /> Filtered
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t">
          {hasActiveFilters && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-b flex-wrap">
              <span className="text-[10px] text-muted-foreground">Active filters:</span>
              {Object.entries(filters).filter(([, v]) => v.length > 0).map(([colKey, val]) => {
                const col = columns.find(c => c.key === colKey);
                return (
                  <span key={colKey} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted border">
                    <span className="text-muted-foreground">{col?.header}:</span> <span className="font-medium">{val}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFilter(colKey, ''); }} className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
                  </span>
                );
              })}
              <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 ml-auto" onClick={clearAllFilters}>Clear All</Button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : processedEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">{hasActiveFilters ? 'No entries match the current filters' : emptyMessage}</p>
              {hasActiveFilters && <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearAllFilters}>Clear Filters</Button>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {columns.map(col => {
                        const isSorted = sort.key === col.key;
                        const isFiltered = (filters[col.key] || '').length > 0;
                        const uniqueValues = getUniqueValues(col.key);
                        const isDropdown = uniqueValues.length <= 15 && uniqueValues.length > 0;
                        return (
                          <TableHead key={col.key} className="text-xs px-3 py-1.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button onClick={() => toggleSort(col.key)}
                                className={cn('flex items-center gap-0.5 hover:text-foreground transition-colors', isSorted ? 'text-primary font-semibold' : 'text-muted-foreground')}>
                                {col.header}
                                {isSorted && sort.dir === 'asc' && <ArrowUp className="w-3 h-3" />}
                                {isSorted && sort.dir === 'desc' && <ArrowDown className="w-3 h-3" />}
                              </button>
                              <Popover open={openFilterCol === col.key} onOpenChange={(open) => setOpenFilterCol(open ? col.key : null)}>
                                <PopoverTrigger asChild>
                                  <button className={cn('w-4 h-4 flex items-center justify-center rounded hover:bg-muted transition-colors', isFiltered ? 'text-primary' : 'text-muted-foreground/50')}>
                                    <Filter className="w-2.5 h-2.5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2" align="start">
                                  <div className="space-y-1.5">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Filter: {col.header}</p>
                                    {isDropdown ? (
                                      <div className="max-h-40 overflow-y-auto space-y-0.5">
                                        <button onClick={() => { setFilter(col.key, ''); setOpenFilterCol(null); }}
                                          className={cn('w-full text-left px-2 py-1 rounded text-xs hover:bg-muted transition-colors', !filters[col.key] && 'font-medium text-primary')}>All</button>
                                        {uniqueValues.map(val => (
                                          <button key={val} onClick={() => { setFilter(col.key, val); setOpenFilterCol(null); }}
                                            className={cn('w-full text-left px-2 py-1 rounded text-xs hover:bg-muted transition-colors truncate', filters[col.key] === val && 'font-medium text-primary bg-primary/5')}>{val}</button>
                                        ))}
                                      </div>
                                    ) : (
                                      <Input placeholder={`Search ${col.header.toLowerCase()}...`} value={filters[col.key] || ''} onChange={(e) => setFilter(col.key, e.target.value)} className="h-7 text-xs" autoFocus />
                                    )}
                                    {isFiltered && <Button variant="ghost" size="sm" className="w-full h-6 text-[10px]" onClick={() => { setFilter(col.key, ''); setOpenFilterCol(null); }}>Clear</Button>}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedEntries.slice(0, showCount).map(entry => (
                      <TableRow key={entry.id} className="hover:bg-muted/30">
                        {columns.map(col => (
                          <TableCell key={col.key} className="px-3 py-2 text-xs">
                            {col.render ? col.render(entry) : col.getValue(entry)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {processedEntries.length > showCount && (
                <div className="p-3 text-center border-t">
                  <Button variant="ghost" size="sm" onClick={() => setShowCount(s => s + 20)}>Load More ({processedEntries.length - showCount} remaining)</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Column Definitions per Section ──

const joColumns: ColumnDef[] = [
  { key: 'action', header: 'Action', getValue: e => activityTypeLabels[e.activity_type] || e.activity_type,
    render: e => <Badge variant="outline" className="text-xs">{activityTypeLabels[e.activity_type] || e.activity_type}</Badge> },
  { key: 'date', header: 'Date', getValue: e => formatDate(e.action_date),
    render: e => <span className="whitespace-nowrap">{formatDate(e.action_date)}</span> },
  { key: 'jo_number', header: 'JO Number', getValue: e => e.details?.jo_number || '-',
    render: e => <span className="font-medium">{e.details?.jo_number || '-'}</span> },
  { key: 'title', header: 'Position Title', getValue: e => e.details?.title || '-' },
  { key: 'requestor', header: 'Requestor', getValue: e => e.details?.requestor_name || '-' },
  { key: 'department', header: 'Department', getValue: e => e.details?.department_name || '-' },
  { key: 'level', header: 'Level', getValue: e => e.details?.level || '-' },
  { key: 'quantity', header: 'Quantity', getValue: e => String(e.details?.quantity || '-') },
];

const pipelineColumns: ColumnDef[] = [
  { key: 'date', header: 'Date', getValue: e => formatDate(e.action_date),
    render: e => <span className="whitespace-nowrap">{formatDate(e.action_date)}</span> },
  { key: 'candidate', header: 'Candidate', getValue: e => e.details?.candidate_name || '-',
    render: e => <span className="font-medium">{e.details?.candidate_name || '-'}</span> },
  { key: 'status_change', header: 'Status Change',
    getValue: e => {
      const from = pipelineStatusReadable[e.details?.from_status] || e.details?.from_status || 'New';
      const to = pipelineStatusReadable[e.details?.to_status] || e.details?.to_status;
      return `${from} → ${to}`;
    }
  },
  { key: 'verdict', header: 'Verdict', getValue: e => e.details?.verdict || '-',
    render: e => <VerdictBadge verdict={e.details?.verdict} /> },
  { key: 'duration', header: 'Duration', getValue: e => e.details?.duration_days != null ? `${e.details.duration_days} days` : '-' },
];

const cvColumns: ColumnDef[] = [
  { key: 'date', header: 'Date', getValue: e => formatDate(e.action_date),
    render: e => <span className="whitespace-nowrap">{formatDate(e.action_date)}</span> },
  { key: 'uploaded_by', header: 'Uploaded By', getValue: e => e.performed_by_name || '-' },
  { key: 'count', header: 'CVs Uploaded', getValue: e => e.details?.count ? `${e.details.count} CV${e.details.count > 1 ? 's' : ''}` : '1 CV',
    render: e => <Badge variant="secondary" className="text-xs font-medium">{e.details?.count || 1} CV{(e.details?.count || 1) > 1 ? 's' : ''}</Badge> },
  { key: 'candidates', header: 'Candidates',
    getValue: e => { const names: string[] = e.details?.candidate_names || []; return names.length > 0 ? names.join(', ') : e.details?.candidate_name || '-'; },
    render: e => {
      const names: string[] = e.details?.candidate_names || [];
      if (names.length === 0) return <span>{e.details?.candidate_name || '-'}</span>;
      if (names.length <= 2) return <span>{names.join(', ')}</span>;
      return <span title={names.join(', ')}>{names.slice(0, 2).join(', ')} +{names.length - 2} more</span>;
    }
  },
];

const hrColumns: ColumnDef[] = [
  { key: 'action', header: 'Action', getValue: e => activityTypeLabels[e.activity_type] || e.activity_type,
    render: e => <Badge variant="outline" className="text-xs">{activityTypeLabels[e.activity_type] || e.activity_type}</Badge> },
  { key: 'date', header: 'Date', getValue: e => formatDate(e.action_date),
    render: e => <span className="whitespace-nowrap">{formatDate(e.action_date)}</span> },
  { key: 'candidate', header: 'Candidate', getValue: e => e.details?.candidate_name || '-',
    render: e => <span className="font-medium">{e.details?.candidate_name || '-'}</span> },
  { key: 'jo', header: 'JO', getValue: e => e.details?.jo_number || '-' },
  { key: 'interview_date', header: 'Interview Date', getValue: e => formatShortDate(e.details?.interview_date) },
  { key: 'interviewer', header: 'Interviewer', getValue: e => e.performed_by_name || '-' },
  { key: 'verdict', header: 'Verdict', getValue: e => e.details?.verdict || '-',
    render: e => <VerdictBadge verdict={e.details?.verdict} /> },
];

const techColumns: ColumnDef[] = [
  { key: 'action', header: 'Action', getValue: e => activityTypeLabels[e.activity_type] || e.activity_type,
    render: e => <Badge variant="outline" className="text-xs">{activityTypeLabels[e.activity_type] || e.activity_type}</Badge> },
  { key: 'date', header: 'Date', getValue: e => formatDate(e.action_date),
    render: e => <span className="whitespace-nowrap">{formatDate(e.action_date)}</span> },
  { key: 'candidate', header: 'Candidate', getValue: e => e.details?.candidate_name || '-',
    render: e => <span className="font-medium">{e.details?.candidate_name || '-'}</span> },
  { key: 'jo', header: 'JO', getValue: e => e.details?.jo_number || '-' },
  { key: 'interview_date', header: 'Interview Date', getValue: e => formatShortDate(e.details?.interview_date) },
  { key: 'interviewer', header: 'Interviewer', getValue: e => e.performed_by_name || '-' },
  { key: 'verdict', header: 'Verdict', getValue: e => e.details?.verdict || '-',
    render: e => <VerdictBadge verdict={e.details?.verdict} /> },
];

const offerColumns: ColumnDef[] = [
  { key: 'action', header: 'Action', getValue: e => activityTypeLabels[e.activity_type] || e.activity_type,
    render: e => <Badge variant="outline" className="text-xs">{activityTypeLabels[e.activity_type] || e.activity_type}</Badge> },
  { key: 'date', header: 'Date', getValue: e => formatDate(e.action_date),
    render: e => <span className="whitespace-nowrap">{formatDate(e.action_date)}</span> },
  { key: 'candidate', header: 'Candidate', getValue: e => e.details?.candidate_name || '-',
    render: e => <span className="font-medium">{e.details?.candidate_name || '-'}</span> },
  { key: 'jo', header: 'JO', getValue: e => e.details?.jo_number || '-' },
  { key: 'amount', header: 'Amount', getValue: e => e.details?.offer_amount || '-' },
  { key: 'status', header: 'Status', getValue: e => e.details?.status || e.details?.new_status || '-' },
  { key: 'start_date', header: 'Start Date', getValue: e => formatShortDate(e.details?.start_date) },
];

const profileColumns: ColumnDef[] = [
  { key: 'date', header: 'Date', getValue: e => formatDate(e.action_date),
    render: e => <span className="whitespace-nowrap">{formatDate(e.action_date)}</span> },
  { key: 'candidate', header: 'Candidate', getValue: e => e.details?.candidate_name || '-',
    render: e => <span className="font-medium">{e.details?.candidate_name || '-'}</span> },
  { key: 'field', header: 'Field Changed', getValue: e => e.details?.field_changed || '-' },
  { key: 'old_value', header: 'Old Value', getValue: e => e.details?.old_value || '-' },
  { key: 'new_value', header: 'New Value', getValue: e => e.details?.new_value || '-' },
  { key: 'changed_by', header: 'Changed By', getValue: e => e.performed_by_name || '-' },
  { key: 'source', header: 'Source', getValue: e => e.details?.source || '-' },
];

export default function HistoryPage() {
  const [datePreset, setDatePreset] = useState('30d');
  const { start, end } = useMemo(() => getDateRange(datePreset), [datePreset]);

  const { data: allLogs = [], isLoading } = useActivityLog({ startDate: start, endDate: end, limit: 500 });

  const joLogs = useMemo(() => allLogs.filter(l => l.entity_type === 'job_order'), [allLogs]);
  const pipelineLogs = useMemo(() => allLogs.filter(l => l.activity_type === 'pipeline_moved'), [allLogs]);
  const cvLogs = useMemo(() => allLogs.filter(l => l.activity_type === 'cv_uploaded'), [allLogs]);
  const hrLogs = useMemo(() => allLogs.filter(l => l.activity_type?.startsWith('hr_interview')), [allLogs]);
  const techLogs = useMemo(() => allLogs.filter(l => l.activity_type?.startsWith('tech_interview')), [allLogs]);
  const offerLogs = useMemo(() => allLogs.filter(l => l.activity_type?.startsWith('offer_')), [allLogs]);
  const profileLogs = useMemo(() => allLogs.filter(l => l.activity_type === 'profile_updated'), [allLogs]);

  return (
    <div className="p-6 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Activity History</h1>
          </div>
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6">
          <FilterableSection title="Job Order Activities" icon={<Briefcase className="w-4 h-4 text-primary" />}
            entries={joLogs} isLoading={isLoading} columns={joColumns} emptyMessage="No job order activities in this date range" />

          <FilterableSection title="Candidate Pipeline Movements" icon={<Users className="w-4 h-4 text-blue-600" />}
            entries={pipelineLogs} isLoading={isLoading} columns={pipelineColumns} emptyMessage="No pipeline movements in this date range" />

          <FilterableSection title="CV Uploads" icon={<Upload className="w-4 h-4 text-green-600" />}
            entries={cvLogs} isLoading={isLoading} columns={cvColumns} emptyMessage="No CV uploads in this date range" />

          <FilterableSection title="HR Interview Activities" icon={<UserCheck className="w-4 h-4 text-indigo-600" />}
            entries={hrLogs} isLoading={isLoading} columns={hrColumns} emptyMessage="No HR interview activities in this date range" />

          <FilterableSection title="Tech Interview Activities" icon={<Cpu className="w-4 h-4 text-purple-600" />}
            entries={techLogs} isLoading={isLoading} columns={techColumns} emptyMessage="No tech interview activities in this date range" />

          <FilterableSection title="Offer Activities" icon={<Gift className="w-4 h-4 text-emerald-600" />}
            entries={offerLogs} isLoading={isLoading} columns={offerColumns} emptyMessage="No offer activities in this date range" />

          <FilterableSection title="Candidate Profile Changes" icon={<UserCog className="w-4 h-4 text-orange-600" />}
            entries={profileLogs} isLoading={isLoading} columns={profileColumns} emptyMessage="No profile changes in this date range" />
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Showing {allLogs.length} activities • {datePreset === 'today' ? 'Today' : `Last ${datePreset.replace('d', ' days')}`}
        </p>
      </motion.div>
    </div>
  );
}

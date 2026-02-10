import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { History, Briefcase, Users, Upload, UserCheck, Cpu, Gift, UserCog, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  entries: ActivityLogEntry[];
  isLoading: boolean;
  renderRow: (entry: ActivityLogEntry) => React.ReactNode;
  headers: string[];
  emptyMessage: string;
}

function ActivitySection({ title, icon, entries, isLoading, renderRow, headers, emptyMessage }: SectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [showCount, setShowCount] = useState(20);

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">({entries.length})</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {headers.map(h => <TableHead key={h} className="text-xs px-3 py-2 whitespace-nowrap">{h}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.slice(0, showCount).map(renderRow)}
                  </TableBody>
                </Table>
              </div>
              {entries.length > showCount && (
                <div className="p-3 text-center border-t">
                  <Button variant="ghost" size="sm" onClick={() => setShowCount(s => s + 20)}>Load More ({entries.length - showCount} remaining)</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
          {/* Job Order Activities */}
          <ActivitySection
            title="Job Order Activities"
            icon={<Briefcase className="w-4 h-4 text-primary" />}
            entries={joLogs}
            isLoading={isLoading}
            emptyMessage="No job order activities in this date range"
            headers={['Action', 'Date', 'JO Number', 'Position Title', 'Requestor', 'Department', 'Level', 'Quantity']}
            renderRow={(entry) => (
              <TableRow key={entry.id} className="hover:bg-muted/30">
                <TableCell className="px-3 py-2 text-xs">
                  <Badge variant="outline" className="text-xs">{activityTypeLabels[entry.activity_type] || entry.activity_type}</Badge>
                </TableCell>
                <TableCell className="px-3 py-2 text-xs whitespace-nowrap">{formatDate(entry.action_date)}</TableCell>
                <TableCell className="px-3 py-2 text-xs font-medium">{entry.details?.jo_number || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.title || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.requestor_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.department_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.level || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.quantity || '-'}</TableCell>
              </TableRow>
            )}
          />

          {/* Pipeline Movements */}
          <ActivitySection
            title="Candidate Pipeline Movements"
            icon={<Users className="w-4 h-4 text-blue-600" />}
            entries={pipelineLogs}
            isLoading={isLoading}
            emptyMessage="No pipeline movements in this date range"
            headers={['Date', 'Candidate', 'Status Change', 'Verdict', 'Duration']}
            renderRow={(entry) => {
              const from = pipelineStatusReadable[entry.details?.from_status] || entry.details?.from_status || 'New';
              const to = pipelineStatusReadable[entry.details?.to_status] || entry.details?.to_status;
              return (
                <TableRow key={entry.id} className="hover:bg-muted/30">
                  <TableCell className="px-3 py-2 text-xs whitespace-nowrap">{formatDate(entry.action_date)}</TableCell>
                  <TableCell className="px-3 py-2 text-xs font-medium">{entry.details?.candidate_name || '-'}</TableCell>
                  <TableCell className="px-3 py-2 text-xs">{from} → {to}</TableCell>
                  <TableCell className="px-3 py-2 text-xs"><VerdictBadge verdict={entry.details?.verdict} /></TableCell>
                  <TableCell className="px-3 py-2 text-xs">{entry.details?.duration_days ? `${entry.details.duration_days} days` : '-'}</TableCell>
                </TableRow>
              );
            }}
          />

          {/* CV Uploads */}
          <ActivitySection
            title="CV Uploads"
            icon={<Upload className="w-4 h-4 text-green-600" />}
            entries={cvLogs}
            isLoading={isLoading}
            emptyMessage="No CV uploads in this date range"
            headers={['Date', 'Candidate', 'Uploaded By', 'File Name', 'Type']}
            renderRow={(entry) => (
              <TableRow key={entry.id} className="hover:bg-muted/30">
                <TableCell className="px-3 py-2 text-xs whitespace-nowrap">{formatDate(entry.action_date)}</TableCell>
                <TableCell className="px-3 py-2 text-xs font-medium">{entry.details?.candidate_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.performed_by_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.cv_filename || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.applicant_type || '-'}</TableCell>
              </TableRow>
            )}
          />

          {/* HR Interview Activities */}
          <ActivitySection
            title="HR Interview Activities"
            icon={<UserCheck className="w-4 h-4 text-indigo-600" />}
            entries={hrLogs}
            isLoading={isLoading}
            emptyMessage="No HR interview activities in this date range"
            headers={['Action', 'Date', 'Candidate', 'JO', 'Interview Date', 'Interviewer', 'Verdict']}
            renderRow={(entry) => (
              <TableRow key={entry.id} className="hover:bg-muted/30">
                <TableCell className="px-3 py-2 text-xs">
                  <Badge variant="outline" className="text-xs">{activityTypeLabels[entry.activity_type] || entry.activity_type}</Badge>
                </TableCell>
                <TableCell className="px-3 py-2 text-xs whitespace-nowrap">{formatDate(entry.action_date)}</TableCell>
                <TableCell className="px-3 py-2 text-xs font-medium">{entry.details?.candidate_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.jo_number || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{formatShortDate(entry.details?.interview_date)}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.performed_by_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs"><VerdictBadge verdict={entry.details?.verdict} /></TableCell>
              </TableRow>
            )}
          />

          {/* Tech Interview Activities */}
          <ActivitySection
            title="Tech Interview Activities"
            icon={<Cpu className="w-4 h-4 text-purple-600" />}
            entries={techLogs}
            isLoading={isLoading}
            emptyMessage="No tech interview activities in this date range"
            headers={['Action', 'Date', 'Candidate', 'JO', 'Interview Date', 'Interviewer', 'Verdict']}
            renderRow={(entry) => (
              <TableRow key={entry.id} className="hover:bg-muted/30">
                <TableCell className="px-3 py-2 text-xs">
                  <Badge variant="outline" className="text-xs">{activityTypeLabels[entry.activity_type] || entry.activity_type}</Badge>
                </TableCell>
                <TableCell className="px-3 py-2 text-xs whitespace-nowrap">{formatDate(entry.action_date)}</TableCell>
                <TableCell className="px-3 py-2 text-xs font-medium">{entry.details?.candidate_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.jo_number || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{formatShortDate(entry.details?.interview_date)}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.performed_by_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs"><VerdictBadge verdict={entry.details?.verdict} /></TableCell>
              </TableRow>
            )}
          />

          {/* Offer Activities */}
          <ActivitySection
            title="Offer Activities"
            icon={<Gift className="w-4 h-4 text-emerald-600" />}
            entries={offerLogs}
            isLoading={isLoading}
            emptyMessage="No offer activities in this date range"
            headers={['Action', 'Date', 'Candidate', 'JO', 'Amount', 'Status', 'Start Date']}
            renderRow={(entry) => (
              <TableRow key={entry.id} className="hover:bg-muted/30">
                <TableCell className="px-3 py-2 text-xs">
                  <Badge variant="outline" className="text-xs">{activityTypeLabels[entry.activity_type] || entry.activity_type}</Badge>
                </TableCell>
                <TableCell className="px-3 py-2 text-xs whitespace-nowrap">{formatDate(entry.action_date)}</TableCell>
                <TableCell className="px-3 py-2 text-xs font-medium">{entry.details?.candidate_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.jo_number || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.offer_amount || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.status || entry.details?.new_status || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{formatShortDate(entry.details?.start_date)}</TableCell>
              </TableRow>
            )}
          />

          {/* Profile Changes */}
          <ActivitySection
            title="Candidate Profile Changes"
            icon={<UserCog className="w-4 h-4 text-orange-600" />}
            entries={profileLogs}
            isLoading={isLoading}
            emptyMessage="No profile changes in this date range"
            headers={['Date', 'Candidate', 'Field Changed', 'Old Value', 'New Value', 'Changed By', 'Source']}
            renderRow={(entry) => (
              <TableRow key={entry.id} className="hover:bg-muted/30">
                <TableCell className="px-3 py-2 text-xs whitespace-nowrap">{formatDate(entry.action_date)}</TableCell>
                <TableCell className="px-3 py-2 text-xs font-medium">{entry.details?.candidate_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.field_changed || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.old_value || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.new_value || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.performed_by_name || '-'}</TableCell>
                <TableCell className="px-3 py-2 text-xs">{entry.details?.source || '-'}</TableCell>
              </TableRow>
            )}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Showing {allLogs.length} activities • {datePreset === 'today' ? 'Today' : `Last ${datePreset.replace('d', ' days')}`}
        </p>
      </motion.div>
    </div>
  );
}

import { useState, useMemo, Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Briefcase, Clock, TrendingUp, Award, UserCheck,
  ChevronDown, ChevronUp, Timer, Building2, Layers,
  Target, Activity, Hourglass, CalendarCheck, X, RefreshCw, Loader2, Gift,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAnalytics, type AnalyticsFilters } from '@/hooks/useAnalytics';
import { useApp } from '@/context/AppContext';
import { levelLabels, pipelineStatusLabels } from '@/data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

// ── Color palette ──
const PIPELINE_COLORS: Record<string, string> = {
  hr_interview: 'hsl(217, 91%, 60%)',
  tech_interview: 'hsl(280, 65%, 60%)',
  offer: 'hsl(142, 71%, 45%)',
  hired: 'hsl(86, 61%, 41%)',
  rejected: 'hsl(0, 84%, 60%)',
};
const DEPT_COLORS = ['hsl(217, 91%, 60%)', 'hsl(280, 65%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(192, 80%, 45%)', 'hsl(320, 70%, 55%)', 'hsl(50, 90%, 45%)'];
const VERDICT_COLORS: Record<string, string> = { pass: 'hsl(142, 71%, 45%)', fail: 'hsl(0, 84%, 60%)', conditional: 'hsl(38, 92%, 50%)', pending: 'hsl(0, 0%, 70%)' };
const OFFER_COLORS: Record<string, string> = { pending: 'hsl(38, 92%, 50%)', accepted: 'hsl(142, 71%, 45%)', rejected: 'hsl(0, 84%, 60%)', withdrawn: 'hsl(0, 0%, 65%)', expired: 'hsl(0, 0%, 45%)' };
const SOURCE_COLORS = ['hsl(86, 61%, 41%)', 'hsl(217, 91%, 60%)'];
const SCORE_COLORS: Record<string, string> = { '90-100': 'hsl(142, 71%, 45%)', '80-89': 'hsl(86, 61%, 41%)', '70-79': 'hsl(192, 80%, 45%)', '60-69': 'hsl(38, 92%, 50%)', '50-59': 'hsl(25, 90%, 55%)', 'Below 50': 'hsl(0, 84%, 60%)' };
const WORK_SETUP_LABELS: Record<string, string> = { 'on-site': 'On-site', hybrid: 'Hybrid', remote: 'Remote', flexible: 'Flexible' };

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

// ── Shared Collapsible Section with scroll-triggered animation ──
function Section({ title, icon, description, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; description?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2.5">
            {icon}
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {open && (
          <div className="border-t px-5 pb-5 pt-4">
            <ChartGuard>{children}</ChartGuard>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ── KPI Card with scroll-triggered stagger ──
function KpiCard({ label, value, sub, icon, color, index = 0 }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className={cn('flex items-center gap-2 mb-1', color)}>
            {icon}
            <span className="text-xs font-medium">{label}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {value}
            {sub && <span className="text-sm font-normal text-muted-foreground ml-1">{sub}</span>}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Mini Table ──
function MiniTable({ headers, rows, emptyText }: { headers: string[]; rows: React.ReactNode[][]; emptyText?: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">{emptyText || 'No data available'}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            {headers.map((h, i) => <th key={i} className="px-3 py-2 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-muted/20">
              {row.map((cell, ci) => <td key={ci} className="px-3 py-2">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── No Data placeholder ──
function NoData({ message }: { message?: string }) {
  return <p className="text-sm text-muted-foreground text-center py-8">{message || 'No data for the current filters.'}</p>;
}

// ── Safe number parse ──
function n(v: any, fallback = 0): number {
  const parsed = Number(v);
  return isNaN(parsed) ? fallback : parsed;
}

// ── Error boundary for chart sections ──
class ChartGuard extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.warn('[ChartGuard]', error.message); }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <p className="text-sm text-muted-foreground text-center py-4">Chart unavailable — try refreshing.</p>;
    }
    return this.props.children;
  }
}

// =====================================================
// MAIN PAGE
// =====================================================
export default function AnalyticsPage() {
  const { jobOrders, isVectorized } = useApp();
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const { data, isLoading, isError, refetch } = useAnalytics(filters);

  // Get unique departments from JOs for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    jobOrders.forEach(jo => { if (jo.department) set.add(jo.department); });
    return Array.from(set).sort();
  }, [jobOrders]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Derived chart data ──
  const pipelineData = useMemo(() =>
    (data?.pipeline || []).map(r => ({
      name: pipelineStatusLabels[r.status as keyof typeof pipelineStatusLabels] || r.status,
      value: n(r.count),
      status: r.status,
    })),
    [data?.pipeline]
  );

  const funnelData = useMemo(() => {
    if (!data?.funnel) return [];
    const f = data.funnel;
    return [
      { name: 'Applied', value: n(f.total), fill: 'hsl(0, 0%, 65%)' },
      { name: 'HR Interview', value: n(f.reached_hr), fill: PIPELINE_COLORS.hr_interview },
      { name: 'Tech Interview', value: n(f.reached_tech), fill: PIPELINE_COLORS.tech_interview },
      { name: 'Offer', value: n(f.reached_offer), fill: PIPELINE_COLORS.offer },
      { name: 'Hired', value: n(f.reached_hired), fill: PIPELINE_COLORS.hired },
    ].filter(s => s.value > 0);
  }, [data?.funnel]);

  const monthlyTrendData = useMemo(() => {
    const map: Record<string, { month: string; hires: number; applications: number }> = {};
    (data?.monthlyApplications || []).forEach(r => {
      map[r.month] = { month: r.month, hires: 0, applications: n(r.applications) };
    });
    (data?.monthlyHires || []).forEach(r => {
      if (!map[r.month]) map[r.month] = { month: r.month, hires: 0, applications: 0 };
      map[r.month].hires = n(r.hires);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map(r => ({
      ...r,
      label: new Date(r.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }));
  }, [data?.monthlyHires, data?.monthlyApplications]);

  const interviewTrendData = useMemo(() => {
    const map: Record<string, { month: string; label: string; hr: number; tech: number }> = {};
    (data?.interviewVolume || []).forEach(r => {
      if (!map[r.month]) {
        map[r.month] = {
          month: r.month,
          label: new Date(r.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          hr: 0, tech: 0,
        };
      }
      if (r.type === 'hr') map[r.month].hr = n(r.count);
      if (r.type === 'tech') map[r.month].tech = n(r.count);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [data?.interviewVolume]);

  const deptChartData = useMemo(() =>
    (data?.byDepartment || []).slice(0, 8).map(r => {
      const dept = r.department || 'Unknown';
      return {
        name: dept.length > 18 ? dept.slice(0, 18) + '…' : dept,
        fullName: dept,
        total: n(r.total), hired: n(r.hired), rejected: n(r.rejected), active: n(r.active),
      };
    }),
    [data?.byDepartment]
  );

  const levelChartData = useMemo(() =>
    (data?.byLevel || []).map(r => ({
      name: levelLabels[r.level as keyof typeof levelLabels] || r.level || 'Unknown',
      total: n(r.total), hired: n(r.hired), rejected: n(r.rejected),
    })),
    [data?.byLevel]
  );

  const scoreDistData = useMemo(() => {
    const order = ['90-100', '80-89', '70-79', '60-69', '50-59', 'Below 50'];
    return order.map(bucket => {
      const found = (data?.scoreDistribution || []).find(r => r.bucket === bucket);
      return { name: bucket, value: n(found?.count) };
    });
  }, [data?.scoreDistribution]);

  // ── Early returns ──
  if (!isVectorized) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No Data Available</h2>
          <p className="text-muted-foreground">Upload and vectorize candidate CVs to see analytics.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5">

        {/* ════════════ HEADER + GLOBAL FILTERS ════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">In-depth recruitment metrics &amp; insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filters.department || '__all__'} onValueChange={v => setFilters(prev => ({ ...prev, department: v === '__all__' ? undefined : v }))}>
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.level || '__all__'} onValueChange={v => setFilters(prev => ({ ...prev, level: v === '__all__' ? undefined : v }))}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <Layers className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Levels</SelectItem>
                {Object.entries(levelLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={
                filters.start_date
                  ? (() => {
                      const ms = Date.now() - new Date(filters.start_date).getTime();
                      const d = Math.round(ms / 86400000);
                      if (d <= 8) return '7d';
                      if (d <= 31) return '30d';
                      if (d <= 91) return '90d';
                      if (d <= 181) return '6m';
                      if (d <= 366) return '1y';
                      return '1y';
                    })()
                  : '__all__'
              }
              onValueChange={v => {
                if (v === '__all__') setFilters(prev => ({ ...prev, start_date: undefined, end_date: undefined }));
                else {
                  const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
                  setFilters(prev => ({ ...prev, start_date: new Date(Date.now() - (days[v] || 30) * 86400000).toISOString(), end_date: undefined }));
                }
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <CalendarCheck className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={() => setFilters({})}>
                <X className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            )}

            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Failed to load analytics. Please try again.
          </div>
        )}

        {isLoading && !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <>
            {/* ════════════ KPI CARDS ════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <KpiCard index={0} label="Hired This Month" value={n(data.kpis?.hired_this_month)} icon={<UserCheck className="w-4 h-4" />} color="text-primary" />
              <KpiCard index={1} label="Total Hired" value={n(data.kpis?.total_hired)} icon={<Award className="w-4 h-4" />} color="text-emerald-600" />
              <KpiCard index={2} label="Avg Time to Hire" value={data.kpis?.avg_time_to_hire ?? '-'} sub={data.kpis?.avg_time_to_hire != null ? 'days' : undefined} icon={<Clock className="w-4 h-4" />} color="text-blue-600" />
              <KpiCard index={3} label="Active Jobs" value={n(data.kpis?.active_jobs)} icon={<Briefcase className="w-4 h-4" />} color="text-violet-600" />
              <KpiCard index={4} label="Active Pipeline" value={n(data.kpis?.active_pipeline)} icon={<Activity className="w-4 h-4" />} color="text-amber-600" />
              <KpiCard index={5} label="Total Applications" value={n(data.kpis?.total_applications)} icon={<Users className="w-4 h-4" />} color="text-slate-600" />
              <KpiCard index={6} label="Unique Candidates" value={n(data.kpis?.unique_candidates)} icon={<Users className="w-4 h-4" />} color="text-cyan-600" />
              <KpiCard index={7} label="Avg Score" value={data.kpis?.avg_match_score ?? '-'} icon={<Target className="w-4 h-4" />} color="text-orange-600" />
            </div>

            {/* ════════════ FUNNEL & PIPELINE ════════════ */}
            <Section title="Recruitment Funnel & Pipeline" icon={<TrendingUp className="w-4 h-4 text-primary" />} description="Conversion rates through each stage">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel conversion bars */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stage Conversion</h4>
                  {funnelData.length === 0 ? <NoData /> : (
                    <div className="space-y-2">
                      {funnelData.map((stage, i) => {
                        const pct = funnelData[0].value > 0 ? Math.round((stage.value / funnelData[0].value) * 100) : 0;
                        const dropoff = i > 0 ? funnelData[i - 1].value - stage.value : 0;
                        const dropoffPct = i > 0 && funnelData[i - 1].value > 0 ? Math.round((dropoff / funnelData[i - 1].value) * 100) : 0;
                        return (
                          <div key={stage.name}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-medium text-foreground">{stage.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{stage.value}</span>
                                <span className="text-muted-foreground">({pct}%)</span>
                                {i > 0 && dropoff > 0 && (
                                  <span className="text-red-500 text-[10px]">-{dropoff} ({dropoffPct}%)</span>
                                )}
                              </div>
                            </div>
                            <div className="h-6 bg-muted/50 rounded-md overflow-hidden">
                              <div className="h-full rounded-md transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: stage.fill }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pipeline pie chart */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Current Pipeline Distribution</h4>
                  {pipelineData.length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value"
                          label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ''}>
                          {pipelineData.map(entry => (
                            <Cell key={entry.status} fill={PIPELINE_COLORS[entry.status] || 'hsl(0,0%,70%)'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </Section>

            {/* ════════════ TIME & TURNAROUND ════════════ */}
            <Section title="Time-to-Fill & Turnaround" icon={<Timer className="w-4 h-4 text-blue-600" />} description="How fast are we hiring?">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Avg time per stage */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Average Days per Stage</h4>
                  {(data.avgStageDuration || []).length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={(data.avgStageDuration || []).map(r => ({
                        name: pipelineStatusLabels[r.stage as keyof typeof pipelineStatusLabels] || r.stage,
                        avg: n(r.avg_duration), max: n(r.max_duration), stage: r.stage,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v} days`, name === 'avg' ? 'Average' : 'Maximum']} />
                        <Bar dataKey="avg" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="avg" />
                        <Bar dataKey="max" fill="hsl(217, 91%, 80%)" radius={[4, 4, 0, 0]} name="max" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Department turnaround */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Avg Days to Hire by Department</h4>
                  {(data.deptTurnaround || []).length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={(data.deptTurnaround || []).map(r => {
                        const dept = r.department || 'Unknown';
                        return { name: dept.length > 16 ? dept.slice(0, 16) + '…' : dept, days: n(r.avg_days), hires: n(r.hires) };
                      })} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: 'Days', position: 'insideBottom', offset: -5, style: { fontSize: 10 } }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} days`, 'Avg Time to Hire']} />
                        <Bar dataKey="days" fill="hsl(280, 65%, 60%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Time-to-fill table per JO */}
              {(data.timeToFill || []).length > 0 && (
                <div className="mt-5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Time-to-Fill by Job Order</h4>
                  <MiniTable
                    headers={['Job Order', 'Department', 'Hires', 'Avg Days', 'Min', 'Max']}
                    rows={(data.timeToFill || []).slice(0, 10).map(r => [
                      <span className="font-medium text-foreground text-xs truncate max-w-[200px] block">{r.jo_title}</span>,
                      <span className="text-xs text-muted-foreground">{r.department || '-'}</span>,
                      <Badge variant="secondary" className="text-xs">{n(r.hires)}</Badge>,
                      <span className="font-bold text-sm">{n(r.avg_days_to_hire)}d</span>,
                      <span className="text-xs text-muted-foreground">{n(r.min_days)}d</span>,
                      <span className="text-xs text-muted-foreground">{n(r.max_days)}d</span>,
                    ])}
                  />
                </div>
              )}
            </Section>

            {/* ════════════ PIPELINE AGING ════════════ */}
            <Section title="Pipeline Aging" icon={<Hourglass className="w-4 h-4 text-amber-600" />} description="How long are candidates sitting in each stage?">
              {(data.aging || []).length === 0 ? <NoData /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(data.aging || []).map(stage => (
                    <Card key={stage.status} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIPELINE_COLORS[stage.status] || '#999' }} />
                        <span className="text-xs font-semibold text-foreground">
                          {pipelineStatusLabels[stage.status as keyof typeof pipelineStatusLabels] || stage.status}
                        </span>
                        <Badge variant="secondary" className="ml-auto text-xs">{n(stage.count)}</Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Average</span><span className="font-bold">{n(stage.avg_days)} days</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Min</span><span>{n(stage.min_days)} days</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Max</span>
                          <span className={cn(n(stage.max_days) > 14 ? 'text-red-600 font-bold' : '')}>{n(stage.max_days)} days</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Section>

            {/* ════════════ DEPARTMENT & LEVEL ════════════ */}
            <Section title="Department & Level Breakdown" icon={<Building2 className="w-4 h-4 text-violet-600" />} description="Applications, hires, and rejections by department and level">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Department</h4>
                  {deptChartData.length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={deptChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="active" stackId="a" fill="hsl(217, 91%, 60%)" name="Active" />
                        <Bar dataKey="hired" stackId="a" fill="hsl(142, 71%, 45%)" name="Hired" />
                        <Bar dataKey="rejected" stackId="a" fill="hsl(0, 84%, 60%)" name="Rejected" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Level</h4>
                  {levelChartData.length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={levelChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="total" fill="hsl(217, 91%, 60%)" name="Total" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="hired" fill="hsl(142, 71%, 45%)" name="Hired" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="rejected" fill="hsl(0, 84%, 60%)" name="Rejected" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Department detail table */}
              {(data.byDepartment || []).length > 0 && (
                <div className="mt-5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Department Summary</h4>
                  <MiniTable
                    headers={['Department', 'Total', 'Active', 'Hired', 'Rejected', 'Hire Rate']}
                    rows={(data.byDepartment || []).map(r => {
                      const hireRate = n(r.total) > 0 ? Math.round((n(r.hired) / n(r.total)) * 100) : 0;
                      return [
                        <span className="font-medium text-foreground text-xs">{r.department}</span>,
                        <span className="font-bold text-sm">{n(r.total)}</span>,
                        <span className="text-sm">{n(r.active)}</span>,
                        <span className="text-emerald-600 font-medium text-sm">{n(r.hired)}</span>,
                        <span className="text-red-500 text-sm">{n(r.rejected)}</span>,
                        <Badge variant={hireRate >= 30 ? 'default' : 'secondary'} className="text-xs">{hireRate}%</Badge>,
                      ];
                    })}
                  />
                </div>
              )}
            </Section>

            {/* ════════════ SOURCE & QUALITY ════════════ */}
            <Section title="Candidate Source & Quality" icon={<Users className="w-4 h-4 text-cyan-600" />} description="Internal vs External, score distribution, work setup">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Internal vs External */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Applicant Type</h4>
                  {(data.bySource || []).length === 0 ? <NoData /> : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={(data.bySource || []).map(r => ({
                            name: r.source === 'internal' ? 'Internal' : 'External',
                            value: n(r.count),
                          }))} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value"
                            label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ''}>
                            {(data.bySource || []).map((_, i) => (
                              <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-2">
                        {(data.bySource || []).map(r => (
                          <div key={r.source} className="flex items-center justify-between text-xs">
                            <span className="capitalize font-medium">{r.source || 'Unknown'}</span>
                            <div className="flex gap-3">
                              <span>Avg Score: <strong>{r.avg_score ?? '-'}</strong></span>
                              <span>Hired: <strong className="text-emerald-600">{n(r.hired)}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Score distribution */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Qualification Score Distribution</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={scoreDistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Candidates">
                        {scoreDistData.map(entry => (
                          <Cell key={entry.name} fill={SCORE_COLORS[entry.name] || '#999'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Work setup */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Work Setup Preference</h4>
                  {(data.workSetup || []).length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={(data.workSetup || []).map(r => ({
                          name: WORK_SETUP_LABELS[r.setup] || r.setup || 'Unknown',
                          value: n(r.count),
                        }))} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                          label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ''}>
                          {(data.workSetup || []).map((_, i) => (
                            <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </Section>

            {/* ════════════ INTERVIEWS ════════════ */}
            <Section title="Interview Analytics" icon={<UserCheck className="w-4 h-4 text-emerald-600" />} description="Volume, pass rates, and verdict distribution">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Interview volume over time */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Interview Volume by Month</h4>
                  {interviewTrendData.length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={interviewTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="hr" fill="hsl(217, 91%, 60%)" name="HR Interviews" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="tech" fill="hsl(280, 65%, 60%)" name="Tech Interviews" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* HR verdicts */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">HR Interview Verdicts</h4>
                  {(data.hrVerdicts || []).length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={(data.hrVerdicts || []).map(r => ({
                          name: (r.verdict || 'Unknown').charAt(0).toUpperCase() + (r.verdict || 'unknown').slice(1),
                          value: n(r.count), verdict: r.verdict,
                        }))} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                          label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ''}>
                          {(data.hrVerdicts || []).map(r => (
                            <Cell key={r.verdict} fill={VERDICT_COLORS[r.verdict] || '#999'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Tech verdicts */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tech Interview Verdicts</h4>
                  {(data.techVerdicts || []).length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={(data.techVerdicts || []).map(r => ({
                          name: (r.verdict || 'Unknown').charAt(0).toUpperCase() + (r.verdict || 'unknown').slice(1),
                          value: n(r.count), verdict: r.verdict,
                        }))} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                          label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ''}>
                          {(data.techVerdicts || []).map(r => (
                            <Cell key={r.verdict} fill={VERDICT_COLORS[r.verdict] || '#999'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </Section>

            {/* ════════════ OFFERS ════════════ */}
            <Section title="Offer Analytics" icon={<Gift className="w-4 h-4 text-orange-500" />} description="Offer status distribution and acceptance rates">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Offer Status Breakdown</h4>
                  {(data.offers || []).length === 0 ? <NoData /> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(data.offers || []).map(r => (
                        <Card key={r.status} className="p-3 text-center">
                          <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: OFFER_COLORS[r.status] || '#999' }} />
                          <p className="text-xs text-muted-foreground capitalize">{r.status}</p>
                          <p className="text-xl font-bold text-foreground">{n(r.count)}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Offer Summary</h4>
                  {(() => {
                    const total = (data.offers || []).reduce((s, r) => s + n(r.count), 0);
                    const accepted = n((data.offers || []).find(r => r.status === 'accepted')?.count);
                    const rejected = n((data.offers || []).find(r => r.status === 'rejected')?.count);
                    const pending = n((data.offers || []).find(r => r.status === 'pending')?.count);
                    if (total === 0) return <NoData />;
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Total Offers</span>
                          <span className="font-bold text-lg">{total}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Acceptance Rate</span>
                          <span className="font-bold text-emerald-600">{total > 0 ? Math.round((accepted / total) * 100) : 0}%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Rejection Rate</span>
                          <span className="font-bold text-red-500">{total > 0 ? Math.round((rejected / total) * 100) : 0}%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Pending</span>
                          <span className="font-bold text-amber-600">{pending}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </Section>

            {/* ════════════ MONTHLY TRENDS ════════════ */}
            <Section title="Monthly Trends" icon={<TrendingUp className="w-4 h-4 text-primary" />} description="Hiring velocity and application volume over time">
              {monthlyTrendData.length === 0 ? <NoData /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="applications" stroke="hsl(217, 91%, 60%)" strokeWidth={2} name="Applications" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="hires" stroke="hsl(142, 71%, 45%)" strokeWidth={2} name="Hires" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Section>

            {/* ════════════ JO FILL RATE ════════════ */}
            <Section title="Job Order Fill Rate" icon={<Target className="w-4 h-4 text-red-500" />} description="Position fill progress per job order" defaultOpen={false}>
              {(data.fillRate || []).length === 0 ? <NoData /> : (
                <MiniTable
                  headers={['Job Order', 'Department', 'Level', 'Status', 'Filled', 'Fill %', 'Days Open']}
                  rows={(data.fillRate || []).map(r => {
                    const pct = n(r.fill_pct);
                    return [
                      <span className="font-medium text-foreground text-xs truncate max-w-[200px] block">{r.title}</span>,
                      <span className="text-xs text-muted-foreground">{r.department || '-'}</span>,
                      <Badge variant="outline" className="text-xs">{levelLabels[r.level as keyof typeof levelLabels] || r.level}</Badge>,
                      <Badge variant={r.jo_status === 'open' ? 'default' : 'secondary'} className="text-xs capitalize">{r.jo_status}</Badge>,
                      <span className="text-sm font-medium">{n(r.hired_count)}/{n(r.quantity)}</span>,
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400')}
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium">{pct}%</span>
                      </div>,
                      <span className={cn('text-xs font-medium', Math.round(n(r.days_open)) > 30 ? 'text-red-600' : 'text-muted-foreground')}>
                        {Math.round(n(r.days_open))}d
                      </span>,
                    ];
                  })}
                />
              )}
            </Section>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}

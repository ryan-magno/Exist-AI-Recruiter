import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  Clock, 
  TrendingUp, 
  Award, 
  GraduationCap, 
  Upload, 
  UserCheck, 
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';

const COLORS = ['hsl(86, 61%, 41%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 84%, 60%)'];

export default function AnalyticsPage() {
  const { candidates, jobOrders, isVectorized } = useApp();

  // Calculate KPIs
  const kpis = useMemo(() => {
    const hiredThisMonth = candidates.filter(c => {
      const isHired = c.pipelineStatus === 'hired';
      const hiredDate = new Date(c.statusChangedDate);
      const now = new Date();
      return isHired && hiredDate.getMonth() === now.getMonth() && hiredDate.getFullYear() === now.getFullYear();
    }).length;

    const avgTimeToHire = candidates
      .filter(c => c.pipelineStatus === 'hired')
      .reduce((acc, c) => {
        const applied = new Date(c.appliedDate);
        const hired = new Date(c.statusChangedDate);
        return acc + Math.floor((hired.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / Math.max(candidates.filter(c => c.pipelineStatus === 'hired').length, 1);

    const activeJobs = jobOrders.filter(jo => jo.status === 'in-progress' || jo.status === 'draft').length;
    const totalCandidates = candidates.length;
    const internalCandidates = candidates.filter(c => c.applicantType === 'internal').length;
    const externalCandidates = candidates.filter(c => c.applicantType === 'external').length;

    return {
      hiredThisMonth,
      avgTimeToHire: Math.round(avgTimeToHire),
      activeJobs,
      totalCandidates,
      internalCandidates,
      externalCandidates
    };
  }, [candidates, jobOrders]);

  // Pipeline distribution
  const pipelineData = useMemo(() => {
    const counts = {
      'For HR Interview': candidates.filter(c => c.pipelineStatus === 'new-match').length,
      'For Tech Interview': candidates.filter(c => c.pipelineStatus === 'hr-interview').length,
      'Offer': candidates.filter(c => c.pipelineStatus === 'offer').length,
      'Hired': candidates.filter(c => c.pipelineStatus === 'hired').length,
      'Rejected': candidates.filter(c => c.pipelineStatus === 'rejected').length,
    };
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [candidates]);

  // Top departments by applications
  const departmentData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    candidates.forEach(c => {
      const jo = jobOrders.find(j => j.id === c.assignedJoId);
      if (jo?.department) {
        deptCounts[jo.department] = (deptCounts[jo.department] || 0) + 1;
      }
    });
    return Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [candidates, jobOrders]);

  // Educational background distribution
  const educationData = useMemo(() => {
    const eduCounts: Record<string, number> = {};
    candidates.forEach(c => {
      if (c.educationalBackground) {
        // Extract school name (simplified)
        const school = c.educationalBackground.split(',')[0]?.trim() || 'Unknown';
        eduCounts[school] = (eduCounts[school] || 0) + 1;
      }
    });
    return Object.entries(eduCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, value }));
  }, [candidates]);

  // Internal vs External
  const applicantTypeData = useMemo(() => [
    { name: 'Internal', value: kpis.internalCandidates },
    { name: 'External', value: kpis.externalCandidates },
  ], [kpis]);

  // Tech interview pass rate
  const techInterviewData = useMemo(() => {
    const passed = candidates.filter(c => c.techInterviewResult === 'pass').length;
    const failed = candidates.filter(c => c.techInterviewResult === 'fail').length;
    const pending = candidates.filter(c => c.techInterviewResult === 'pending').length;
    return [
      { name: 'Passed', value: passed },
      { name: 'Failed', value: failed },
      { name: 'Pending', value: pending },
    ];
  }, [candidates]);

  if (!isVectorized) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
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
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Key metrics and insights</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <UserCheck className="w-4 h-4" />
                <span className="text-xs font-medium">Hired This Month</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.hiredThisMonth}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Avg Time to Hire</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.avgTimeToHire} <span className="text-sm font-normal text-muted-foreground">days</span></p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-violet-600 mb-1">
                <Briefcase className="w-4 h-4" />
                <span className="text-xs font-medium">Active Jobs</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.activeJobs}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">Total Candidates</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.totalCandidates}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-xs font-medium">Internal</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.internalCandidates}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Upload className="w-4 h-4" />
                <span className="text-xs font-medium">External</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.externalCandidates}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pipeline Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pipeline Distribution</CardTitle>
              <CardDescription>Candidates by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(86, 61%, 41%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Internal vs External */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Applicant Type</CardTitle>
              <CardDescription>Internal vs External candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={applicantTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {applicantTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Departments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Departments</CardTitle>
              <CardDescription>Most applications by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tech Interview Results */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tech Interview Results</CardTitle>
              <CardDescription>Pass/Fail/Pending distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={techInterviewData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    <Cell fill="hsl(142, 71%, 45%)" />
                    <Cell fill="hsl(0, 84%, 60%)" />
                    <Cell fill="hsl(0, 0%, 70%)" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Schools Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Top Schools
            </CardTitle>
            <CardDescription>Where our candidates come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={educationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" fill="hsl(280, 65%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { azureDb } from '@/lib/azureDb';

export interface AnalyticsFilters {
  department?: string;
  level?: string;
  start_date?: string;
  end_date?: string;
}

export interface AnalyticsData {
  kpis: {
    total_hired: number;
    hired_this_month: number;
    active_jobs: number;
    total_applications: number;
    unique_candidates: number;
    active_pipeline: number;
    avg_time_to_hire: number | null;
    avg_match_score: number | null;
  };
  pipeline: Array<{ status: string; count: number }>;
  byDepartment: Array<{
    department: string;
    total: number;
    hired: number;
    rejected: number;
    active: number;
  }>;
  byLevel: Array<{
    level: string;
    total: number;
    hired: number;
    rejected: number;
  }>;
  bySource: Array<{
    source: string;
    count: number;
    avg_score: number | null;
    hired: number;
  }>;
  funnel: {
    total: number;
    reached_hr: number;
    reached_tech: number;
    reached_offer: number;
    reached_hired: number;
  };
  aging: Array<{
    status: string;
    avg_days: number;
    max_days: number;
    min_days: number;
    count: number;
  }>;
  timeToFill: Array<{
    jo_id: string;
    jo_title: string;
    department: string;
    quantity: number;
    hired_count: number;
    avg_days_to_hire: number;
    min_days: number;
    max_days: number;
    hires: number;
  }>;
  avgStageDuration: Array<{
    stage: string;
    avg_duration: number | null;
    max_duration: number | null;
    min_duration: number | null;
    transitions: number;
  }>;
  deptTurnaround: Array<{
    department: string;
    avg_days: number;
    hires: number;
  }>;
  monthlyHires: Array<{ month: string; hires: number }>;
  monthlyApplications: Array<{ month: string; applications: number }>;
  interviewVolume: Array<{ month: string; type: string; count: number }>;
  hrVerdicts: Array<{ verdict: string; count: number }>;
  techVerdicts: Array<{ verdict: string; count: number }>;
  offers: Array<{ status: string; count: number }>;
  fillRate: Array<{
    id: string;
    title: string;
    department: string;
    level: string;
    quantity: number;
    hired_count: number;
    jo_status: string;
    fill_pct: number | null;
    days_open: number;
  }>;
  scoreDistribution: Array<{ bucket: string; count: number }>;
  workSetup: Array<{ setup: string; count: number }>;
}

export function useAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics', filters],
    queryFn: () => azureDb.analytics.get(filters),
    staleTime: 30_000, // 30s
    refetchOnWindowFocus: false,
  });
}

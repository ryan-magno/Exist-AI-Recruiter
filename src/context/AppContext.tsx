import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useJobOrders, useUpdateJobOrder, useCreateJobOrder, useDeleteJobOrder, JobOrder as DBJobOrder, JobOrderInsert } from '@/hooks/useJobOrders';
import { useUpdateApplicationStatus, PipelineStatus } from '@/hooks/useApplications';
import { azureDb } from '@/lib/azureDb';
import { toast } from 'sonner';

// Legacy types for compatibility
import { 
  Candidate as LegacyCandidate, 
  JobOrder as LegacyJobOrder, 
  PipelineStatus as LegacyPipelineStatus,
  TechInterviewResult as LegacyTechInterviewResult,
  HRInterviewForm,
  TechInterviewForm 
} from '@/data/mockData';

// DB Tech interview result to legacy mapping
const dbTechResultToLegacy: Record<string, LegacyTechInterviewResult> = {
  'pending': 'pending',
  'passed': 'pass',
  'failed': 'fail',
  'pass': 'pass',
  'fail': 'fail',
  'conditional': 'conditional'
};

// DB pipeline status to legacy mapping
const dbPipelineToLegacy: Record<string, LegacyPipelineStatus> = {
  'new': 'hr_interview',
  'screening': 'hr_interview',
  'for_hr_interview': 'hr_interview',
  'hr_interview': 'hr_interview',
  'for_tech_interview': 'tech_interview',
  'tech_interview': 'tech_interview',
  'offer': 'offer',
  'hired': 'hired',
  'rejected': 'rejected',
  'withdrawn': 'rejected',
};

// Fetch candidates from Azure DB and convert to legacy format
async function fetchLegacyCandidates(): Promise<LegacyCandidate[]> {
  const [applicationsData, candidatesData] = await Promise.all([
    azureDb.applications.list(),
    azureDb.candidates.list()
  ]);

  const candidateMap = new Map<string, any>();
  candidatesData.forEach((c: any) => candidateMap.set(c.id, c));

  // Fetch offers in parallel
  const offerMap = new Map<string, string>();
  try {
    const offerResults = await Promise.allSettled(
      applicationsData.map((app: any) => azureDb.offers.get(app.id))
    );
    offerResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value?.status) {
        offerMap.set(applicationsData[i].id, result.value.status);
      }
    });
  } catch {
    // Offers fetch failed, continue without
  }

  return applicationsData.map((app: any) => {
    const candidate = candidateMap.get(app.candidate_id) || {};
    
    let expectedSalary = candidate.expected_salary || '';
    if (expectedSalary && !expectedSalary.includes('₱') && !expectedSalary.toLowerCase().includes('php')) {
      expectedSalary = `₱${expectedSalary}`;
    }
    
    return {
      id: app.candidate_id,
      applicationId: app.id,
      name: app.candidate_name || candidate.full_name || 'Unknown',
      email: app.candidate_email || candidate.email || '',
      phone: candidate.phone || '',
      linkedIn: candidate.linkedin || '',
      matchScore: candidate.qualification_score || parseFloat(app.match_score) || 0,
      pipelineStatus: dbPipelineToLegacy[app.pipeline_status] || (app.pipeline_status as LegacyPipelineStatus) || 'hr_interview',
      statusChangedDate: app.status_changed_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      techInterviewResult: dbTechResultToLegacy[app.tech_interview_result] || 'pending',
      skills: app.skills || candidate.skills || [],
      experience: `${app.years_of_experience || candidate.years_of_experience || 0} years`,
      experienceDetails: {
        totalYears: app.years_of_experience || candidate.years_of_experience || 0,
        breakdown: candidate.years_of_experience_text || ''
      },
      matchReasons: [],
      matchAnalysis: {
        summary: candidate.overall_summary || '',
        strengths: candidate.strengths || [],
        weaknesses: candidate.weaknesses || []
      },
      workingConditions: app.working_conditions || '',
      remarks: app.remarks || '',
      techNotes: '',
      employmentType: 'full_time' as const,
      positionApplied: app.job_title || (candidate.positions_fit_for?.[0]) || 'Not specified',
      expectedSalary: expectedSalary,
      earliestStartDate: candidate.earliest_start_date || '',
      currentPosition: candidate.current_position || '',
      currentCompany: candidate.current_company || '',
      assignedJoId: app.job_order_id,
      educationalBackground: candidate.educational_background || '',
      relevantWorkExperience: '',
      keySkills: app.skills || candidate.skills || [],
      appliedDate: app.applied_date?.split('T')[0] || '',
      timeline: [],
      applicantType: candidate.applicant_type || 'external',
      workExperiences: [],
      applicationHistory: [],
      offerStatus: (offerMap.get(app.id) as LegacyCandidate['offerStatus']) || undefined,
      qualificationScore: candidate.qualification_score || undefined,
      overallSummary: candidate.overall_summary || undefined,
      strengths: candidate.strengths || [],
      weaknesses: candidate.weaknesses || [],
      internalUploadReason: candidate.internal_upload_reason || undefined,
      internalFromDate: candidate.internal_from_date || undefined,
      internalToDate: candidate.internal_to_date || undefined,
      googleDriveFileUrl: candidate.google_drive_file_url || undefined,
      googleDriveFileId: candidate.google_drive_file_id || undefined,
      preferredEmploymentType: candidate.preferred_employment_type || undefined,
      batchId: candidate.batch_id || undefined,
      batchCreatedAt: candidate.batch_created_at || undefined,
      positionsFitFor: candidate.positions_fit_for || [],
    };
  });
}

interface AppContextType {
  isVectorized: boolean;
  setIsVectorized: (value: boolean) => void;
  candidates: LegacyCandidate[];
  setCandidates: React.Dispatch<React.SetStateAction<LegacyCandidate[]>>;
  jobOrders: LegacyJobOrder[];
  setJobOrders: React.Dispatch<React.SetStateAction<LegacyJobOrder[]>>;
  selectedJoId: string | null;
  setSelectedJoId: (id: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  updateCandidatePipelineStatus: (candidateId: string, status: LegacyPipelineStatus) => void;
  updateCandidateTechInterviewResult: (candidateId: string, result: LegacyTechInterviewResult) => void;
  updateCandidateWorkingConditions: (candidateId: string, conditions: string) => void;
  updateCandidateRemarks: (candidateId: string, remarks: string) => void;
  updateCandidateTechNotes: (candidateId: string, notes: string) => void;
  updateCandidateHRForm: (candidateId: string, form: HRInterviewForm) => void;
  updateCandidateTechForm: (candidateId: string, form: TechInterviewForm) => void;
  updateJobOrderStatus: (joId: string, status: LegacyJobOrder['status']) => void;
  updateJobOrder: (joId: string, updates: Partial<LegacyJobOrder>) => void;
  addJobOrder: (jo: Omit<LegacyJobOrder, 'id' | 'joNumber' | 'createdDate' | 'candidateIds' | 'hiredCount'>) => void;
  deleteJobOrder: (joId: string) => void;
  unarchiveJobOrder: (joId: string) => void;
  deleteCandidate: (candidateId: string) => void;
  getMatchesForJo: (joId: string) => LegacyCandidate[];
  getAllCandidates: () => LegacyCandidate[];
  isFindingMatches: boolean;
  setIsFindingMatches: (value: boolean) => void;
  markJoAsFulfilled: (joId: string) => void;
  dbJobOrders: DBJobOrder[];
  isLoadingJobOrders: boolean;
  initializeDatabase: () => Promise<void>;
  refreshCandidates: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isVectorized, setIsVectorized] = useState(false);
  const [jobOrders, setJobOrders] = useState<LegacyJobOrder[]>([]);
  const [selectedJoId, setSelectedJoId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFindingMatches, setIsFindingMatches] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Database hooks
  const { data: dbJobOrders = [], isLoading: isLoadingJobOrders } = useJobOrders();
  const updateJobOrderMutation = useUpdateJobOrder();
  const createJobOrderMutation = useCreateJobOrder();
  const deleteJobOrderMutation = useDeleteJobOrder();
  const updateApplicationStatusMutation = useUpdateApplicationStatus();

  // Candidates managed by React Query
  const { data: candidates = [] } = useQuery({
    queryKey: ['legacy-candidates'],
    queryFn: fetchLegacyCandidates,
    enabled: isInitialized,
  });

  // Set vectorized flag when candidates are available
  useEffect(() => {
    if (candidates.length > 0) {
      setIsVectorized(true);
    }
  }, [candidates]);

  // setCandidates now updates the React Query cache
  const setCandidates: React.Dispatch<React.SetStateAction<LegacyCandidate[]>> = useCallback((action) => {
    queryClient.setQueryData<LegacyCandidate[]>(['legacy-candidates'], (old = []) => {
      return typeof action === 'function' ? action(old) : action;
    });
  }, [queryClient]);

  // refreshCandidates invalidates the query
  const refreshCandidates = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['legacy-candidates'] });
  }, [queryClient]);

  // Initialize Azure PostgreSQL database
  const initializeDatabase = async () => {
    if (isInitialized) return;
    try {
      console.log('Initializing Azure PostgreSQL database...');
      await azureDb.init();
      setIsInitialized(true);
      console.log('Database initialized successfully');
      queryClient.invalidateQueries({ queryKey: ['job-orders'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      // legacy-candidates will auto-fetch once isInitialized becomes true
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  };

  // Auto-initialize on mount
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Sync database job orders to legacy state
  useEffect(() => {
    if (dbJobOrders.length > 0) {
      const legacyJOs: LegacyJobOrder[] = dbJobOrders.map(jo => ({
        id: jo.id,
        joNumber: jo.jo_number,
        title: jo.title,
        description: jo.description || '',
        level: jo.level as LegacyJobOrder['level'],
        quantity: jo.quantity,
        hiredCount: jo.hired_count,
        requiredDate: jo.required_date || '',
        createdDate: jo.created_at.split('T')[0],
        status: jo.status as LegacyJobOrder['status'],
        candidateIds: [],
        department: jo.department_name || '',
        employmentType: jo.employment_type as LegacyJobOrder['employmentType'],
        requestorName: jo.requestor_name || ''
      }));
      setJobOrders(legacyJOs);
    }
  }, [dbJobOrders]);

  const handleHiredCandidate = async (joId: string, candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate?.pipelineStatus === 'hired') return;

    const jo = dbJobOrders.find(j => j.id === joId);
    if (!jo) return;
    
    const newHiredCount = jo.hired_count + 1;
    const isFulfilled = newHiredCount >= jo.quantity;
    
    try {
      await updateJobOrderMutation.mutateAsync({
        id: joId,
        updates: { 
          hired_count: newHiredCount,
          status: isFulfilled ? 'closed' : jo.status
        }
      });
      
      if (isFulfilled) {
        toast.success('JO Fulfilled!', {
          description: `${jo.jo_number} has reached its hiring target (${newHiredCount}/${jo.quantity}). Would you like to close it?`,
          action: {
            label: 'Close JO',
            onClick: () => markJoAsFulfilled(joId)
          },
          duration: 10000
        });
      } else {
        toast.success(`Candidate hired! ${jo.quantity - newHiredCount} more position(s) to fill.`);
      }
    } catch (error) {
      console.error('Error updating hired count:', error);
    }
  };

  const updateCandidatePipelineStatus = async (candidateId: string, status: LegacyPipelineStatus) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.pipelineStatus === status) return;

    const previousStatus = candidate.pipelineStatus;

    // Optimistic update via cache
    setCandidates(prev => 
      prev.map(c => c.id === candidateId ? { ...c, pipelineStatus: status, statusChangedDate: new Date().toISOString().split('T')[0] } : c)
    );

    const dbStatus = status as PipelineStatus;
    const previousDbStatus = previousStatus as PipelineStatus;

    if (candidate.applicationId) {
      try {
        await updateApplicationStatusMutation.mutateAsync({
          id: candidate.applicationId,
          status: dbStatus,
          previousStatus: previousDbStatus
        });
      } catch (error) {
        console.error('Error updating application status:', error);
        setCandidates(prev => 
          prev.map(c => c.id === candidateId ? { ...c, pipelineStatus: previousStatus } : c)
        );
        toast.error('Failed to update status');
        return;
      }
    }

    if (status === 'hired' && previousStatus !== 'hired' && candidate.assignedJoId) {
      handleHiredCandidate(candidate.assignedJoId, candidateId);
    }
  };

  const markJoAsFulfilled = async (joId: string) => {
    try {
      await updateJobOrderMutation.mutateAsync({
        id: joId,
        updates: { status: 'closed' }
      });
      toast.success('Job Order closed and moved to archive');
    } catch (error) {
      toast.error('Failed to close job order');
    }
  };

  const updateCandidateTechInterviewResult = (candidateId: string, result: LegacyTechInterviewResult) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, techInterviewResult: result } : c))
    );
  };

  const updateCandidateWorkingConditions = (candidateId: string, conditions: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, workingConditions: conditions } : c))
    );
  };

  const updateCandidateRemarks = (candidateId: string, remarks: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, remarks: remarks } : c))
    );
  };

  const updateCandidateTechNotes = (candidateId: string, notes: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, techNotes: notes } : c))
    );
  };

  const updateCandidateHRForm = (candidateId: string, form: HRInterviewForm) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, hrInterviewForm: form } : c))
    );
  };

  const updateCandidateTechForm = (candidateId: string, form: TechInterviewForm) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, techInterviewForm: form } : c))
    );
  };

  const updateJobOrderStatus = async (joId: string, status: LegacyJobOrder['status']) => {
    try {
      await updateJobOrderMutation.mutateAsync({
        id: joId,
        updates: { status: status as DBJobOrder['status'] }
      });
    } catch (error) {
      toast.error('Failed to update job order status');
    }
  };

  const updateJobOrder = async (joId: string, updates: Partial<LegacyJobOrder>) => {
    try {
      const dbUpdates: Partial<DBJobOrder> = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.level) dbUpdates.level = updates.level as DBJobOrder['level'];
      if (updates.quantity) dbUpdates.quantity = updates.quantity;
      if (updates.requiredDate) dbUpdates.required_date = updates.requiredDate;
      if (updates.status) dbUpdates.status = updates.status as DBJobOrder['status'];
      if (updates.department) dbUpdates.department_name = updates.department;
      if (updates.employmentType) {
        dbUpdates.employment_type = updates.employmentType as DBJobOrder['employment_type'];
      }
      if (updates.requestorName) dbUpdates.requestor_name = updates.requestorName;
      
      await updateJobOrderMutation.mutateAsync({ id: joId, updates: dbUpdates });
    } catch (error) {
      toast.error('Failed to update job order');
    }
  };

  const addJobOrder = async (jo: Omit<LegacyJobOrder, 'id' | 'joNumber' | 'createdDate' | 'candidateIds' | 'hiredCount'>) => {
    try {
      const { count } = await azureDb.jobOrders.count();
      const joNumber = `JO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
      
      const newJO: JobOrderInsert = {
        jo_number: joNumber,
        title: jo.title,
        description: jo.description,
        level: jo.level as DBJobOrder['level'],
        quantity: jo.quantity,
        required_date: jo.requiredDate || null,
        status: (jo.status || 'open') as DBJobOrder['status'],
        department_name: jo.department,
        employment_type: jo.employmentType as DBJobOrder['employment_type'],
        requestor_name: jo.requestorName
      };

      await createJobOrderMutation.mutateAsync(newJO);
    } catch (error) {
      console.error('Error creating job order:', error);
      toast.error('Failed to create job order');
    }
  };

  const deleteJobOrder = async (joId: string) => {
    try {
      await deleteJobOrderMutation.mutateAsync(joId);
      toast.success('Job Order deleted permanently');
    } catch (error) {
      toast.error('Failed to delete job order');
    }
  };

  const unarchiveJobOrder = async (joId: string) => {
    try {
      await updateJobOrderMutation.mutateAsync({
        id: joId,
        updates: { status: 'open' }
      });
      toast.success('Job Order restored to active');
    } catch (error) {
      toast.error('Failed to restore job order');
    }
  };

  const deleteCandidate = async (candidateId: string) => {
    try {
      await azureDb.candidates.delete(candidateId);
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      toast.success('Candidate removed');
    } catch (error) {
      toast.error('Failed to delete candidate');
    }
  };

  const getMatchesForJo = (joId: string): LegacyCandidate[] => {
    if (!isVectorized) return [];
    return candidates.filter(c => c.assignedJoId === joId);
  };

  const getAllCandidates = (): LegacyCandidate[] => {
    if (!isVectorized) return [];
    return candidates;
  };

  return (
    <AppContext.Provider
      value={{
        isVectorized,
        setIsVectorized,
        candidates,
        setCandidates,
        jobOrders,
        setJobOrders,
        selectedJoId,
        setSelectedJoId,
        sidebarCollapsed,
        setSidebarCollapsed,
        updateCandidatePipelineStatus,
        updateCandidateTechInterviewResult,
        updateCandidateWorkingConditions,
        updateCandidateRemarks,
        updateCandidateTechNotes,
        updateCandidateHRForm,
        updateCandidateTechForm,
        updateJobOrderStatus,
        updateJobOrder,
        addJobOrder,
        deleteJobOrder,
        unarchiveJobOrder,
        deleteCandidate,
        getMatchesForJo,
        getAllCandidates,
        isFindingMatches,
        setIsFindingMatches,
        markJoAsFulfilled,
        dbJobOrders,
        isLoadingJobOrders,
        initializeDatabase,
        refreshCandidates
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

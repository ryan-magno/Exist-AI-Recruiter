import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJobOrders, useUpdateJobOrder, useCreateJobOrder, useDeleteJobOrder } from '@/hooks/useJobOrders';
import { useApplicationsForJobOrder, useUpdateApplicationStatus, PipelineStatus, TechInterviewResult } from '@/hooks/useApplications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables, Enums } from '@/integrations/supabase/types';

// Re-export types from database
export type DBJobOrder = Tables<'job_orders'>;
export type DBCandidate = Tables<'candidates'>;
export type DBApplication = Tables<'candidate_job_applications'>;

// Legacy types for compatibility
import { 
  Candidate as LegacyCandidate, 
  JobOrder as LegacyJobOrder, 
  PipelineStatus as LegacyPipelineStatus,
  TechInterviewResult as LegacyTechInterviewResult,
  HRInterviewForm,
  TechInterviewForm 
} from '@/data/mockData';

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
  // Database state
  dbJobOrders: DBJobOrder[];
  isLoadingJobOrders: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to map database pipeline status to legacy status
function mapDbStatusToLegacy(dbStatus: PipelineStatus): LegacyPipelineStatus {
  const mapping: Record<string, LegacyPipelineStatus> = {
    'new': 'new-match',
    'screening': 'new-match',
    'for_hr_interview': 'new-match',
    'for_tech_interview': 'hr-interview',
    'offer': 'offer',
    'hired': 'hired',
    'rejected': 'rejected',
    'withdrawn': 'rejected'
  };
  return mapping[dbStatus] || 'new-match';
}

// Helper to map legacy status to database status
function mapLegacyStatusToDb(legacyStatus: LegacyPipelineStatus): PipelineStatus {
  const mapping: Record<LegacyPipelineStatus, PipelineStatus> = {
    'new-match': 'for_hr_interview',
    'hr-interview': 'for_tech_interview',
    'offer': 'offer',
    'hired': 'hired',
    'rejected': 'rejected'
  };
  return mapping[legacyStatus];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isVectorized, setIsVectorized] = useState(false);
  const [candidates, setCandidates] = useState<LegacyCandidate[]>([]);
  const [jobOrders, setJobOrders] = useState<LegacyJobOrder[]>([]);
  const [selectedJoId, setSelectedJoId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFindingMatches, setIsFindingMatches] = useState(false);

  // Database hooks
  const { data: dbJobOrders = [], isLoading: isLoadingJobOrders } = useJobOrders();
  const updateJobOrderMutation = useUpdateJobOrder();
  const createJobOrderMutation = useCreateJobOrder();
  const deleteJobOrderMutation = useDeleteJobOrder();
  const updateApplicationStatusMutation = useUpdateApplicationStatus();

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
        employmentType: (jo.employment_type === 'regular' ? 'full-time' : jo.employment_type) as LegacyJobOrder['employmentType'],
        requestorName: jo.requestor_name || ''
      }));
      setJobOrders(legacyJOs);
    }
  }, [dbJobOrders]);

  const handleHiredCandidate = async (joId: string, candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate?.pipelineStatus === 'hired') {
      return;
    }

    const jo = dbJobOrders.find(j => j.id === joId);
    if (!jo) return;
    
    const newHiredCount = jo.hired_count + 1;
    const isFulfilled = newHiredCount >= jo.quantity;
    
    try {
      await updateJobOrderMutation.mutateAsync({
        id: joId,
        updates: { 
          hired_count: newHiredCount,
          status: isFulfilled ? 'fulfilled' : jo.status
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
    // Find the application for this candidate
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.pipelineStatus === status) return;

    // Update local state immediately for responsiveness
    setCandidates(prev => 
      prev.map(c => c.id === candidateId ? { ...c, pipelineStatus: status, statusChangedDate: new Date().toISOString().split('T')[0] } : c)
    );

    // If moving to hired, handle the job order update
    if (status === 'hired' && candidate.pipelineStatus !== 'hired' && candidate.assignedJoId) {
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
        updates: { status: status as Enums<'job_order_status'> }
      });
    } catch (error) {
      toast.error('Failed to update job order status');
    }
  };

  const updateJobOrder = async (joId: string, updates: Partial<LegacyJobOrder>) => {
    try {
      const dbUpdates: Partial<Tables<'job_orders'>> = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.level) dbUpdates.level = updates.level as Enums<'job_level'>;
      if (updates.quantity) dbUpdates.quantity = updates.quantity;
      if (updates.requiredDate) dbUpdates.required_date = updates.requiredDate;
      if (updates.status) dbUpdates.status = updates.status as Enums<'job_order_status'>;
      if (updates.department) dbUpdates.department_name = updates.department;
      if (updates.employmentType) {
        dbUpdates.employment_type = (updates.employmentType === 'full-time' ? 'regular' : updates.employmentType) as Enums<'employment_type'>;
      }
      if (updates.requestorName) dbUpdates.requestor_name = updates.requestorName;
      
      await updateJobOrderMutation.mutateAsync({ id: joId, updates: dbUpdates });
    } catch (error) {
      toast.error('Failed to update job order');
    }
  };

  const addJobOrder = async (jo: Omit<LegacyJobOrder, 'id' | 'joNumber' | 'createdDate' | 'candidateIds' | 'hiredCount'>) => {
    try {
      // Get the count for JO number generation
      const { count } = await supabase
        .from('job_orders')
        .select('*', { count: 'exact', head: true });
      
      const joNumber = `JO-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;
      
      await createJobOrderMutation.mutateAsync({
        jo_number: joNumber,
        title: jo.title,
        description: jo.description,
        level: jo.level as Enums<'job_level'>,
        quantity: jo.quantity,
        required_date: jo.requiredDate || null,
        status: (jo.status || 'draft') as Enums<'job_order_status'>,
        department_name: jo.department,
        employment_type: (jo.employmentType === 'full-time' ? 'regular' : jo.employmentType) as Enums<'employment_type'>,
        requestor_name: jo.requestorName
      });
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
        updates: { status: 'in-progress' }
      });
      toast.success('Job Order restored to active');
    } catch (error) {
      toast.error('Failed to restore job order');
    }
  };

  const deleteCandidate = async (candidateId: string) => {
    try {
      await supabase.from('candidates').delete().eq('id', candidateId);
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
        isLoadingJobOrders
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

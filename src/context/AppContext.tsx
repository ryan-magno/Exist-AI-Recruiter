import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockCandidates, mockJobOrders, Candidate, JobOrder, PipelineStatus, TechInterviewResult, TimelineEntry } from '@/data/mockData';
import { toast } from 'sonner';

interface AppContextType {
  isVectorized: boolean;
  setIsVectorized: (value: boolean) => void;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  jobOrders: JobOrder[];
  setJobOrders: React.Dispatch<React.SetStateAction<JobOrder[]>>;
  selectedJoId: string | null;
  setSelectedJoId: (id: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  updateCandidatePipelineStatus: (candidateId: string, status: PipelineStatus) => void;
  updateCandidateTechInterviewResult: (candidateId: string, result: TechInterviewResult) => void;
  updateCandidateWorkingConditions: (candidateId: string, conditions: string) => void;
  updateCandidateRemarks: (candidateId: string, remarks: string) => void;
  updateCandidateTechNotes: (candidateId: string, notes: string) => void;
  updateJobOrderStatus: (joId: string, status: JobOrder['status']) => void;
  updateJobOrder: (joId: string, updates: Partial<JobOrder>) => void;
  addJobOrder: (jo: Omit<JobOrder, 'id' | 'joNumber' | 'createdDate' | 'candidateIds' | 'hiredCount'>) => void;
  deleteJobOrder: (joId: string) => void;
  unarchiveJobOrder: (joId: string) => void;
  deleteCandidate: (candidateId: string) => void;
  getMatchesForJo: (joId: string) => Candidate[];
  getAllCandidates: () => Candidate[];
  isFindingMatches: boolean;
  setIsFindingMatches: (value: boolean) => void;
  markJoAsFulfilled: (joId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isVectorized, setIsVectorized] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(mockJobOrders);
  const [selectedJoId, setSelectedJoId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFindingMatches, setIsFindingMatches] = useState(false);

  const handleHiredCandidate = (joId: string, candidateId: string) => {
    // Check if this candidate was already counted as hired (to prevent double counting)
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate?.pipelineStatus === 'hired') {
      return; // Already hired, don't increment again
    }

    setJobOrders(prev => {
      const jo = prev.find(j => j.id === joId);
      if (!jo) return prev;
      
      const newHiredCount = jo.hiredCount + 1;
      const isFulfilled = newHiredCount >= jo.quantity;
      
      if (isFulfilled) {
        toast.success('JO Fulfilled!', {
          description: `${jo.joNumber} has reached its hiring target (${newHiredCount}/${jo.quantity}). Would you like to close it?`,
          action: {
            label: 'Close JO',
            onClick: () => markJoAsFulfilled(joId)
          },
          duration: 10000
        });
      } else {
        toast.success(`Candidate hired! ${jo.quantity - newHiredCount} more position(s) to fill.`);
      }
      
      return prev.map(j => 
        j.id === joId 
          ? { ...j, hiredCount: newHiredCount, status: isFulfilled ? 'fulfilled' : j.status }
          : j
      );
    });
  };

  const updateCandidatePipelineStatus = (candidateId: string, status: PipelineStatus) => {
    const today = new Date().toISOString().split('T')[0];
    
    setCandidates(prev => {
      const candidate = prev.find(c => c.id === candidateId);
      
      if (!candidate || candidate.pipelineStatus === status) {
        return prev;
      }

      const previousStatusDate = new Date(candidate.statusChangedDate);
      const currentDate = new Date(today);
      const durationDays = Math.floor((currentDate.getTime() - previousStatusDate.getTime()) / (1000 * 60 * 60 * 24));

      const newTimelineEntry: TimelineEntry = {
        id: `t${candidateId}-${Date.now()}`,
        fromStatus: candidate.pipelineStatus,
        toStatus: status,
        date: today,
        durationDays
      };

      const updatedCandidates = prev.map(c => 
        c.id === candidateId 
          ? { 
              ...c, 
              pipelineStatus: status,
              statusChangedDate: today,
              timeline: [...(c.timeline || []), newTimelineEntry]
            } 
          : c
      );
      
      if (status === 'hired' && candidate.pipelineStatus !== 'hired') {
        if (candidate.assignedJoId) {
          handleHiredCandidate(candidate.assignedJoId, candidateId);
        }
      }
      
      return updatedCandidates;
    });
  };

  const markJoAsFulfilled = (joId: string) => {
    setJobOrders(prev =>
      prev.map(jo => (jo.id === joId ? { ...jo, status: 'closed' } : jo))
    );
    toast.success('Job Order closed and moved to archive');
  };

  const updateCandidateTechInterviewResult = (candidateId: string, result: TechInterviewResult) => {
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

  const updateJobOrderStatus = (joId: string, status: JobOrder['status']) => {
    setJobOrders(prev =>
      prev.map(jo => (jo.id === joId ? { ...jo, status } : jo))
    );
  };

  const updateJobOrder = (joId: string, updates: Partial<JobOrder>) => {
    setJobOrders(prev =>
      prev.map(jo => (jo.id === joId ? { ...jo, ...updates } : jo))
    );
  };

  const addJobOrder = (jo: Omit<JobOrder, 'id' | 'joNumber' | 'createdDate' | 'candidateIds' | 'hiredCount'>) => {
    const newJo: JobOrder = {
      ...jo,
      id: `jo${Date.now()}`,
      joNumber: `JO-2024-${String(jobOrders.length + 1).padStart(3, '0')}`,
      createdDate: new Date().toISOString().split('T')[0],
      candidateIds: [],
      hiredCount: 0
    };
    setJobOrders(prev => [newJo, ...prev]);
  };

  const deleteJobOrder = (joId: string) => {
    setJobOrders(prev => prev.filter(jo => jo.id !== joId));
    toast.success('Job Order deleted permanently');
  };

  const unarchiveJobOrder = (joId: string) => {
    setJobOrders(prev =>
      prev.map(jo => (jo.id === joId ? { ...jo, status: 'in-progress' as JobOrder['status'] } : jo))
    );
    toast.success('Job Order restored to active');
  };

  const deleteCandidate = (candidateId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    toast.success('Candidate removed');
  };

  const getMatchesForJo = (joId: string): Candidate[] => {
    if (!isVectorized) return [];
    return candidates.filter(c => c.assignedJoId === joId);
  };

  const getAllCandidates = (): Candidate[] => {
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
        markJoAsFulfilled
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
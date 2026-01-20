import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockCandidates, mockJobOrders, Candidate, JobOrder, PipelineStatus, ShortlistDecision } from '@/data/mockData';
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
  updateCandidateShortlistDecision: (candidateId: string, decision: ShortlistDecision) => void;
  updateCandidateHrNotes: (candidateId: string, notes: string) => void;
  updateCandidateTechNotes: (candidateId: string, notes: string) => void;
  updateJobOrderStatus: (joId: string, status: JobOrder['status']) => void;
  addJobOrder: (jo: Omit<JobOrder, 'id' | 'joNumber' | 'createdDate' | 'candidateIds' | 'hiredCount'>) => void;
  deleteJobOrder: (joId: string) => void;
  unarchiveJobOrder: (joId: string) => void;
  getMatchesForJo: (joId: string) => Candidate[];
  getAllCandidates: () => Candidate[];
  isFindingMatches: boolean;
  setIsFindingMatches: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isVectorized, setIsVectorized] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(mockJobOrders);
  const [selectedJoId, setSelectedJoId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFindingMatches, setIsFindingMatches] = useState(false);

  const updateCandidatePipelineStatus = (candidateId: string, status: PipelineStatus) => {
    setCandidates(prev => {
      const updatedCandidates = prev.map(c => 
        c.id === candidateId ? { ...c, pipelineStatus: status } : c
      );
      
      // If marking as hired, update the job order hired count
      if (status === 'hired') {
        const candidate = prev.find(c => c.id === candidateId);
        if (candidate?.assignedJoId) {
          handleHiredCandidate(candidate.assignedJoId);
        }
      }
      
      return updatedCandidates;
    });
  };

  const handleHiredCandidate = (joId: string) => {
    setJobOrders(prev => {
      const jo = prev.find(j => j.id === joId);
      if (!jo) return prev;
      
      const newHiredCount = jo.hiredCount + 1;
      const isFulfilled = newHiredCount >= jo.quantity;
      
      if (isFulfilled) {
        // Show fulfillment dialog via toast
        toast.success('JO Fulfilled!', {
          description: `${jo.joNumber} has reached its hiring target. Moving to archive.`,
          action: {
            label: 'View Archive',
            onClick: () => window.location.href = '/archive'
          }
        });
      }
      
      return prev.map(j => 
        j.id === joId 
          ? { ...j, hiredCount: newHiredCount, status: isFulfilled ? 'fulfilled' : j.status }
          : j
      );
    });
  };

  const updateCandidateShortlistDecision = (candidateId: string, decision: ShortlistDecision) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, shortlistDecision: decision } : c))
    );
  };

  const updateCandidateHrNotes = (candidateId: string, notes: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, hrNotes: notes } : c))
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
        updateCandidateShortlistDecision,
        updateCandidateHrNotes,
        updateCandidateTechNotes,
        updateJobOrderStatus,
        addJobOrder,
        deleteJobOrder,
        unarchiveJobOrder,
        getMatchesForJo,
        getAllCandidates,
        isFindingMatches,
        setIsFindingMatches
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

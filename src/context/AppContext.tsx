import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockCandidates, mockJobOrders, Candidate, JobOrder } from '@/data/mockData';

interface AppContextType {
  isVectorized: boolean;
  setIsVectorized: (value: boolean) => void;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  jobOrders: JobOrder[];
  setJobOrders: React.Dispatch<React.SetStateAction<JobOrder[]>>;
  selectedJoId: string | null;
  setSelectedJoId: (id: string | null) => void;
  updateCandidateStatus: (candidateId: string, status: Candidate['status']) => void;
  updateCandidateNotes: (candidateId: string, notes: string) => void;
  updateJobOrderStatus: (joId: string, status: JobOrder['status']) => void;
  addJobOrder: (jo: Omit<JobOrder, 'id' | 'joNumber' | 'createdDate' | 'candidateIds'>) => void;
  getMatchesForJo: (joId: string) => Candidate[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isVectorized, setIsVectorized] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(mockJobOrders);
  const [selectedJoId, setSelectedJoId] = useState<string | null>(null);

  const updateCandidateStatus = (candidateId: string, status: Candidate['status']) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, status } : c))
    );
  };

  const updateCandidateNotes = (candidateId: string, notes: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, notes } : c))
    );
  };

  const updateJobOrderStatus = (joId: string, status: JobOrder['status']) => {
    setJobOrders(prev =>
      prev.map(jo => (jo.id === joId ? { ...jo, status } : jo))
    );
  };

  const addJobOrder = (jo: Omit<JobOrder, 'id' | 'joNumber' | 'createdDate' | 'candidateIds'>) => {
    const newJo: JobOrder = {
      ...jo,
      id: `jo${Date.now()}`,
      joNumber: `JO-2024-${String(jobOrders.length + 1).padStart(3, '0')}`,
      createdDate: new Date().toISOString().split('T')[0],
      candidateIds: []
    };
    setJobOrders(prev => [newJo, ...prev]);
  };

  const getMatchesForJo = (joId: string): Candidate[] => {
    if (!isVectorized) return [];
    return candidates.filter(c => c.assignedJoId === joId);
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
        updateCandidateStatus,
        updateCandidateNotes,
        updateJobOrderStatus,
        addJobOrder,
        getMatchesForJo
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

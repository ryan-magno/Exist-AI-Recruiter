import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { RefreshNotification } from '@/components/ui/RefreshNotification';
import { useRealtimeCandidates } from '@/hooks/useRealtimeCandidates';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { newCandidatesCount, showRefreshPrompt, refreshData, dismissPrompt } = useRealtimeCandidates();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen transition-all duration-300 ml-16">
        {children}
      </main>
      
      <RefreshNotification
        show={showRefreshPrompt}
        candidateCount={newCandidatesCount}
        onRefresh={refreshData}
        onDismiss={dismissPrompt}
      />
    </div>
  );
}

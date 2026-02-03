import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { RefreshNotification } from '@/components/ui/RefreshNotification';
import { ProcessingIndicator } from '@/components/ui/ProcessingIndicator';
import { useRealtimeCandidates } from '@/hooks/useRealtimeCandidates';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { newCandidatesCount, showRefreshPrompt, processingCount, refreshData, dismissPrompt } = useRealtimeCandidates();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen transition-all duration-300 ml-16">
        {children}
      </main>
      
      {/* Processing indicator - shows when CVs are being analyzed */}
      <ProcessingIndicator count={processingCount} />
      
      {/* Refresh notification - shows when new candidates are ready */}
      <RefreshNotification
        show={showRefreshPrompt}
        candidateCount={newCandidatesCount}
        onRefresh={refreshData}
        onDismiss={dismissPrompt}
      />
    </div>
  );
}

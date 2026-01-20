import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}

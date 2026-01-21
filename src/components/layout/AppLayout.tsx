import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen transition-all duration-300 ml-16">
        {children}
      </main>
    </div>
  );
}

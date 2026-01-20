import { NavLink, useLocation } from 'react-router-dom';
import { Upload, LayoutDashboard, FilePlus, Archive, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

const navItems = [
  { path: '/upload', label: 'CV Ingestion', icon: Upload },
  { path: '/dashboard', label: 'Job Orders', icon: LayoutDashboard },
  { path: '/create-jo', label: 'Create JO', icon: FilePlus },
  { path: '/archive', label: 'Archive', icon: Archive },
];

export function Sidebar() {
  const location = useLocation();
  const { isVectorized } = useApp();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-sidebar-foreground">Exist AI</h1>
            <p className="text-xs text-muted-foreground">Recruiter</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'sidebar-item',
                isActive && 'sidebar-item-active'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Status Indicator */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg",
          isVectorized ? "bg-accent" : "bg-muted"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            isVectorized ? "bg-primary animate-pulse" : "bg-muted-foreground"
          )} />
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">
              {isVectorized ? 'AI Active' : 'Awaiting Data'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isVectorized ? 'Candidates matched' : 'Upload CVs to start'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

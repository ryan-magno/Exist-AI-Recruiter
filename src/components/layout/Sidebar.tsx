import { NavLink, useLocation } from 'react-router-dom';
import { Upload, Briefcase, FilePlus, Archive, Users, PanelLeft, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import existLogo from '@/assets/exist-logo.png';

const navItems = [
  { path: '/dashboard', label: 'Job Orders', icon: Briefcase },
  { path: '/create-jo', label: 'Create JO', icon: FilePlus },
  { path: '/archive', label: 'Archive', icon: Archive },
  { path: '/candidates', label: 'Candidates', icon: Users },
  { path: '/upload', label: 'Upload CV', icon: Upload },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card flex flex-col transition-all duration-300 z-50",
        sidebarCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "p-3 flex items-center",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center justify-center flex-1">
            <img 
              src={existLogo} 
              alt="Exist Software Labs" 
              className="h-8 object-contain"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-8 w-8 shrink-0"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-muted',
                isActive && 'bg-primary/10 text-primary border-l-4 border-primary -ml-0.5 pl-[10px]',
                !isActive && 'text-muted-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

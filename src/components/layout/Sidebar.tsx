import { NavLink, useLocation } from 'react-router-dom';
import { Upload, LayoutDashboard, FilePlus, Archive, Users, PanelLeft, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import existLogo from '@/assets/exist-logo.png';

const navItems = [
  { path: '/dashboard', label: 'Job Orders', icon: LayoutDashboard },
  { path: '/create-jo', label: 'Create JO', icon: FilePlus },
  { path: '/archive', label: 'Archive', icon: Archive },
  { path: '/candidates', label: 'Candidates', icon: Users },
  { path: '/upload', label: 'Upload CV', icon: Upload },
];

export function Sidebar() {
  const location = useLocation();
  const { isVectorized, sidebarCollapsed, setSidebarCollapsed } = useApp();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "p-4 border-b border-sidebar-border flex items-center",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center justify-center flex-1">
            <img 
              src={existLogo} 
              alt="Exist Software Labs" 
              className="h-10 object-contain"
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
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'sidebar-item',
                isActive && 'sidebar-item-active',
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

      {/* Status Indicator */}
      <div className={cn(
        "p-2 border-t border-sidebar-border",
        sidebarCollapsed && "px-1"
      )}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg",
          isVectorized ? "bg-accent" : "bg-muted",
          sidebarCollapsed && "justify-center px-0"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full shrink-0",
            isVectorized ? "bg-primary animate-pulse" : "bg-muted-foreground"
          )} />
          {!sidebarCollapsed && (
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">
                {isVectorized ? 'AI Active' : 'Awaiting Data'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isVectorized ? 'Candidates matched' : 'Upload CVs to start'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Upload, Briefcase, FilePlus, Archive, Users, BarChart3, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import existLogo from '@/assets/exist-logo.png';

const navItems = [
  { path: '/dashboard', label: 'Job Orders', icon: Briefcase },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/candidates', label: 'Candidates', icon: Users },
  { path: '/create-jo', label: 'Create JO', icon: FilePlus },
  { path: '/upload', label: 'Upload CV', icon: Upload },
  { path: '/archive', label: 'Archive', icon: Archive },
  { path: '/chatbot', label: 'AI Assistant', icon: Bot },
];

export function Sidebar() {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card flex flex-col z-50 border-r border-border",
        "transition-[width] duration-150 ease-out",
        isHovered ? "w-52" : "w-14"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-center px-2 border-b border-border">
        <img 
          src={existLogo} 
          alt="Exist Software Labs" 
          className={cn(
            "object-contain transition-all duration-150 ease-out",
            isHovered ? "h-7" : "h-6 w-6"
          )}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center h-10 rounded-lg text-sm font-medium',
                'transition-all duration-150 ease-out',
                'hover:bg-muted',
                isActive && 'bg-primary/10 text-primary',
                !isActive && 'text-muted-foreground',
                isHovered ? 'px-3 gap-3' : 'justify-center'
              )}
              title={!isHovered ? item.label : undefined}
            >
              <div className={cn(
                "flex items-center justify-center shrink-0",
                !isHovered && "w-10 h-10"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "whitespace-nowrap transition-opacity duration-100 ease-out",
                isHovered ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
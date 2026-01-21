import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Upload, Briefcase, FilePlus, Archive, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card flex flex-col transition-all duration-300 z-50 border-r border-border",
        isHovered ? "w-56" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-center px-3 border-b border-border">
        {isHovered ? (
          <img 
            src={existLogo} 
            alt="Exist Software Labs" 
            className="h-8 object-contain"
          />
        ) : (
          <img 
            src={existLogo} 
            alt="Exist Software Labs" 
            className="h-6 w-6 object-contain"
          />
        )}
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
                isActive && 'bg-primary/10 text-primary',
                !isActive && 'text-muted-foreground',
                !isHovered && 'justify-center px-2'
              )}
              title={!isHovered ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isHovered && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

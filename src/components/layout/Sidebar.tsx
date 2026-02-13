import { NavLink, useLocation } from 'react-router-dom';
import { Upload, Briefcase, FilePlus, Archive, Users, BarChart3, Bot, History, Droplets, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import existLogo from '@/assets/exist-logo.png';

const navItems = [
  { path: '/dashboard', label: 'Job Orders', icon: Briefcase },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/candidates', label: 'Candidates', icon: Users },
  { path: '/create-jo', label: 'Create JO', icon: FilePlus },
  { path: '/upload', label: 'Upload CV', icon: Upload },
  { path: '/archive', label: 'Archive', icon: Archive },
  { path: '/talent-pool', label: 'Talent Pool', icon: Droplets },
  { path: '/pooled-job-orders', label: 'Pooled JOs', icon: FolderOpen },
  { path: '/history', label: 'History', icon: History },
  { path: '/chatbot', label: 'AI Assistant', icon: Bot },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <nav className="w-16 bg-card border-r border-border flex flex-col items-center py-3 gap-1 flex-shrink-0 relative z-[60]">
      {/* Logo */}
      <div className="w-10 h-10 flex items-center justify-center mb-2">
        <img src={existLogo} alt="Exist Software Labs" className="h-6 w-6 object-contain" />
      </div>

      {/* Navigation Icons */}
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            aria-label={item.label}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-150',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            )}
          >
            <Icon className="w-5 h-5" />
          </NavLink>
        );
      })}
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { Inbox, BarChart3, Grid3X3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/admin/submissions', icon: Inbox, label: 'Submissions' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/prioritization', icon: Grid3X3, label: 'Prioritization' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
] as const;

export function AdminSidebar() {
  return (
    <aside className="flex w-[220px] flex-col border-r border-gray-800 bg-gray-900">
      <nav className="flex flex-1 flex-col gap-1 p-3 pt-4">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-2 border-blue bg-white/5 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <div className="text-xs text-gray-500">Signed in as</div>
        <div className="text-sm font-medium text-gray-300">OSI Admin</div>
      </div>
    </aside>
  );
}

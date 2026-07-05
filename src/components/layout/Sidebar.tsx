import { NavLink } from 'react-router-dom';
import { CalendarDays, LayoutGrid, Calendar, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/', label: 'Day', icon: CalendarDays, end: true },
  { to: '/timetable', label: 'Timetable', icon: LayoutGrid, end: false },
  { to: '/month', label: 'Month', icon: Calendar, end: false },
];

export function Sidebar() {
  const { preferences, setTheme, setSidebarCollapsed } = useAppStore();
  const collapsed = preferences.sidebarCollapsed;

  return (
    <aside
      className={cn(
        'flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 relative z-20',
        'sidebar-bg border-r border-base',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-base', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
          <span className="text-white text-xs font-bold">LP</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-primary">Life Planner</p>
            <p className="text-xs text-muted">Your productivity OS</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn('sidebar-item', isActive && 'active', collapsed && 'justify-center px-2')
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer controls */}
      <div className={cn('px-2 py-4 border-t border-base space-y-1', collapsed && 'flex flex-col items-center')}>
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(preferences.theme === 'dark' ? 'light' : 'dark')}
          className={cn('sidebar-item w-full', collapsed && 'justify-center px-2')}
          title="Toggle theme"
        >
          {preferences.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{preferences.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          className={cn('sidebar-item w-full', collapsed && 'justify-center px-2')}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

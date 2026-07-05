import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, LayoutGrid, Calendar, ChevronLeft, ChevronRight, Sun, Moon, LogOut, Shield } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';
import { AdminPanel } from '../admin/AdminPanel';

const NAV = [
  { to: '/', label: 'Day', icon: CalendarDays, end: true },
  { to: '/timetable', label: 'Timetable', icon: LayoutGrid, end: false },
  { to: '/month', label: 'Month', icon: Calendar, end: false },
];

export function Sidebar() {
  const { preferences, setTheme, setSidebarCollapsed } = useAppStore();
  const { user, signOut } = useAuthStore();
  const collapsed = preferences.sidebarCollapsed;
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 relative z-20',
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

        {/* Footer */}
        <div className={cn('px-2 py-4 border-t border-base space-y-1', collapsed && 'flex flex-col items-center')}>
          {/* User avatar */}
          {user && !collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-violet-400">{user.name?.[0] ?? '?'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary truncate">{user.name}</p>
                <p className="text-[10px] text-muted truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(preferences.theme === 'dark' ? 'light' : 'dark')}
            className={cn('sidebar-item w-full', collapsed && 'justify-center px-2')}
            title="Toggle theme"
          >
            {preferences.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span>{preferences.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Admin panel (owner only) */}
          {user?.isAdmin && (
            <button
              onClick={() => setShowAdmin(true)}
              className={cn('sidebar-item w-full', collapsed && 'justify-center px-2')}
              title="Manage Access"
              id="admin-panel-btn"
            >
              <Shield size={18} className="text-violet-400" />
              {!collapsed && <span>Manage Access</span>}
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!collapsed)}
            className={cn('sidebar-item w-full', collapsed && 'justify-center px-2')}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            className={cn('sidebar-item w-full hover:!bg-red-500/10 hover:!text-red-400', collapsed && 'justify-center px-2')}
            title="Sign Out"
            id="sidebar-signout-btn"
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}

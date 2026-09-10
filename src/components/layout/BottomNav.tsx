import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, LayoutGrid, Calendar, Sun, Moon, LogOut, Shield, Bell, BellOff, AlarmClock, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUpdateStore } from '../../store/useUpdateStore';
import { cn } from '../../lib/utils';
import { AdminPanel } from '../admin/AdminPanel';
import { AlarmSettingsModal } from '../shared/AlarmSettingsModal';

const NAV = [
  { to: '/', label: 'Day', icon: CalendarDays, end: true },
  { to: '/timetable', label: 'Timetable', icon: LayoutGrid, end: false },
  { to: '/month', label: 'Month', icon: Calendar, end: false },
];

export function BottomNav() {
  const { preferences, setTheme } = useAppStore();
  const { user, signOut } = useAuthStore();
  const { updateInfo, isChecking, checkForUpdates } = useUpdateStore();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlarmSettings, setShowAlarmSettings] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-base sidebar-bg safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Nav links */}
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]',
                  isActive ? 'text-violet-500' : 'text-muted'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('p-1.5 rounded-xl transition-all duration-150', isActive && 'bg-violet-500/15')}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                  <span className={cn('text-[10px] font-semibold tracking-wide', isActive ? 'text-violet-500' : 'text-muted')}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(preferences.theme === 'dark' ? 'light' : 'dark')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px] text-muted"
            title="Toggle theme"
          >
            <span className="p-1.5 rounded-xl">
              {preferences.theme === 'dark'
                ? <Sun size={20} strokeWidth={1.8} />
                : <Moon size={20} strokeWidth={1.8} />
              }
            </span>
            <span className="text-[10px] font-semibold tracking-wide">
              {preferences.theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* Alarm & Alert settings button */}
          <button
            onClick={() => setShowAlarmSettings(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]',
              preferences.notificationMode !== 'off' ? 'text-violet-500' : 'text-muted'
            )}
            title="Alarm & Alert Settings"
          >
            <span className={cn('p-1.5 rounded-xl', preferences.notificationMode !== 'off' && 'bg-violet-500/15')}>
              {preferences.notificationMode === 'off' && <BellOff size={20} strokeWidth={1.8} />}
              {preferences.notificationMode === 'notification' && <Bell size={20} strokeWidth={2} />}
              {preferences.notificationMode === 'alarm' && <AlarmClock size={20} strokeWidth={2} />}
              {preferences.notificationMode === 'both' && <Bell size={20} strokeWidth={2} className="text-green-400" />}
            </span>
            <span className="text-[10px] font-semibold tracking-wide">
              {preferences.notificationMode === 'off' && 'Alerts'}
              {preferences.notificationMode === 'notification' && 'Notif'}
              {preferences.notificationMode === 'alarm' && 'Alarm'}
              {preferences.notificationMode === 'both' && 'Both'}
            </span>
          </button>

          {/* User avatar button */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px] relative"
                id="mobile-user-menu-btn"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-violet-500/30" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-violet-400">{user.name?.[0] ?? '?'}</span>
                  </div>
                )}
                {updateInfo?.available && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-violet-400 ring-2 ring-background animate-pulse" />
                )}
                <span className="text-[10px] font-semibold text-muted tracking-wide">Me</span>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute bottom-full right-0 mb-2 card shadow-2xl w-48 py-1 animate-slide-up">
                  <div className="px-3 py-2 border-b border-base">
                    <p className="text-xs font-semibold text-primary truncate">{user.name}</p>
                    <p className="text-[10px] text-muted truncate">{user.email}</p>
                  </div>
                  {user.isAdmin && (
                    <button
                      onClick={() => { setShowAdmin(true); setShowUserMenu(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-secondary hover:bg-secondary-surface transition-colors"
                      id="mobile-admin-btn"
                    >
                      <Shield size={13} className="text-violet-400" />
                      Manage Access
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      void checkForUpdates(true);
                    }}
                    disabled={isChecking}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-xs text-secondary hover:bg-secondary-surface transition-colors"
                    id="mobile-check-updates-btn"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw size={13} className={cn(isChecking && 'animate-spin', updateInfo?.available && 'text-violet-400')} />
                      <span>{updateInfo?.available ? 'Update Available!' : 'Check Updates'}</span>
                    </div>
                    {updateInfo?.available && (
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                    )}
                  </button>
                  <button
                    onClick={() => { signOut(); setShowUserMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    id="mobile-signout-btn"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                  <div className="px-3 py-1.5 border-t border-base text-[10px] text-muted/60 font-mono text-center">
                    v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      <AlarmSettingsModal isOpen={showAlarmSettings} onClose={() => setShowAlarmSettings(false)} />
    </>
  );
}

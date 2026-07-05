import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, Shield, Users } from 'lucide-react';
import { getAdminUsers, patchUserStatus, type AdminUser } from '../../lib/api';
import { cn } from '../../lib/utils';

interface Props {
  onClose: () => void;
}

const STATUS_META = {
  pending:  { label: 'Pending',  icon: Clock,         cls: 'text-amber-400  bg-amber-400/10'  },
  approved: { label: 'Approved', icon: CheckCircle2,  cls: 'text-green-400  bg-green-400/10'  },
  denied:   { label: 'Denied',   icon: XCircle,       cls: 'text-red-400    bg-red-400/10'    },
} as const;

export function AdminPanel({ onClose }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAdminUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { void loadUsers(); }, []);

  const handleStatus = async (id: string, status: 'approved' | 'denied' | 'pending') => {
    setUpdating(id);
    await patchUserStatus(id, status);
    await loadUsers();
    setUpdating(null);
  };

  const pending  = users.filter(u => u.status === 'pending');
  const approved = users.filter(u => u.status === 'approved' && !u.isAdmin);
  const denied   = users.filter(u => u.status === 'denied');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-violet-400" />
            <h2 className="text-base font-semibold text-primary">Access Management</h2>
            {pending.length > 0 && (
              <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold bg-amber-400/15 text-amber-400">
                {pending.length} pending
              </span>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Users size={32} className="text-muted" />
              <p className="text-sm text-muted">No users have signed in yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-base">
              {[...pending, ...approved, ...denied].map(user => {
                const meta = STATUS_META[user.status as keyof typeof STATUS_META];
                const Icon = meta.icon;
                const isUpdating = updating === user.id;

                return (
                  <div key={user.id} className={cn('flex items-center gap-3 px-5 py-4', isUpdating && 'opacity-50')}>
                    {/* Avatar */}
                    <div className="shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-400">{user.name?.[0] ?? '?'}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{user.name || 'Unknown'}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>

                    {/* Status badge */}
                    <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold shrink-0', meta.cls)}>
                      <Icon size={11} />
                      {meta.label}
                    </span>

                    {/* Actions (not for admin/owner) */}
                    {!user.isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        {user.status !== 'approved' && (
                          <button
                            onClick={() => handleStatus(user.id, 'approved')}
                            disabled={isUpdating}
                            className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {user.status !== 'denied' && (
                          <button
                            onClick={() => handleStatus(user.id, 'denied')}
                            disabled={isUpdating}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Deny"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {user.status !== 'pending' && (
                          <button
                            onClick={() => handleStatus(user.id, 'pending')}
                            disabled={isUpdating}
                            className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-colors"
                            title="Reset to pending"
                          >
                            <Clock size={16} />
                          </button>
                        )}
                      </div>
                    )}
                    {user.isAdmin && (
                      <span className="text-xs text-violet-400 font-semibold shrink-0">Admin</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

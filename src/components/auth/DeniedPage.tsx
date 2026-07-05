import { ShieldX, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../lib/api';

interface Props { user: User; }

export function DeniedPage({ user }: Props) {
  const { signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-primary-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mx-auto bg-red-500/10">
          <ShieldX size={36} className="text-red-400" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-primary">Access Denied</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">
            Your request for <span className="font-semibold text-secondary">{user.email}</span>{' '}
            has been declined. Contact the owner if you believe this is a mistake.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="btn-secondary w-full justify-center gap-2"
          id="denied-signout-btn"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

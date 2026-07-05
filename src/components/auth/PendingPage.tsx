import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../lib/api';

interface Props { user: User; }

export function PendingPage({ user }: Props) {
  const { signOut, init } = useAuthStore();

  return (
    <div className="min-h-screen bg-primary-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-6 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mx-auto"
             style={{ background: 'linear-gradient(135deg, #f59e0b22, #d9770622)' }}>
          <Clock size={36} className="text-amber-400" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-primary">Access Pending</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">
            You've signed in as <span className="font-semibold text-secondary">{user.email}</span>.
            <br />
            Your access request has been sent to the owner.
            <br />
            You'll be able to use the app once approved.
          </p>
        </div>

        <div className="card p-5 text-left space-y-3">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">What happens next</p>
          <ol className="space-y-2 text-sm text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-violet-400 font-bold shrink-0">1.</span>
              The owner reviews your request.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 font-bold shrink-0">2.</span>
              Once approved, refresh this page to start using Life Planner.
            </li>
          </ol>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => init()}
            className="btn-secondary flex-1 justify-center gap-2"
            id="refresh-access-btn"
          >
            <RefreshCw size={14} />
            Refresh Status
          </button>
          <button
            onClick={() => signOut()}
            className="btn-ghost flex-1 justify-center gap-2"
            id="pending-signout-btn"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

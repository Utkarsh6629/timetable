import { useSearchParams } from 'react-router-dom';
import { useCapacitorAuth } from '../../hooks/useCapacitorAuth';

// Inline Google SVG logo
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get('error');
  const { startGoogleLogin } = useCapacitorAuth();

  return (
    <div className="min-h-screen bg-primary-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-800/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo + Brand */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl shadow-violet-500/40"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
            <span className="text-white text-3xl font-black">LP</span>
          </div>
          <div>
            <h1 className="text-3xl font-black gradient-text">Life Planner</h1>
            <p className="text-muted text-sm mt-1">Your personal productivity OS</p>
          </div>
        </div>

        {/* Login card */}
        <div className="card p-8 space-y-5 shadow-2xl">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary">Welcome back</h2>
            <p className="text-xs text-muted mt-1">Sign in to access your planner</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
              Sign-in failed. Please try again.
            </div>
          )}

          {/* Google sign-in
              On Android (Capacitor): opens Chrome Custom Tab via useCapacitorAuth
              On web: navigates normally to /auth/google */}
          <button
            onClick={startGoogleLogin}
            id="google-signin-btn"
            type="button"
            className="flex items-center justify-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 hover:shadow-md active:scale-95 border cursor-pointer"
            style={{
              backgroundColor: 'rgb(var(--bg-secondary))',
              borderColor:     'rgb(var(--border))',
              color:           'rgb(var(--text-primary))',
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-[11px] text-muted text-center leading-relaxed">
            Access is by invite only. After signing in, your request will be reviewed.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted">
          Life Planner · Private &amp; self-hosted
        </p>
      </div>
    </div>
  );
}

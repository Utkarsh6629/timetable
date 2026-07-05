import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { Sidebar }     from './components/layout/Sidebar';
import { BottomNav }   from './components/layout/BottomNav';
import { DayView }     from './components/day/DayView';
import { TimetablePage } from './components/timetable/TimetablePage';
import { MonthView }   from './components/month/MonthView';
import { ThemeProvider } from './components/ThemeProvider';
import { LoginPage }   from './components/auth/LoginPage';
import { PendingPage } from './components/auth/PendingPage';
import { DeniedPage }  from './components/auth/DeniedPage';
import { useAuthStore } from './store/useAuthStore';
import { useSync }     from './hooks/useSync';

function DayRoute() {
  const [params] = useSearchParams();
  const date = params.get('date') ?? undefined;
  return <DayView dateKey={date} />;
}

/** Main app layout — only rendered when user is approved. */
function AppLayout() {
  useSync(); // debounced cloud sync
  return (
    <div className="flex h-screen overflow-hidden bg-primary-surface">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/"          element={<DayRoute />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/month"     element={<MonthView />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

/** Full-screen loading spinner shown while init() is running. */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-primary-surface flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-3xl shadow-2xl shadow-violet-500/40 flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
        <span className="text-white text-2xl font-black">LP</span>
      </div>
      <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );
}

function AuthGate() {
  const { user, loading, init } = useAuthStore();

  useEffect(() => { void init(); }, []);

  if (loading) return <LoadingScreen />;

  if (!user)                   return <LoginPage />;
  if (user.status === 'pending') return <PendingPage user={user} />;
  if (user.status === 'denied')  return <DeniedPage  user={user} />;

  return <AppLayout />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthGate />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

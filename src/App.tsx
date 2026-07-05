import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { DayView } from './components/day/DayView';
import { TimetablePage } from './components/timetable/TimetablePage';
import { MonthView } from './components/month/MonthView';
import { ThemeProvider } from './components/ThemeProvider';

function DayRoute() {
  const [params] = useSearchParams();
  const date = params.get('date') ?? undefined;
  return <DayView dateKey={date} />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="flex h-screen overflow-hidden bg-primary-surface">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<DayRoute />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/month" element={<MonthView />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

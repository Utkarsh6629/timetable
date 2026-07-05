import { useState } from 'react';
import { format, startOfMonth, startOfWeek, addDays, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { formatDateKey, heatmapColor, cn } from '../../lib/utils';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();
  const { dayRecords, getTasksForDate } = useAppStore();

  const monthStart = startOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  // Build 6×7 grid
  const cells: Date[] = [];
  let d = calStart;
  while (cells.length < 42) {
    cells.push(d);
    d = addDays(d, 1);
  }

  const getCompletion = (date: Date) => {
    const key = formatDateKey(date);
    const record = dayRecords[key];
    if (!record) return null;
    return record.completionPercentage;
  };

  const today = formatDateKey(new Date());

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-base shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold gradient-text">Month View</h1>
            <p className="text-sm text-muted mt-0.5">{format(currentMonth, 'MMMM yyyy')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-xs py-1.5 px-3"
              onClick={() => setCurrentMonth(new Date())}
            >
              <Calendar size={13} /> Today
            </button>
            <button onClick={() => setCurrentMonth(m => { const nm = new Date(m); nm.setMonth(nm.getMonth() - 1); return nm; })} className="btn-ghost p-2">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentMonth(m => { const nm = new Date(m); nm.setMonth(nm.getMonth() + 1); return nm; })} className="btn-ghost p-2">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="px-4 py-2 md:px-6 md:py-3 border-b border-base shrink-0 flex flex-wrap items-center gap-2 md:gap-4">
        <span className="text-xs text-muted font-medium">Completion:</span>
        {[
          { label: '0%', color: '#ef4444' },
          { label: '1–49%', color: '#f97316' },
          { label: '50–79%', color: '#eab308' },
          { label: '80–99%', color: '#86efac' },
          { label: '100%', color: '#16a34a' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: item.color }} />
            <span className="text-xs text-muted">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto px-2 py-3 md:px-6 md:py-4 pb-24 md:pb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_LABELS.map(l => (
            <div key={l} className="text-center text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-1.5 md:py-2">
              {l.slice(0, 1)}<span className="hidden sm:inline">{l.slice(1)}</span>
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, idx) => {
            const key = formatDateKey(cell);
            const record = dayRecords[key];
            const pct = getCompletion(cell);
            const isCurrentMonth = isSameMonth(cell, currentMonth);
            const isCurrentDay = key === today;
            const hasNotes = record && (record.notes || record.wins || record.improvements);
            const tasksForDay = getTasksForDate(key);
            const totalTasks = tasksForDay.length;
            const completedCount = record?.tasks.filter(t => t.completed).length ?? 0;

            return (
              <div
                key={idx}
                className={cn(
                  'relative rounded-lg md:rounded-xl p-1 md:p-2 min-h-[56px] md:min-h-[90px] cursor-pointer transition-all duration-150 hover:shadow-md hover:scale-[1.02] group',
                  isCurrentMonth ? 'card' : 'opacity-30 card',
                  isCurrentDay && 'ring-2 ring-violet-500 ring-offset-1 ring-offset-transparent'
                )}
                onClick={() => navigate(`/?date=${key}`)}
              >
                {/* Date number */}
                <div className="flex items-start justify-between mb-1.5">
                  <span className={cn(
                    'text-[11px] md:text-sm font-bold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-md md:rounded-lg',
                    isCurrentDay ? 'bg-violet-600 text-white' : 'text-primary'
                  )}>
                    {format(cell, 'd')}
                  </span>
                  {hasNotes && (
                    <FileText size={11} className="text-violet-400 mt-1" />
                  )}
                </div>

                {/* Heatmap dot */}
                {pct !== null && (
                  <div className="space-y-1">
                    <div
                      className="w-full h-1.5 rounded-full"
                      style={{ background: heatmapColor(pct) }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold" style={{ color: heatmapColor(pct) }}>
                        {pct}%
                      </span>
                      {totalTasks > 0 && (
                        <span className="text-[10px] text-muted">
                          {completedCount}/{totalTasks}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Task count for days with tasks but no record */}
                {pct === null && totalTasks > 0 && (
                  <p className="text-[10px] text-muted mt-1">{totalTasks} tasks</p>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-xl bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

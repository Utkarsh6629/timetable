import { useMemo } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Flame, Award, Brain } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatDateKey } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function StatsBar() {
  const { getCurrentStreak, getLongestStreak, dayRecords, getTasksForDate } = useAppStore();

  const streak = getCurrentStreak();
  const longest = getLongestStreak();

  // Weekly stats
  const weekDays = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, []);

  const weeklyCompletion = useMemo(() => {
    const totals = weekDays.map(d => {
      const key = formatDateKey(d);
      return dayRecords[key]?.completionPercentage ?? 0;
    });
    const avg = totals.reduce((s, v) => s + v, 0) / totals.length;
    return Math.round(avg);
  }, [weekDays, dayRecords]);

  // Insights
  const insights = useMemo(() => {
    const titleStats: Record<string, { done: number; total: number }> = {};
    Object.entries(dayRecords).forEach(([date, record]) => {
      const tasks = getTasksForDate(date);
      tasks.forEach(task => {
        if (!titleStats[task.title]) titleStats[task.title] = { done: 0, total: 0 };
        titleStats[task.title].total++;
        if (record.tasks.find(t => t.taskId === task.id)?.completed) {
          titleStats[task.title].done++;
        }
      });
    });

    return Object.entries(titleStats)
      .filter(([, s]) => s.total >= 3)
      .map(([title, s]) => {
        const pct = Math.round((s.done / s.total) * 100);
        return { title, pct };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [dayRecords, getTasksForDate]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Streaks */}
      <div className="card p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
          <Flame size={14} className="text-orange-400" /> Streak
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">{streak}</p>
            <p className="text-xs text-muted mt-0.5">Current</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{longest}</p>
            <p className="text-xs text-muted mt-0.5 flex items-center gap-1"><Award size={10} /> Best</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{weeklyCompletion}%</p>
            <p className="text-xs text-muted mt-0.5">This Week</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="card p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
          <Brain size={14} className="text-violet-400" /> Insights
        </h3>
        {insights.length === 0 ? (
          <p className="text-xs text-muted">Complete tasks over multiple days to see insights.</p>
        ) : (
          <div className="space-y-2">
            {insights.map(i => (
              <div key={i.title} className="flex items-center gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <span className="text-secondary">{i.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-20 h-1.5 rounded-full bg-secondary-surface overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${i.pct}%`,
                        background: i.pct >= 80 ? '#10b981' : i.pct >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className={cn('font-semibold', i.pct >= 80 ? 'text-green-400' : i.pct >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                    {i.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

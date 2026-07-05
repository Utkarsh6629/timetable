import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle2, Zap, ChevronRight } from 'lucide-react';
import type { TimetableTask } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatHour } from '../../lib/utils';

interface Props {
  tasks: TimetableTask[];
  dateStr: string;
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function TimelineHeader({ tasks, dateStr }: Props) {
  const now = useNow();
  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const { toggleTaskCompletion, dayRecords } = useAppStore();
  const record = dayRecords[dateStr];

  const sorted = [...tasks].sort((a, b) => a.startHour - b.startHour);

  const currentTaskIdx = sorted.findIndex(t => currentHour >= t.startHour && currentHour < t.endHour);
  const currentTask = currentTaskIdx >= 0 ? sorted[currentTaskIdx] : null;
  const nextTask = currentTask
    ? sorted[currentTaskIdx + 1] ?? null
    : sorted.find(t => t.startHour > currentHour) ?? null;
  const prevTask = currentTask
    ? (currentTaskIdx > 0 ? sorted[currentTaskIdx - 1] : null)
    : [...sorted].reverse().find(t => t.endHour <= currentHour) ?? null;

  const isCompleted = record?.tasks.find(t => t.taskId === currentTask?.id)?.completed ?? false;

  const secondsToNext = nextTask
    ? Math.max(0, Math.round((nextTask.startHour - currentHour) * 3600))
    : 0;

  return (
    <div className="card p-5 space-y-4 animate-slide-up">
      {/* Live clock header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Live Now</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-mono text-secondary">
          <Clock size={14} />
          <span>{format(now, 'hh:mm:ss a')}</span>
        </div>
      </div>

      {currentTask ? (
        <div className="space-y-4">
          {/* Current task banner */}
          <div
            className="relative overflow-hidden rounded-xl p-4 text-white"
            style={{ background: `linear-gradient(135deg, ${currentTask.color}cc, ${currentTask.color}88)` }}
          >
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,white,white_1px,transparent_1px,transparent_8px)]" />
            <div className="relative space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Right Now</p>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-xs bg-white/20 rounded-lg px-2 py-0.5">
                    <CheckCircle2 size={12} /> Done
                  </span>
                )}
              </div>
              <p className="text-xl font-bold">{currentTask.title}</p>
              <p className="text-sm opacity-80">
                {formatHour(currentTask.startHour)} – {formatHour(currentTask.endHour)}
              </p>
            </div>
          </div>

          {/* Countdown & action row */}
          <div className="flex items-center gap-3">
            {nextTask && (
              <div className="flex-1 rounded-xl bg-secondary-surface p-3 text-center">
                <p className="text-xs text-muted mb-0.5">Next task in</p>
                <p className="text-lg font-bold font-mono text-primary">{formatCountdown(secondsToNext)}</p>
                <p className="text-xs text-secondary truncate">{nextTask.title}</p>
              </div>
            )}
            {!isCompleted ? (
              <button
                onClick={() => toggleTaskCompletion(dateStr, currentTask.id)}
                className="btn-primary flex-1 justify-center py-3"
                style={{ background: `linear-gradient(135deg, ${currentTask.color}, ${currentTask.color}bb)` }}
              >
                <CheckCircle2 size={16} />
                Mark Complete
              </button>
            ) : (
              <button
                onClick={() => toggleTaskCompletion(dateStr, currentTask.id)}
                className="btn-secondary flex-1 justify-center py-3"
              >
                <CheckCircle2 size={16} className="text-green-500" />
                Completed ✓
              </button>
            )}
          </div>

          {/* Prev / Next task chips */}
          <div className="flex items-center gap-2 text-xs">
            {prevTask && (
              <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-secondary-surface text-muted">
                <span>Prev:</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: prevTask.color }}
                />
                <span className="font-medium text-secondary">{prevTask.title}</span>
              </div>
            )}
            {nextTask && (
              <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-secondary-surface text-muted ml-auto">
                <span>Next:</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: nextTask.color }}
                />
                <span className="font-medium text-secondary">{nextTask.title}</span>
                <ChevronRight size={12} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary-surface flex items-center justify-center mx-auto">
            <Zap size={22} className="text-muted" />
          </div>
          <p className="font-semibold text-primary">No task scheduled right now</p>
          {nextTask ? (
            <p className="text-sm text-muted">
              Next: <span className="font-medium text-secondary">{nextTask.title}</span> at {formatHour(nextTask.startHour)}{' '}
              <span className="text-violet-400">({formatCountdown(secondsToNext)} away)</span>
            </p>
          ) : (
            <p className="text-sm text-muted">You're all done for today! 🎉</p>
          )}
        </div>
      )}
    </div>
  );
}

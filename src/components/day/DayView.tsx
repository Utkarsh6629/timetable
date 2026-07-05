import { useState, useEffect } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatDateKey, parseDateKey } from '../../lib/utils';
import { TimelineHeader } from './TimelineHeader';
import { TaskList } from './TaskList';
import { DailyJournal } from './DailyJournal';
import { StatsBar } from './StatsBar';

interface Props {
  dateKey?: string;
}

export function DayView({ dateKey }: Props) {
  const [currentDate, setCurrentDate] = useState<Date>(() =>
    dateKey ? parseDateKey(dateKey) : new Date()
  );

  useEffect(() => {
    if (dateKey) setCurrentDate(parseDateKey(dateKey));
  }, [dateKey]);

  const dateStr = formatDateKey(currentDate);
  const { getTasksForDate, getDayRecord, getCompletionForDate } = useAppStore();

  const tasks = getTasksForDate(dateStr);
  const record = getDayRecord(dateStr);
  const completion = getCompletionForDate(dateStr);
  const completed = record.tasks.filter(t => t.completed).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-base shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">
              {isToday(currentDate) ? 'Today' : format(currentDate, 'EEEE')}
            </h1>
            <p className="text-sm text-muted mt-0.5">{format(currentDate, 'MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isToday(currentDate) && (
              <button
                onClick={() => setCurrentDate(new Date())}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <Calendar size={13} />
                Today
              </button>
            )}
            <button onClick={() => setCurrentDate(d => subDays(d, 1))} className="btn-ghost p-2">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="btn-ghost p-2">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{completed} of {tasks.length} tasks done</span>
            <span className="font-semibold text-violet-400">{completion}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Timeline — only show for today */}
        {isToday(currentDate) && (
          <TimelineHeader tasks={tasks} dateStr={dateStr} />
        )}

        {/* Stats */}
        <StatsBar />

        {/* Task list */}
        <TaskList tasks={tasks} dateStr={dateStr} record={record} />

        {/* Journal */}
        <DailyJournal dateStr={dateStr} record={record} />
      </div>
    </div>
  );
}

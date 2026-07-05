import { useState } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronUp, ListChecks } from 'lucide-react';
import type { TimetableTask, DayRecord } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatHour, cn } from '../../lib/utils';

interface Props {
  tasks: TimetableTask[];
  dateStr: string;
  record: DayRecord;
}

export function TaskList({ tasks, dateStr, record }: Props) {
  const { toggleTaskCompletion } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...tasks].sort((a, b) => a.startHour - b.startHour);
  const completed = record.tasks.filter(t => t.completed).length;
  const total = tasks.length;

  if (total === 0) {
    return (
      <div className="card p-8 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-secondary-surface flex items-center justify-center mx-auto">
          <ListChecks size={22} className="text-muted" />
        </div>
        <p className="font-semibold text-primary">No tasks scheduled</p>
        <p className="text-sm text-muted">Add tasks to your timetable for this day of the week.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Daily Tasks</h2>
        <span className="text-xs text-muted">
          {completed}/{total} · {record.completionPercentage}%
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map(task => {
          const isCompleted = record.tasks.find(t => t.taskId === task.id)?.completed ?? false;
          const isExpanded = expandedId === task.id;

          return (
            <div
              key={task.id}
              className={cn(
                'card overflow-hidden transition-all duration-200',
                isCompleted && 'opacity-60'
              )}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary-surface/50 transition-colors"
                onClick={() => toggleTaskCompletion(dateStr, task.id)}
              >
                {/* Color dot */}
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: task.color }}
                />

                {/* Checkbox */}
                <div className="shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => toggleTaskCompletion(dateStr, task.id)}
                    className="text-muted hover:text-violet-400 transition-colors"
                  >
                    {isCompleted
                      ? <CheckSquare size={18} className="text-violet-500" />
                      : <Square size={18} />
                    }
                  </button>
                </div>

                {/* Title & time */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium text-primary truncate', isCompleted && 'line-through text-muted')}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatHour(task.startHour)} – {formatHour(task.endHour)}
                  </p>
                </div>

                {/* Duration badge */}
                <span className="text-xs text-muted shrink-0">
                  {Math.round((task.endHour - task.startHour) * 60)}m
                </span>

                {/* Expand toggle */}
                <button
                  onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : task.id); }}
                  className="shrink-0 text-muted hover:text-secondary transition-colors"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Expanded description */}
              {isExpanded && task.description && (
                <div className="px-4 pb-3 pt-1 border-t border-base">
                  <p className="text-xs text-secondary">{task.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

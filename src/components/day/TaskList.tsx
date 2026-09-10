import { useState } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronUp, ListChecks, StickyNote, Bell, BellOff } from 'lucide-react';
import type { TimetableTask, DayRecord } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatHour, cn } from '../../lib/utils';

interface Props {
  tasks: TimetableTask[];
  dateStr: string;
  record: DayRecord;
}

export function TaskList({ tasks, dateStr, record }: Props) {
  const { toggleTaskCompletion, updateTaskNotes, toggleTaskAlarm, preferences } = useAppStore();
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
          const dayTaskRecord = record.tasks.find(t => t.taskId === task.id);
          const isCompleted = dayTaskRecord?.completed ?? false;
          const taskNotes = dayTaskRecord?.notes ?? '';
          const isExpanded = expandedId === task.id;
          const hasNotes = !!taskNotes.trim();

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
                  <div className="flex items-center gap-1.5">
                    <p className={cn('text-sm font-medium text-primary truncate', isCompleted && 'line-through text-muted')}>
                      {task.title}
                    </p>
                    {/* Note indicator */}
                    {hasNotes && !isExpanded && (
                      <StickyNote size={12} className="text-violet-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {formatHour(task.startHour)} – {formatHour(task.endHour)}
                  </p>
                </div>

                {/* Duration badge */}
                <span className="text-xs text-muted shrink-0">
                  {Math.round((task.endHour - task.startHour) * 60)}m
                </span>

                {/* Per-task alarm toggle */}
                {(preferences.notificationMode === 'alarm' || preferences.notificationMode === 'both') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskAlarm(task.id);
                    }}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors shrink-0',
                      task.alarmDisabled
                        ? 'text-muted/50 hover:text-muted hover:bg-secondary-surface'
                        : 'text-violet-400 hover:bg-violet-500/15'
                    )}
                    title={
                      task.alarmDisabled
                        ? 'Alarm disabled for this task (click to enable)'
                        : 'Alarm active for this task (click to mute)'
                    }
                  >
                    {task.alarmDisabled ? <BellOff size={14} /> : <Bell size={14} />}
                  </button>
                )}

                {/* Expand toggle */}
                <button
                  onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : task.id); }}
                  className="shrink-0 text-muted hover:text-secondary transition-colors"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Expanded section: description + per-task notes */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-base space-y-3">
                  {/* Static task description from timetable */}
                  {task.description && (
                    <p className="text-xs text-secondary">{task.description}</p>
                  )}

                  {/* Per-day task notes */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <StickyNote size={12} className="text-violet-400" />
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                        Notes for today
                      </label>
                    </div>
                    <textarea
                      className="textarea-base min-h-[60px] text-xs"
                      placeholder="Add notes for this task…"
                      value={taskNotes}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateTaskNotes(dateStr, task.id, e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

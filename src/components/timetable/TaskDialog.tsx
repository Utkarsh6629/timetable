import { useState } from 'react';
import { X } from 'lucide-react';
import type { TimetableTask } from '../../types';
import { generateId, TASK_COLORS, FULL_DAY_NAMES, formatHour, cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  task: Partial<TimetableTask>;
  onSave: (tasks: TimetableTask[], deleteIds?: string[]) => void;
  onClose: () => void;
  dayStartHour: number;
  dayEndHour: number;
}
export function TaskDialog({ task, onSave, onClose, dayStartHour, dayEndHour }: Props) {
  const timetable = useAppStore(s => s.timetable);

  // Find matching tasks in the timetable (tasks that belong to the same weekday/recurring series)
  const matchingTasks = task.id
    ? timetable.filter(t =>
        t.title === task.title &&
        (t.description || undefined) === (task.description || undefined) &&
        t.startHour === task.startHour &&
        t.endHour === task.endHour &&
        t.color === task.color &&
        t.recurring === task.recurring
      )
    : [];

  const [title, setTitle] = useState(task.title ?? '');
  const [color, setColor] = useState(task.color ?? TASK_COLORS[0]);
  const [description, setDescription] = useState(task.description ?? '');
  // Multi-select: initialise with the matching tasks' days, or the task's day, or Monday as default
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    if (task.id !== undefined && matchingTasks.length > 0) {
      return matchingTasks.map(t => t.dayOfWeek);
    }
    return [task.dayOfWeek ?? 1];
  });
  const [startHour, setStartHour] = useState(task.startHour ?? 9);
  const [endHour, setEndHour] = useState(task.endHour ?? 10);
  const [recurring, setRecurring] = useState(task.recurring ?? true);

  const isNew = !task.id;

  const toggleDay = (d: number) => {
    setSelectedDays(prev =>
      prev.includes(d)
        ? prev.length > 1 ? prev.filter(x => x !== d) : prev  // keep at least 1
        : [...prev, d]
    );
  };

  const handleSave = () => {
    if (!title.trim() || selectedDays.length === 0) return;
    const clampedEnd = Math.max(startHour + 0.5, endHour);

    if (isNew) {
      // Create one task per selected day
      const tasks: TimetableTask[] = selectedDays.map(day => ({
        id: generateId(),
        title: title.trim(),
        color,
        description: description.trim() || undefined,
        dayOfWeek: day,
        startHour,
        endHour: clampedEnd,
        recurring,
      }));
      onSave(tasks);
    } else {
      // Editing: update the original tasks, preserving their ids, and handle new/removed days
      const tasksToSave: TimetableTask[] = [];
      const deleteIds: string[] = [];

      // Map matchingTasks by dayOfWeek for easy lookup
      const matchingByDay = new Map<number, TimetableTask>();
      matchingTasks.forEach(t => {
        matchingByDay.set(t.dayOfWeek, t);
      });

      // 1. For each selected day, either update existing matching task or create a new one
      selectedDays.forEach(day => {
        const existingTask = matchingByDay.get(day);
        if (existingTask) {
          tasksToSave.push({
            id: existingTask.id,
            title: title.trim(),
            color,
            description: description.trim() || undefined,
            dayOfWeek: day,
            startHour,
            endHour: clampedEnd,
            recurring,
          });
        } else {
          tasksToSave.push({
            id: generateId(),
            title: title.trim(),
            color,
            description: description.trim() || undefined,
            dayOfWeek: day,
            startHour,
            endHour: clampedEnd,
            recurring,
          });
        }
      });

      // 2. Identify which matching tasks are no longer in selectedDays, and delete them
      matchingTasks.forEach(t => {
        if (!selectedDays.includes(t.dayOfWeek)) {
          deleteIds.push(t.id);
        }
      });

      onSave(tasksToSave, deleteIds);
    }
  };

  // Half-hour steps spanning the user's personal day (may go past midnight)
  const halfHours = Array.from(
    { length: (dayEndHour - dayStartHour) * 2 + 1 },
    (_, i) => dayStartHour + i * 0.5
  );

  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base">
          <h2 className="text-base font-semibold text-primary">{isNew ? 'New Task' : 'Edit Task'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Title *</label>
            <input
              className="input-base"
              placeholder="e.g. Deep Work, Gym, Reading…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Color</label>
            <div className="flex flex-wrap gap-2">
              {TASK_COLORS.map(c => (
                <button
                  key={c}
                  className={cn(
                    'w-7 h-7 rounded-lg transition-all duration-150',
                    color === c ? 'scale-110' : 'hover:scale-105'
                  )}
                  style={{
                    background: c,
                    outline: color === c ? '2px solid white' : 'none',
                    outlineOffset: color === c ? '2px' : '0',
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Days of Week — multi-select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                Days of Week
              </label>
              <span className="text-xs text-muted">
                {selectedDays.length === 7
                  ? 'Every day'
                  : selectedDays.length === 1
                  ? '1 day selected'
                  : `${selectedDays.length} days selected`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DAY_ORDER.map(d => {
                const active = selectedDays.includes(d);
                return (
                  <button
                    key={d}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 select-none',
                      active
                        ? 'text-white shadow-sm scale-[1.05]'
                        : 'bg-secondary-surface text-secondary hover:text-primary hover:scale-[1.03]'
                    )}
                    style={active ? { background: color } : {}}
                    onClick={() => toggleDay(d)}
                  >
                    {FULL_DAY_NAMES[d].slice(0, 3)}
                  </button>
                );
              })}
            </div>
            {/* Quick select helpers */}
            <div className="flex gap-2 pt-0.5">
              <button
                className="text-[11px] text-muted hover:text-violet-400 transition-colors"
                onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
              >
                Weekdays
              </button>
              <span className="text-muted text-[11px]">·</span>
              <button
                className="text-[11px] text-muted hover:text-violet-400 transition-colors"
                onClick={() => setSelectedDays([6, 0])}
              >
                Weekend
              </button>
              <span className="text-muted text-[11px]">·</span>
              <button
                className="text-[11px] text-muted hover:text-violet-400 transition-colors"
                onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
              >
                Every day
              </button>
              <span className="text-muted text-[11px]">·</span>
              <button
                className="text-[11px] text-muted hover:text-red-400 transition-colors"
                onClick={() => setSelectedDays([selectedDays[0]])}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Start</label>
              <select
                className="input-base"
                value={startHour}
                onChange={e => setStartHour(Number(e.target.value))}
              >
                {halfHours.map(h => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">End</label>
              <select
                className="input-base"
                value={endHour}
                onChange={e => setEndHour(Number(e.target.value))}
              >
                {halfHours.filter(h => h > startHour).map(h => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Description (optional)</label>
            <textarea
              className="textarea-base min-h-[64px]"
              placeholder="Any notes about this task…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                'relative w-10 h-5 rounded-full transition-colors duration-200',
                recurring ? 'bg-violet-600' : 'bg-secondary-surface'
              )}
              onClick={() => setRecurring(r => !r)}
            >
              <div className={cn(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                recurring ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </div>
            <span className="text-sm text-secondary">Recurring every week</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-base">
          <p className="text-xs text-muted">
            {isNew && selectedDays.length > 1
              ? `Will create ${selectedDays.length} tasks`
              : null}
          </p>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
              onClick={handleSave}
              disabled={!title.trim()}
            >
              {isNew
                ? selectedDays.length > 1
                  ? `Create ${selectedDays.length} Tasks`
                  : 'Create Task'
                : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

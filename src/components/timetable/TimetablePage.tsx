import { useState, useRef } from 'react';
import { Plus, Settings, X, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatHour, TASK_COLORS, FULL_DAY_NAMES, cn } from '../../lib/utils';
import type { TimetableTask } from '../../types';
import { TaskDialog } from './TaskDialog';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { HourRangeSelector } from './HourRangeSelector';

// Grid constants
const HOUR_HEIGHT = 60; // px per hour
const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun

export function TimetablePage() {
  const { timetable, addTask, updateTask, deleteTask, clearTimetable, preferences, setDayRange } = useAppStore();
  const [dialogTask, setDialogTask] = useState<Partial<TimetableTask> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const { dayStartHour, dayEndHour } = preferences;

  const hours = Array.from({ length: dayEndHour - dayStartHour + 1 }, (_, i) => dayStartHour + i);

  // Drag state
  const dragRef = useRef<{ task: TimetableTask; startY: number; origStart: number } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Resize state
  const resizeRef = useRef<{ task: TimetableTask; startY: number; origEnd: number } | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // Mouse drag handlers for task movement
  const handleTaskMouseDown = (e: React.MouseEvent, task: TimetableTask) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    e.preventDefault();
    dragRef.current = { task, startY: e.clientY, origStart: task.startHour };
    setDraggedId(task.id);

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const deltaH = (ev.clientY - dragRef.current.startY) / HOUR_HEIGHT;
      const duration = dragRef.current.task.endHour - dragRef.current.origStart;
      const newStart = Math.round((dragRef.current.origStart + deltaH) * 2) / 2;
      const clamped = Math.max(dayStartHour, Math.min(dayEndHour - duration, newStart));
      updateTask({ ...dragRef.current.task, startHour: clamped, endHour: clamped + duration });
    };

    const onUp = () => {
      dragRef.current = null;
      setDraggedId(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Mouse resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent, task: TimetableTask) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { task, startY: e.clientY, origEnd: task.endHour };
    setResizingId(task.id);

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const deltaH = (ev.clientY - resizeRef.current.startY) / HOUR_HEIGHT;
      const newEnd = Math.round((resizeRef.current.origEnd + deltaH) * 2) / 2;
      const clamped = Math.max(resizeRef.current.task.startHour + 0.5, Math.min(dayEndHour, newEnd));
      updateTask({ ...resizeRef.current.task, endHour: clamped });
    };

    const onUp = () => {
      resizeRef.current = null;
      setResizingId(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleSaveTask = (tasks: TimetableTask[]) => {
    tasks.forEach(task => {
      if (timetable.find(t => t.id === task.id)) {
        updateTask(task);
      } else {
        addTask(task);
      }
    });
    setDialogTask(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-base shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Timetable</h1>
            <p className="text-sm text-muted mt-0.5">Design your ideal weekly routine</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-xs"
              onClick={() => setShowRangeSelector(true)}
            >
              <Settings size={13} />
              {formatHour(dayStartHour)} – {formatHour(dayEndHour)}
            </button>
            {timetable.length > 0 && (
              <button
                className="btn-secondary text-xs text-red-400 hover:!text-red-400 hover:!border-red-400/50 hover:!bg-red-500/10"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 size={13} />
                Clear All
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => setDialogTask({ recurring: true, startHour: 9, endHour: 10, dayOfWeek: 1, color: TASK_COLORS[0] })}
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="sticky top-0 z-10 bg-card border-b border-base flex">
            <div className="w-14 shrink-0" />
            {DAYS.map(day => (
              <div key={day} className="flex-1 py-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">
                {FULL_DAY_NAMES[day].slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div className="flex relative">
            {/* Hour labels */}
            <div className="w-14 shrink-0 select-none">
              {hours.map(h => (
                <div
                  key={h}
                  className="flex items-start justify-end pr-2 text-xs text-muted"
                  style={{ height: HOUR_HEIGHT }}
                >
                  <span className="-mt-2">{formatHour(h)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map(day => {
              const dayTasks = timetable.filter(t => t.dayOfWeek === day);
              return (
                <div
                  key={day}
                  className="flex-1 relative border-l border-base"
                  style={{ height: hours.length * HOUR_HEIGHT }}
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('.task-tile')) return;
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const rawH = (e.clientY - rect.top) / HOUR_HEIGHT;
                    const snapped = Math.round(rawH * 2) / 2;
                    const startH = Math.max(dayStartHour, Math.min(dayEndHour - 1, dayStartHour + snapped));
                    setDialogTask({ recurring: true, startHour: startH, endHour: startH + 1, dayOfWeek: day, color: TASK_COLORS[0] });
                  }}
                >
                  {/* Hour grid lines */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-base/50"
                      style={{ top: (h - dayStartHour) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Task tiles */}
                  {dayTasks.map(task => {
                    const top = (task.startHour - dayStartHour) * HOUR_HEIGHT;
                    const height = (task.endHour - task.startHour) * HOUR_HEIGHT;
                    const isDragging = draggedId === task.id;
                    const isResizing = resizingId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'task-tile absolute left-1 right-1 rounded-lg overflow-hidden select-none transition-shadow',
                          isDragging ? 'z-20 shadow-2xl opacity-90 cursor-grabbing' : 'z-10 cursor-grab hover:shadow-lg',
                          isResizing && 'z-20'
                        )}
                        style={{
                          top,
                          height: Math.max(height, 24),
                          background: `linear-gradient(160deg, ${task.color}ee, ${task.color}99)`,
                          border: `1px solid ${task.color}66`,
                        }}
                        onMouseDown={e => handleTaskMouseDown(e, task)}
                      >
                        {/* Task content */}
                        <div className="flex items-start justify-between px-2 py-1 h-full">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate leading-tight">{task.title}</p>
                            {height >= 40 && (
                              <p className="text-white/70 text-[10px] mt-0.5">
                                {formatHour(task.startHour)}–{formatHour(task.endHour)}
                              </p>
                            )}
                          </div>
                          {/* Action buttons */}
                          {height >= 40 && (
                            <div className="flex items-center gap-0.5 shrink-0 ml-1">
                              <button
                                className="text-white/70 hover:text-white p-0.5 rounded transition-colors"
                                onClick={e => { e.stopPropagation(); setDialogTask(task); }}
                              >
                                <Pencil size={10} />
                              </button>
                              <button
                                className="text-white/70 hover:text-white p-0.5 rounded transition-colors"
                                onClick={e => { e.stopPropagation(); setDeleteId(task.id); }}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Resize handle */}
                        <div
                          className="resize-handle absolute bottom-0 left-0 right-0 h-3 cursor-s-resize flex items-center justify-center"
                          onMouseDown={e => handleResizeMouseDown(e, task)}
                        >
                          <div className="w-8 h-0.5 rounded-full bg-white/30" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {dialogTask !== null && (
        <TaskDialog
          task={dialogTask}
          onSave={handleSaveTask}
          onClose={() => setDialogTask(null)}
          dayStartHour={dayStartHour}
          dayEndHour={dayEndHour}
        />
      )}
      {showClearConfirm && (
        <ConfirmDialog
          title="Clear Timetable"
          message={`This will permanently delete all ${timetable.length} task${timetable.length !== 1 ? 's' : ''} from your timetable. This cannot be undone.`}
          onConfirm={() => { clearTimetable(); setShowClearConfirm(false); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
      {deleteId && (
        <ConfirmDialog
          title="Delete Task"
          message="Are you sure you want to delete this task from your timetable?"
          onConfirm={() => { deleteTask(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {showRangeSelector && (
        <HourRangeSelector
          start={dayStartHour}
          end={dayEndHour}
          onSave={(s, e) => { setDayRange(s, e); setShowRangeSelector(false); }}
          onClose={() => setShowRangeSelector(false)}
        />
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { Plus, Settings, X, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatHour, TASK_COLORS, FULL_DAY_NAMES, cn } from '../../lib/utils';
import type { TimetableTask } from '../../types';
import { TaskDialog } from './TaskDialog';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { HourRangeSelector } from './HourRangeSelector';

// Grid constants
const HOUR_HEIGHT = 60; // px per hour
const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun
const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Hook to detect mobile screens
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useState(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });
  return isMobile;
}

export function TimetablePage() {
  const { timetable, addTask, updateTask, deleteTask, clearTimetable, preferences, setDayRange } = useAppStore();
  const [dialogTask, setDialogTask] = useState<Partial<TimetableTask> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const { dayStartHour, dayEndHour } = preferences;
  const isMobile = useIsMobile();

  // Mobile: active day tab (index in DAYS array)
  const todayDow = new Date().getDay(); // 0=Sun…6=Sat
  const defaultDayIdx = DAYS.indexOf(todayDow) !== -1 ? DAYS.indexOf(todayDow) : 0;
  const [mobileDayIdx, setMobileDayIdx] = useState(defaultDayIdx);

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

  const activeMobileDay = DAYS[mobileDayIdx];
  const mobileDayTasks = [...timetable.filter(t => t.dayOfWeek === activeMobileDay)]
    .sort((a, b) => a.startHour - b.startHour);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-base shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold gradient-text">Timetable</h1>
            <p className="text-sm text-muted mt-0.5 hidden sm:block">Design your ideal weekly routine</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              className="btn-secondary text-xs"
              onClick={() => setShowRangeSelector(true)}
            >
              <Settings size={13} />
              <span className="hidden sm:inline">{formatHour(dayStartHour)} – {formatHour(dayEndHour)}</span>
              <span className="sm:hidden">Hours</span>
            </button>
            {timetable.length > 0 && (
              <button
                className="btn-secondary text-xs text-red-400 hover:!text-red-400 hover:!border-red-400/50 hover:!bg-red-500/10"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => setDialogTask({
                recurring: true,
                startHour: 9,
                endHour: 10,
                dayOfWeek: isMobile ? activeMobileDay : 1,
                color: TASK_COLORS[0]
              })}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE LIST VIEW ──────────────────────────────────── */}
      {isMobile ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Day tabs */}
          <div className="flex items-center border-b border-base shrink-0 px-2 pt-2 gap-1 overflow-x-auto scrollbar-hide">
            {DAYS.map((day, idx) => {
              const count = timetable.filter(t => t.dayOfWeek === day).length;
              const isActive = idx === mobileDayIdx;
              return (
                <button
                  key={day}
                  onClick={() => setMobileDayIdx(idx)}
                  className={cn(
                    'flex flex-col items-center px-3 py-2 rounded-t-xl text-xs font-semibold transition-all duration-150 shrink-0 border-b-2 -mb-px',
                    isActive
                      ? 'text-violet-500 border-violet-500 bg-violet-500/10'
                      : 'text-muted border-transparent hover:text-secondary'
                  )}
                >
                  <span>{DAY_LABELS_SHORT[idx]}</span>
                  {count > 0 && (
                    <span className={cn(
                      'mt-0.5 w-1.5 h-1.5 rounded-full',
                      isActive ? 'bg-violet-500' : 'bg-muted'
                    )} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Day nav arrows + label */}
          <div className="flex items-center justify-between px-4 py-2 shrink-0">
            <button
              onClick={() => setMobileDayIdx(i => (i - 1 + 7) % 7)}
              className="btn-ghost p-2"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-primary">
              {FULL_DAY_NAMES[activeMobileDay]}
              <span className="ml-2 text-xs font-normal text-muted">
                {mobileDayTasks.length} {mobileDayTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </span>
            <button
              onClick={() => setMobileDayIdx(i => (i + 1) % 7)}
              className="btn-ghost p-2"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Task list for active day */}
          <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-2">
            {mobileDayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary-surface flex items-center justify-center">
                  <Plus size={24} className="text-muted" />
                </div>
                <p className="font-semibold text-primary">No tasks for {FULL_DAY_NAMES[activeMobileDay]}</p>
                <p className="text-sm text-muted">Tap the button below to add a task</p>
              </div>
            ) : (
              mobileDayTasks.map(task => (
                <div
                  key={task.id}
                  className="card flex items-center gap-3 px-4 py-3 cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => setDialogTask(task)}
                >
                  {/* Color bar */}
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ background: task.color }}
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{task.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatHour(task.startHour)} – {formatHour(task.endHour)}
                      <span className="ml-2 text-muted/70">
                        ({Math.round((task.endHour - task.startHour) * 60)}m)
                      </span>
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="p-2 rounded-lg text-muted hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                      onClick={e => { e.stopPropagation(); setDialogTask(task); }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      onClick={e => { e.stopPropagation(); setDeleteId(task.id); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FAB */}
          <button
            className="fixed bottom-20 right-5 z-20 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 8px 30px rgba(124,58,237,0.45)' }}
            onClick={() => setDialogTask({
              recurring: true,
              startHour: 9,
              endHour: 10,
              dayOfWeek: activeMobileDay,
              color: TASK_COLORS[0]
            })}
          >
            <Plus size={24} className="text-white" />
          </button>
        </div>
      ) : (
        /* ── DESKTOP GRID VIEW ───────────────────────────────── */
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
      )}

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

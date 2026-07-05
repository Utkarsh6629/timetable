import { create } from 'zustand';
import { format, getDay } from 'date-fns';
import type { TimetableTask, DayRecord, UserPreferences } from '../types';
import type { UserDataPayload } from '../lib/api';

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_TIMETABLE: TimetableTask[] = [
  { id: 'tt-1',  title: 'Morning Workout',  color: '#f97316', dayOfWeek: 1, startHour: 6,  endHour: 7,  recurring: true },
  { id: 'tt-2',  title: 'Morning Workout',  color: '#f97316', dayOfWeek: 3, startHour: 6,  endHour: 7,  recurring: true },
  { id: 'tt-3',  title: 'Morning Workout',  color: '#f97316', dayOfWeek: 5, startHour: 6,  endHour: 7,  recurring: true },
  { id: 'tt-4',  title: 'Deep Work',        color: '#8b5cf6', dayOfWeek: 1, startHour: 9,  endHour: 12, recurring: true },
  { id: 'tt-5',  title: 'Deep Work',        color: '#8b5cf6', dayOfWeek: 2, startHour: 9,  endHour: 12, recurring: true },
  { id: 'tt-6',  title: 'Deep Work',        color: '#8b5cf6', dayOfWeek: 3, startHour: 9,  endHour: 12, recurring: true },
  { id: 'tt-7',  title: 'Deep Work',        color: '#8b5cf6', dayOfWeek: 4, startHour: 9,  endHour: 12, recurring: true },
  { id: 'tt-8',  title: 'Lunch Break',      color: '#10b981', dayOfWeek: 1, startHour: 12, endHour: 13, recurring: true },
  { id: 'tt-9',  title: 'Lunch Break',      color: '#10b981', dayOfWeek: 2, startHour: 12, endHour: 13, recurring: true },
  { id: 'tt-10', title: 'Lunch Break',      color: '#10b981', dayOfWeek: 3, startHour: 12, endHour: 13, recurring: true },
  { id: 'tt-11', title: 'Lunch Break',      color: '#10b981', dayOfWeek: 4, startHour: 12, endHour: 13, recurring: true },
  { id: 'tt-12', title: 'Lunch Break',      color: '#10b981', dayOfWeek: 5, startHour: 12, endHour: 13, recurring: true },
  { id: 'tt-13', title: 'Coding Practice',  color: '#3b82f6', dayOfWeek: 1, startHour: 14, endHour: 16, recurring: true },
  { id: 'tt-14', title: 'Coding Practice',  color: '#3b82f6', dayOfWeek: 3, startHour: 14, endHour: 16, recurring: true },
  { id: 'tt-15', title: 'Coding Practice',  color: '#3b82f6', dayOfWeek: 5, startHour: 14, endHour: 16, recurring: true },
  { id: 'tt-16', title: 'Reading',          color: '#ec4899', dayOfWeek: 1, startHour: 20, endHour: 21, recurring: true },
  { id: 'tt-17', title: 'Reading',          color: '#ec4899', dayOfWeek: 2, startHour: 20, endHour: 21, recurring: true },
  { id: 'tt-18', title: 'Reading',          color: '#ec4899', dayOfWeek: 3, startHour: 20, endHour: 21, recurring: true },
  { id: 'tt-19', title: 'Reading',          color: '#ec4899', dayOfWeek: 4, startHour: 20, endHour: 21, recurring: true },
  { id: 'tt-20', title: 'Reading',          color: '#ec4899', dayOfWeek: 5, startHour: 20, endHour: 21, recurring: true },
  { id: 'tt-21', title: 'Study',            color: '#f59e0b', dayOfWeek: 2, startHour: 14, endHour: 17, recurring: true },
  { id: 'tt-22', title: 'Study',            color: '#f59e0b', dayOfWeek: 4, startHour: 14, endHour: 17, recurring: true },
  { id: 'tt-23', title: 'Weekend Project',  color: '#06b6d4', dayOfWeek: 6, startHour: 10, endHour: 13, recurring: true },
  { id: 'tt-24', title: 'Rest & Recharge',  color: '#6366f1', dayOfWeek: 0, startHour: 10, endHour: 12, recurring: true },
];

export const DEFAULT_PREFS: UserPreferences = {
  theme:            'dark',
  dayStartHour:     6,
  dayEndHour:       23,
  sidebarCollapsed: false,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Store {
  timetable:   TimetableTask[];
  dayRecords:  Record<string, DayRecord>;
  preferences: UserPreferences;

  // Timetable actions
  addTask:       (task: TimetableTask) => void;
  updateTask:    (task: TimetableTask) => void;
  deleteTask:    (id: string) => void;
  clearTimetable: () => void;

  // Day record actions
  getDayRecord:         (date: string) => DayRecord;
  toggleTaskCompletion: (date: string, taskId: string) => void;
  updateDayNotes:       (date: string, field: 'notes' | 'wins' | 'improvements', value: string) => void;

  // Preference actions
  setTheme:           (theme: UserPreferences['theme']) => void;
  setDayRange:        (start: number, end: number) => void;
  setSidebarCollapsed: (v: boolean) => void;

  // Computed helpers
  getTasksForDate:      (date: string) => TimetableTask[];
  getCompletionForDate: (date: string) => number;
  getCurrentStreak:     () => number;
  getLongestStreak:     () => number;

  // Cloud sync actions
  loadFromRemote: (data: Partial<UserDataPayload>) => void;
  resetStore:     () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDayRecord(date: string, tasks: TimetableTask[]): DayRecord {
  return {
    date,
    tasks: tasks.map(t => ({ taskId: t.id, completed: false, notes: '' })),
    notes: '',
    wins: '',
    improvements: '',
    completionPercentage: 0,
  };
}

function calcCompletion(record: DayRecord): number {
  if (!record.tasks.length) return 0;
  const done = record.tasks.filter(t => t.completed).length;
  return Math.round((done / record.tasks.length) * 100);
}

// ── Store ─────────────────────────────────────────────────────────────────────
// Note: No `persist` middleware — data is persisted to the server via useSync.

export const useAppStore = create<Store>((set, get) => ({
  timetable:   DEFAULT_TIMETABLE,
  dayRecords:  {},
  preferences: DEFAULT_PREFS,

  // ── Timetable ──────────────────────────────────────────────────────────────
  addTask: (task) =>
    set(s => ({ timetable: [...s.timetable, task] })),

  updateTask: (task) =>
    set(s => ({ timetable: s.timetable.map(t => t.id === task.id ? task : t) })),

  deleteTask: (id) =>
    set(s => ({ timetable: s.timetable.filter(t => t.id !== id) })),

  clearTimetable: () =>
    set(() => ({ timetable: [] })),

  // ── Day records ────────────────────────────────────────────────────────────
  getDayRecord: (date) => {
    const state = get();
    if (state.dayRecords[date]) return state.dayRecords[date];
    return buildDayRecord(date, state.getTasksForDate(date));
  },

  toggleTaskCompletion: (date, taskId) => {
    set(s => {
      const existing = s.dayRecords[date] ?? buildDayRecord(date, s.getTasksForDate(date));
      const taskExists = existing.tasks.find(t => t.taskId === taskId);
      const tasks = taskExists
        ? existing.tasks.map(t => t.taskId === taskId ? { ...t, completed: !t.completed } : t)
        : [...existing.tasks, { taskId, completed: true, notes: '' }];
      const updated: DayRecord = { ...existing, tasks };
      updated.completionPercentage = calcCompletion(updated);
      return { dayRecords: { ...s.dayRecords, [date]: updated } };
    });
  },

  updateDayNotes: (date, field, value) => {
    set(s => {
      const existing = s.dayRecords[date] ?? buildDayRecord(date, s.getTasksForDate(date));
      const updated = { ...existing, [field]: value };
      updated.completionPercentage = calcCompletion(updated);
      return { dayRecords: { ...s.dayRecords, [date]: updated } };
    });
  },

  // ── Preferences ────────────────────────────────────────────────────────────
  setTheme: (theme) =>
    set(s => ({ preferences: { ...s.preferences, theme } })),

  setDayRange: (start, end) =>
    set(s => ({ preferences: { ...s.preferences, dayStartHour: start, dayEndHour: end } })),

  setSidebarCollapsed: (v) =>
    set(s => ({ preferences: { ...s.preferences, sidebarCollapsed: v } })),

  // ── Computed ───────────────────────────────────────────────────────────────
  getTasksForDate: (date) => {
    const dow = getDay(new Date(date + 'T00:00:00'));
    return get().timetable.filter(t => t.dayOfWeek === dow);
  },

  getCompletionForDate: (date) => {
    return get().dayRecords[date]?.completionPercentage ?? 0;
  },

  getCurrentStreak: () => {
    const { dayRecords } = get();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = format(d, 'yyyy-MM-dd');
      const rec = dayRecords[key];
      if (rec && rec.completionPercentage === 100) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  },

  getLongestStreak: () => {
    const { dayRecords } = get();
    const dates = Object.keys(dayRecords).sort();
    let longest = 0, current = 0;
    let prevDate: Date | null = null;
    for (const d of dates) {
      const rec = dayRecords[d];
      const date = new Date(d + 'T00:00:00');
      if (rec && rec.completionPercentage === 100) {
        if (prevDate) {
          const diff = (date.getTime() - prevDate.getTime()) / 86400000;
          current = diff === 1 ? current + 1 : 1;
        } else {
          current = 1;
        }
        longest = Math.max(longest, current);
        prevDate = date;
      } else {
        current = 0;
        prevDate = null;
      }
    }
    return longest;
  },

  // ── Cloud sync ─────────────────────────────────────────────────────────────
  loadFromRemote: (data) => {
    const timetable = (data.timetable as TimetableTask[] | undefined);
    set({
      timetable:   timetable && timetable.length > 0 ? timetable : DEFAULT_TIMETABLE,
      dayRecords:  (data.dayRecords as Record<string, DayRecord> | undefined) ?? {},
      preferences: { ...DEFAULT_PREFS, ...((data.preferences as Partial<UserPreferences>) ?? {}) },
    });
  },

  resetStore: () => set({
    timetable:   DEFAULT_TIMETABLE,
    dayRecords:  {},
    preferences: DEFAULT_PREFS,
  }),
}));

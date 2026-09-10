export interface TimetableTask {
  id: string;
  title: string;
  color: string;
  description?: string;
  dayOfWeek: number; // 0=Sunday, 1=Mon … 6=Sat
  startHour: number; // e.g. 6.5 = 6:30, 9.25 = 9:15
  endHour: number;
  recurring: boolean;
  alarmDisabled?: boolean; // If true, alarm will not sound for this task in alarm/both mode
}

export interface DayTaskRecord {
  taskId: string;
  completed: boolean;
  notes: string;
}

export interface DayRecord {
  date: string; // yyyy-MM-dd
  tasks: DayTaskRecord[];
  notes: string;
  wins: string;
  improvements: string;
  completionPercentage: number;
}

// ── Weekly Goals ──────────────────────────────────────────────────────────────

export interface WeeklyGoalItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeeklyGoalRecord {
  weekKey: string;            // Monday ISO date yyyy-MM-dd
  goals: WeeklyGoalItem[];    // checklist items
  notes: string;              // free-text area
  setOn: string;              // ISO timestamp of creation
}

// ── Preferences & State ──────────────────────────────────────────────────────

export type NotificationMode = 'off' | 'notification' | 'alarm' | 'both';
export type AlarmTone = 'radar' | 'digital' | 'chime' | 'retro' | 'siren';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  dayStartHour: number;
  dayEndHour: number;
  sidebarCollapsed: boolean;
  notificationMode: NotificationMode;
  notifyMinutesBefore: number;
  alarmTone?: AlarmTone;
  alarmVolume?: number; // 0 - 100
}

export interface AppState {
  timetable: TimetableTask[];
  dayRecords: Record<string, DayRecord>;
  weeklyGoals: Record<string, WeeklyGoalRecord>;
  preferences: UserPreferences;
}

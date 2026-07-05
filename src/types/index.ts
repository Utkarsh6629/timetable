export interface TimetableTask {
  id: string;
  title: string;
  color: string;
  description?: string;
  dayOfWeek: number; // 0=Sunday, 1=Mon … 6=Sat
  startHour: number; // e.g. 6.5 = 6:30
  endHour: number;
  recurring: boolean;
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

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  dayStartHour: number;
  dayEndHour: number;
  sidebarCollapsed: boolean;
}

export interface AppState {
  timetable: TimetableTask[];
  dayRecords: Record<string, DayRecord>;
  preferences: UserPreferences;
}

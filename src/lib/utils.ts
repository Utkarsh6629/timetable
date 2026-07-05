import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHour(hour: number): string {
  const isNextDay = hour >= 24;
  const normalized = hour % 24;
  const h = Math.floor(normalized);
  const m = Math.round((normalized - h) * 60);
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const timeStr = m === 0
    ? `${displayH}:00`
    : `${displayH}:${m.toString().padStart(2, '0')}`;
  const nextDayTag = isNextDay ? ' +1' : '';
  return `${timeStr} ${period}${nextDayTag}`;
}

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateKey(key: string): Date {
  return parseISO(key + 'T00:00:00');
}

export function getCurrentHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

export function heatmapColor(pct: number): string {
  if (pct === 0) return '#ef4444';
  if (pct < 50) return '#f97316';
  if (pct < 80) return '#eab308';
  if (pct < 100) return '#86efac';
  return '#16a34a';
}

export function heatmapBg(pct: number): string {
  if (pct === 0) return 'bg-red-500';
  if (pct < 50) return 'bg-orange-400';
  if (pct < 80) return 'bg-yellow-400';
  if (pct < 100) return 'bg-green-400';
  return 'bg-green-600';
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TASK_COLORS = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#a855f7',
  '#14b8a6', '#84cc16',
];

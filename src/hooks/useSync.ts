import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { putUserData, putDayRecord } from '../lib/api';
import type { DayRecord } from '../types';

/**
 * Watches the app store for changes and debounces incremental saves to the server (1.5 s).
 * Should only be mounted AFTER the user is confirmed approved and data has
 * been loaded via loadFromRemote — App.tsx guarantees this by only rendering
 * the app layout when auth loading is complete.
 */
export function useSync() {
  const timetable   = useAppStore(s => s.timetable);
  const dayRecords  = useAppStore(s => s.dayRecords);
  const preferences = useAppStore(s => s.preferences);
  const user        = useAuthStore(s => s.user);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep track of the last successfully synced versions of the state
  const lastSyncedTimetable = useRef<string | null>(null);
  const lastSyncedPrefs = useRef<string | null>(null);
  const lastSyncedDayRecords = useRef<Record<string, string>>({});
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!user || user.status !== 'approved') return;

    // On mount, initialize the refs with the initial loaded state
    // so we don't trigger redundant HTTP requests immediately.
    if (!isInitialized.current) {
      lastSyncedTimetable.current = JSON.stringify(timetable);
      lastSyncedPrefs.current = JSON.stringify(preferences);
      
      const initialDayRecords: Record<string, string> = {};
      for (const [date, record] of Object.entries(dayRecords)) {
        initialDayRecords[date] = JSON.stringify(record);
      }
      lastSyncedDayRecords.current = initialDayRecords;
      isInitialized.current = true;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(async () => {
      // 1. Sync Settings (timetable & preferences) if changed
      const timetableStr = JSON.stringify(timetable);
      const prefsStr = JSON.stringify(preferences);

      const timetableChanged = timetableStr !== lastSyncedTimetable.current;
      const prefsChanged = prefsStr !== lastSyncedPrefs.current;

      if (timetableChanged || prefsChanged) {
        const payload: Parameters<typeof putUserData>[0] = {};
        if (timetableChanged) payload.timetable = timetable;
        if (prefsChanged) payload.preferences = preferences;

        try {
          await putUserData(payload);
          lastSyncedTimetable.current = timetableStr;
          lastSyncedPrefs.current = prefsStr;
        } catch (err) {
          console.warn('[sync] Failed to save settings:', err);
        }
      }

      // 2. Sync individual modified day records
      const changedDates: { date: string; record: DayRecord; str: string }[] = [];
      for (const [date, record] of Object.entries(dayRecords)) {
        const recStr = JSON.stringify(record);
        const lastStr = lastSyncedDayRecords.current[date];
        if (recStr !== lastStr) {
          changedDates.push({ date, record, str: recStr });
        }
      }

      for (const { date, record, str } of changedDates) {
        try {
          await putDayRecord(date, record);
          lastSyncedDayRecords.current[date] = str;
        } catch (err) {
          console.warn(`[sync] Failed to save day record for ${date}:`, err);
        }
      }
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetable, dayRecords, preferences]);
}

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { putUserData } from '../lib/api';

/**
 * Watches the app store for changes and debounces a PUT to the server (1.5 s).
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

  useEffect(() => {
    if (!user || user.status !== 'approved') return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      putUserData({ timetable, dayRecords, preferences } as Parameters<typeof putUserData>[0])
        .catch(err => console.warn('[sync] Failed to save:', err));
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetable, dayRecords, preferences]);
}

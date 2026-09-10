import { useEffect, useRef, useState, useCallback } from 'react';
import { getDay } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { formatHour } from '../lib/utils';
import { startAlarmSound, stopAlarmSound } from '../lib/alarmAudio';
import { syncNativeAlarms } from '../lib/alarmScheduler';
import type { TimetableTask } from '../types';

export interface AlarmState {
  active: boolean;
  task: TimetableTask | null;
}

/**
 * Enhanced notification + alarm hook.
 *
 * - `notification` mode: fires Web Notification (OS-level)
 * - `alarm` mode: triggers in-app alarm overlay with chosen loud tone & volume
 * - `both` mode: does both, respecting per-task `alarmDisabled` override
 * - Automatically syncs Android background alarms via LocalNotifications
 */
export function useNotifications() {
  const { preferences, timetable } = useAppStore();
  const {
    notificationMode,
    notifyMinutesBefore = 0,
    alarmTone = 'radar',
    alarmVolume = 100,
  } = preferences;

  const enabled = notificationMode !== 'off';
  const useNotif = notificationMode === 'notification' || notificationMode === 'both';
  const useAlarm = notificationMode === 'alarm' || notificationMode === 'both';

  // Track which tasks we've already alerted about today
  const notifiedRef = useRef<Set<string>>(new Set());

  // Alarm overlay state
  const [alarm, setAlarm] = useState<AlarmState>({ active: false, task: null });

  const dismissAlarm = useCallback(() => {
    stopAlarmSound();
    setAlarm({ active: false, task: null });
  }, []);

  // Sync background native alarms whenever timetable or alarm preferences change
  useEffect(() => {
    void syncNativeAlarms(timetable, preferences);
  }, [timetable, preferences]);

  // Request browser notification permission when notification mode is active
  useEffect(() => {
    if (!useNotif) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, [useNotif]);

  // Listen for native notification action (e.g. user tapped notification when app was closed/minimized)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
        if (!isNative) return;

        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const listener = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (action) => {
            const taskId = action.notification.extra?.taskId;
            if (taskId) {
              const matched = timetable.find((t) => t.id === taskId);
              if (matched) {
                const isTaskAlarmEnabled = !matched.alarmDisabled;
                if (useAlarm && isTaskAlarmEnabled) {
                  setAlarm({ active: true, task: matched });
                  startAlarmSound(alarmTone, alarmVolume);
                }
              }
            }
          }
        );
        cleanup = () => {
          void listener.remove();
        };
      } catch {
        // Native notifications not available
      }
    })();
    return () => cleanup?.();
  }, [timetable, useAlarm, alarmTone, alarmVolume]);

  // Foreground Polling check (every 10 seconds for tighter minute accuracy)
  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      const dow = getDay(now);
      const today = now.toISOString().slice(0, 10);

      const todayTasks = timetable.filter((t) => t.dayOfWeek === dow);

      for (const task of todayTasks) {
        const minutesUntilStart = (task.startHour - currentHour) * 60;
        const notifyKey = `${task.id}_${today}`;

        // Should alert if within notifyMinutesBefore window
        if (
          minutesUntilStart >= -1 && // Up to 1 min after start
          minutesUntilStart <= notifyMinutesBefore &&
          !notifiedRef.current.has(notifyKey)
        ) {
          notifiedRef.current.add(notifyKey);

          const isTaskAlarmAllowed = useAlarm && !task.alarmDisabled;
          const minutesLeft = Math.ceil(minutesUntilStart);
          const body =
            minutesLeft <= 0
              ? `Starting now! ${formatHour(task.startHour)} – ${formatHour(task.endHour)}`
              : `Starting in ${minutesLeft} min · ${formatHour(task.startHour)} – ${formatHour(task.endHour)}`;

          // Fire OS notification if enabled
          if (useNotif && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(isTaskAlarmAllowed ? `⏰ ${task.title}` : `🔔 ${task.title}`, {
              body,
              icon: '/favicon.ico',
              tag: notifyKey,
              silent: isTaskAlarmAllowed, // silence the OS chime if in-app audio alarm will blast
            });
          }

          // Fire alarm overlay + loud audio if alarm is enabled for this specific task
          if (isTaskAlarmAllowed) {
            setAlarm({ active: true, task });
            startAlarmSound(alarmTone, alarmVolume);
          }
        }
      }
    };

    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [enabled, useNotif, useAlarm, notifyMinutesBefore, alarmTone, alarmVolume, timetable]);

  // Reset notified set at midnight
  useEffect(() => {
    if (!enabled) return;
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timeout = setTimeout(() => {
      notifiedRef.current.clear();
    }, msUntilMidnight);
    return () => clearTimeout(timeout);
  }, [enabled]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => stopAlarmSound();
  }, []);

  return { alarm, dismissAlarm };
}

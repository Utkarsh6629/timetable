import type { TimetableTask, UserPreferences } from '../types';
import { formatHour } from './utils';

const CHANNEL_ID = 'life-planner-task-alarms';

// Check if running on native Capacitor platform
function isNative(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

let channelCreated = false;

async function ensureChannel() {
  if (!isNative() || channelCreated) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Life Planner Alarms',
      description: 'High-priority task alarms that sound even when app is closed',
      importance: 5, // MAX importance (heads-up banner + loud sound)
      visibility: 1, // PUBLIC
      vibration: true,
      lights: true,
      lightColor: '#7c3aed',
    });
    channelCreated = true;
  } catch (err) {
    console.warn('[alarmScheduler] Could not create notification channel:', err);
  }
}

/**
 * Hash a string to a 32-bit positive integer (Capacitor notification IDs must be integers).
 */
function hashToInteger(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Schedule native background notifications / alarms for the next 7 days.
 * This runs via Android AlarmManager so alarms ring even if the app is closed.
 */
export async function syncNativeAlarms(
  timetable: TimetableTask[],
  preferences: UserPreferences
) {
  if (!isNative()) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // If notifications & alarms are disabled, cancel all pending
    if (preferences.notificationMode === 'off') {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map(n => ({ id: n.id })),
        });
      }
      return;
    }

    // Check / request permissions
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== 'granted') {
        console.warn('[alarmScheduler] Notification permission denied');
        return;
      }
    }

    await ensureChannel();

    // Cancel existing scheduled notifications to avoid duplicates
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id })),
      });
    }

    const { notificationMode, notifyMinutesBefore = 0 } = preferences;
    const isAlarmMode = notificationMode === 'alarm' || notificationMode === 'both';

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationsToSchedule: any[] = [];

    // Schedule for the next 7 days (day 0 to day 6)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);
      const dow = targetDate.getDay();

      const dayTasks = timetable.filter(t => t.dayOfWeek === dow);

      for (const task of dayTasks) {
        // If alarm mode is active, check if this specific task has alarm disabled
        const hasAlarm = isAlarmMode && !task.alarmDisabled;

        // If in 'alarm' only mode and task has alarm disabled, skip entirely
        if (notificationMode === 'alarm' && task.alarmDisabled) {
          continue;
        }

        // Calculate fire time in hours and minutes
        const leadHours = notifyMinutesBefore / 60;
        const alertTimeHour = task.startHour - leadHours;

        const h = Math.floor(alertTimeHour);
        const m = Math.round((alertTimeHour - h) * 60);

        const scheduleDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
          h,
          m,
          0
        );

        // Only schedule if in future
        if (scheduleDate.getTime() > now.getTime() + 10_000) {
          const dateStr = scheduleDate.toISOString().slice(0, 10);
          const notifId = hashToInteger(`${task.id}_${dateStr}`);

          const minutesText = notifyMinutesBefore > 0
            ? `Starting in ${notifyMinutesBefore} min (${formatHour(task.startHour)} – ${formatHour(task.endHour)})`
            : `${formatHour(task.startHour)} – ${formatHour(task.endHour)}`;

          notificationsToSchedule.push({
            id: notifId,
            title: hasAlarm ? `⏰ ALARM: ${task.title}` : `🔔 ${task.title}`,
            body: minutesText,
            schedule: { at: scheduleDate },
            channelId: CHANNEL_ID,
            smallIcon: 'ic_launcher',
            sound: hasAlarm ? 'res://raw/alarm' : undefined,
            extra: {
              taskId: task.id,
              isAlarm: hasAlarm,
              startHour: task.startHour,
            },
          });
        }
      }
    }

    if (notificationsToSchedule.length > 0) {
      // Capacitor limits batch scheduling to 64 on some Android versions, take earliest 60
      const batch = notificationsToSchedule.slice(0, 60);
      await LocalNotifications.schedule({ notifications: batch });
      console.log(`[alarmScheduler] Scheduled ${batch.length} native alarms/notifications`);
    }
  } catch (err) {
    console.warn('[alarmScheduler] Error scheduling native alarms:', err);
  }
}

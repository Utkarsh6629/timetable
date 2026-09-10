import { useEffect, useRef, useState, useCallback } from 'react';
import { getDay } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { formatHour } from '../lib/utils';
import type { TimetableTask } from '../types';

// ── Web Audio alarm sound generator ──────────────────────────────────────────

let audioCtx: AudioContext | null = null;
let alarmInterval: ReturnType<typeof setInterval> | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Plays a short ascending beep pattern. */
function playBeep() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // Two-tone beep pattern
  const frequencies = [880, 1100]; // A5 → C#6
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.35);
  });
}

/** Starts a repeating alarm beep every 1.5 seconds. */
function startAlarmSound() {
  stopAlarmSound();
  playBeep();
  alarmInterval = setInterval(playBeep, 1500);
}

/** Stops the repeating alarm sound. */
function stopAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

// ── Alarm state (exported for the overlay component) ─────────────────────────

export interface AlarmState {
  active: boolean;
  task: TimetableTask | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Browser notification + alarm hook.
 *
 * - `notification` mode: fires a Web Notification (OS-level)
 * - `alarm` mode: triggers an in-app alarm overlay with sound
 * - `both` mode: does both
 *
 * Mount this once inside the authenticated AppLayout.
 */
export function useNotifications() {
  const { preferences, timetable } = useAppStore();
  const { notificationMode, notifyMinutesBefore } = preferences;
  const enabled = notificationMode !== 'off';
  const useNotif = notificationMode === 'notification' || notificationMode === 'both';
  const useAlarm = notificationMode === 'alarm' || notificationMode === 'both';

  // Track which tasks we've already alerted about (taskId + date combo)
  const notifiedRef = useRef<Set<string>>(new Set());

  // Alarm overlay state
  const [alarm, setAlarm] = useState<AlarmState>({ active: false, task: null });

  const dismissAlarm = useCallback(() => {
    stopAlarmSound();
    setAlarm({ active: false, task: null });
  }, []);

  // Request notification permission when notification mode is enabled
  useEffect(() => {
    if (!useNotif) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, [useNotif]);

  // Polling interval — check every 30 seconds
  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      const dow = getDay(now);
      const today = now.toISOString().slice(0, 10);

      const todayTasks = timetable.filter(t => t.dayOfWeek === dow);

      for (const task of todayTasks) {
        const minutesUntilStart = (task.startHour - currentHour) * 60;
        const notifyKey = `${task.id}_${today}`;

        if (
          minutesUntilStart > 0 &&
          minutesUntilStart <= notifyMinutesBefore &&
          !notifiedRef.current.has(notifyKey)
        ) {
          notifiedRef.current.add(notifyKey);

          const minutesLeft = Math.ceil(minutesUntilStart);
          const body = minutesLeft <= 1
            ? `Starting now! ${formatHour(task.startHour)} – ${formatHour(task.endHour)}`
            : `Starting in ${minutesLeft} min · ${formatHour(task.startHour)} – ${formatHour(task.endHour)}`;

          // Fire OS notification
          if (useNotif && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(`🔔 ${task.title}`, {
              body,
              icon: '/favicon.ico',
              tag: notifyKey,
              silent: useAlarm, // silence the notification sound if alarm will play
            });
          }

          // Fire alarm overlay + sound
          if (useAlarm) {
            setAlarm({ active: true, task });
            startAlarmSound();
          }
        }
      }
    };

    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [enabled, useNotif, useAlarm, notifyMinutesBefore, timetable]);

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

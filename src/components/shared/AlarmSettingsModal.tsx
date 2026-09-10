import { useState, useEffect } from 'react';
import { X, Bell, BellOff, AlarmClock, Volume2, VolumeX, Play, Square, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ALARM_TONE_OPTIONS, previewAlarmSound, stopAlarmSound } from '../../lib/alarmAudio';
import { cn } from '../../lib/utils';
import type { NotificationMode, AlarmTone } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AlarmSettingsModal({ isOpen, onClose }: Props) {
  const { preferences, setNotificationMode, setAlarmTone, setAlarmVolume, setNotifyMinutesBefore } = useAppStore();
  const [playingTone, setPlayingTone] = useState<AlarmTone | null>(null);

  const currentMode = preferences.notificationMode;
  const currentTone = preferences.alarmTone ?? 'radar';
  const currentVolume = preferences.alarmVolume ?? 100;
  const currentMinutes = preferences.notifyMinutesBefore ?? 0;

  // Stop sound if modal closes or unmounts
  useEffect(() => {
    return () => {
      stopAlarmSound();
    };
  }, []);

  if (!isOpen) return null;

  const handleTogglePreview = (tone: AlarmTone) => {
    if (playingTone === tone) {
      stopAlarmSound();
      setPlayingTone(null);
    } else {
      setPlayingTone(tone);
      previewAlarmSound(tone, currentVolume, () => {
        setPlayingTone(null);
      });
    }
  };

  const modes: { id: NotificationMode; label: string; desc: string; icon: typeof Bell }[] = [
    { id: 'off',          label: 'Off',            desc: 'No alerts',                               icon: BellOff },
    { id: 'notification', label: 'Notifications',  desc: 'Silent OS notification banner',           icon: Bell },
    { id: 'alarm',        label: 'Alarm Only',     desc: 'Loud alarm sound & overlay',             icon: AlarmClock },
    { id: 'both',         label: 'Notif + Alarm',  desc: 'Notification + loud alarm',              icon: Bell },
  ];

  const leadOptions = [
    { value: 0, label: 'At start time' },
    { value: 1, label: '1 min before' },
    { value: 2, label: '2 min before' },
    { value: 5, label: '5 min before' },
    { value: 10, label: '10 min before' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          stopAlarmSound();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg card border border-violet-500/30 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto animate-slide-up z-10 scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-base mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <AlarmClock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">Alarm & Alerts</h3>
              <p className="text-xs text-muted">Sound, volume & reminder preferences</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopAlarmSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-secondary-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. Alert Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
              Alert Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {modes.map(({ id, label, icon: Icon }) => {
                const isActive = currentMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={async () => {
                      if (id === 'notification' || id === 'both') {
                        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                          await Notification.requestPermission();
                        }
                      }
                      setNotificationMode(id);
                    }}
                    className={cn(
                      'p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all',
                      isActive
                        ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20'
                        : 'bg-secondary-surface border-base text-secondary hover:border-violet-500/30'
                    )}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-muted'} />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tone & Volume Settings (Only if alarm or both is active) */}
          {(currentMode === 'alarm' || currentMode === 'both') && (
            <div className="space-y-5 animate-fade-in">
              {/* Tone Selection */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                  Alarm Tone
                </label>
                <div className="space-y-1.5">
                  {ALARM_TONE_OPTIONS.map((tone) => {
                    const isSelected = currentTone === tone.id;
                    const isPlaying = playingTone === tone.id;
                    return (
                      <div
                        key={tone.id}
                        onClick={() => setAlarmTone(tone.id)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                          isSelected
                            ? 'bg-violet-500/15 border-violet-500 shadow-sm'
                            : 'bg-secondary-surface border-base hover:border-violet-500/30'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tone.icon}</span>
                          <div>
                            <p className={cn('text-xs font-semibold', isSelected ? 'text-primary' : 'text-secondary')}>
                              {tone.name}
                            </p>
                            <p className="text-[11px] text-muted">{tone.description}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePreview(tone.id);
                          }}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                            isPlaying
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-primary-surface text-secondary hover:text-violet-400 hover:bg-violet-500/10'
                          )}
                        >
                          {isPlaying ? (
                            <>
                              <Square size={12} className="fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play size={12} className="fill-current" />
                              <span>Test</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="p-4 rounded-2xl bg-secondary-surface border border-base space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentVolume === 0 ? (
                      <VolumeX size={16} className="text-muted" />
                    ) : (
                      <Volume2 size={16} className="text-violet-400" />
                    )}
                    <span className="text-xs font-semibold text-primary">Alarm Volume</span>
                  </div>
                  <span className={cn(
                    'text-xs font-bold font-mono px-2 py-0.5 rounded-md',
                    currentVolume >= 80 ? 'bg-violet-500/20 text-violet-400' : 'text-muted'
                  )}>
                    {currentVolume}% {currentVolume === 100 ? '(Really Loud)' : ''}
                  </span>
                </div>

                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={currentVolume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAlarmVolume(val);
                  }}
                  className="w-full h-2 bg-primary-surface rounded-lg appearance-none cursor-pointer accent-violet-500"
                />

                <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                  <span>Soft</span>
                  <span>Normal</span>
                  <span className="text-violet-400 font-semibold">Piercing Loud (100%)</span>
                </div>
              </div>

              {/* Per-task Override Information */}
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3 flex gap-2.5">
                <Info size={16} className="text-violet-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-secondary leading-relaxed">
                  <strong className="text-primary">Per-Task Alarm Control:</strong> In <span className="text-violet-400 font-semibold">Notif + Alarm</span> mode, alarms are active on all tasks by default. You can disable the alarm for any individual task by editing the task or clicking the bell icon on that task.
                </p>
              </div>
            </div>
          )}

          {/* 3. Alert Timing (Lead Time) */}
          {currentMode !== 'off' && (
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                Alert Timing
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {leadOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNotifyMinutesBefore(opt.value)}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all',
                      currentMinutes === opt.value
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-secondary-surface border-base text-secondary hover:border-violet-500/30'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-5 mt-6 border-t border-base flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopAlarmSound();
              onClose();
            }}
            className="btn-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

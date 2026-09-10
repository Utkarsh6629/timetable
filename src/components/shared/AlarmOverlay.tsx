import { AlarmClock, X } from 'lucide-react';
import type { TimetableTask } from '../../types';
import { formatHour } from '../../lib/utils';

interface Props {
  task: TimetableTask;
  onDismiss: () => void;
}

/**
 * Full-screen alarm overlay with pulsing animation.
 * Displayed when `notificationMode` is 'alarm' or 'both'.
 */
export function AlarmOverlay({ task, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop with pulsing glow */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: `radial-gradient(circle at center, ${task.color}40 0%, rgba(0,0,0,0.92) 70%)`,
        }}
      />

      {/* Content card */}
      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Pulsing ring */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: task.color }}
            />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${task.color}, ${task.color}bb)`,
                boxShadow: `0 0 60px ${task.color}66`,
              }}
            >
              <AlarmClock size={36} className="text-white" />
            </div>
          </div>
        </div>

        {/* Task info */}
        <div className="text-center space-y-2 mb-8">
          <p className="text-white/60 text-sm font-semibold uppercase tracking-wider">
            ⏰ Time for
          </p>
          <h1 className="text-3xl font-bold text-white">
            {task.title}
          </h1>
          <p className="text-white/70 text-base">
            {formatHour(task.startHour)} – {formatHour(task.endHour)}
            <span className="ml-2 text-white/50">
              ({Math.round((task.endHour - task.startHour) * 60)} min)
            </span>
          </p>
          {task.description && (
            <p className="text-white/50 text-sm mt-2 max-w-xs mx-auto">
              {task.description}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${task.color}, ${task.color}cc)`,
            boxShadow: `0 8px 40px ${task.color}55`,
          }}
        >
          Dismiss Alarm
        </button>
      </div>
    </div>
  );
}

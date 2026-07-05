import { useState } from 'react';
import { X, Moon } from 'lucide-react';
import { formatHour } from '../../lib/utils';

interface Props {
  start: number;
  end: number;
  onSave: (start: number, end: number) => void;
  onClose: () => void;
}

export function HourRangeSelector({ start, end, onSave, onClose }: Props) {
  const [s, setS] = useState(start);
  const [e, setE] = useState(end);

  // Start hour: any full hour 0–23
  const startHours = Array.from({ length: 24 }, (_, i) => i);

  // End hour: must be after start, up to start + 24h (so day can wrap past midnight)
  // E.g. if start = 8 (8am), end can be 9am same day up to 8am next day (hour 32)
  const endHours = Array.from({ length: 24 }, (_, i) => s + 1 + i);

  // If saved end is now out of the valid range for new start, clamp it
  const clampedEnd = e <= s || e > s + 24 ? s + 17 : e; // default to ~5pm offset

  const handleStartChange = (newStart: number) => {
    setS(newStart);
    // Keep end relative offset the same if possible, otherwise reset to +17h
    const offset = e - s;
    const newEnd = newStart + Math.max(1, Math.min(24, offset));
    setE(newEnd);
  };

  const currentEnd = e <= s || e > s + 24 ? clampedEnd : e;
  const spansNextDay = currentEnd >= 24;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-base">
          <h2 className="text-base font-semibold text-primary">Day Hours Range</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs text-muted">
            Define when your personal day starts and ends. If your day runs past midnight, the late-night hours still count toward the same day.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Day Starts</label>
              <select
                className="input-base"
                value={s}
                onChange={ev => handleStartChange(Number(ev.target.value))}
              >
                {startHours.map(h => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Day Ends</label>
              <select
                className="input-base"
                value={currentEnd}
                onChange={ev => setE(Number(ev.target.value))}
              >
                {endHours.map(h => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration summary */}
          <div className="rounded-xl bg-secondary-surface px-4 py-3 flex items-center gap-3">
            {spansNextDay
              ? <Moon size={16} className="text-violet-400 shrink-0" />
              : <div className="w-4 h-4 rounded-full bg-yellow-400 shrink-0" />
            }
            <div className="text-xs text-secondary">
              <span className="font-semibold text-primary">{formatHour(s)}</span>
              {' → '}
              <span className="font-semibold text-primary">{formatHour(currentEnd)}</span>
              {' '}
              <span className="text-muted">
                ({currentEnd - s}h window
                {spansNextDay ? ', spans next day' : ''})
              </span>
            </div>
          </div>

          {spansNextDay && (
            <p className="text-xs text-violet-400 flex items-center gap-1.5">
              <Moon size={12} />
              Hours marked <strong>+1</strong> belong to this day even though they fall after midnight.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-base">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(s, currentEnd)}>Apply</button>
        </div>
      </div>
    </div>
  );
}

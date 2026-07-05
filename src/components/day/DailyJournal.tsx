import { useCallback } from 'react';
import { BookOpen, Trophy, Lightbulb } from 'lucide-react';
import type { DayRecord } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  dateStr: string;
  record: DayRecord;
}

function JournalField({
  label,
  icon: Icon,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  icon: typeof BookOpen;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-violet-400" />
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
      </div>
      <textarea
        className="textarea-base min-h-[80px]"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export function DailyJournal({ dateStr, record }: Props) {
  const { updateDayNotes } = useAppStore();

  const handleChange = useCallback(
    (field: 'notes' | 'wins' | 'improvements', value: string) => {
      updateDayNotes(dateStr, field, value);
    },
    [dateStr, updateDayNotes]
  );

  return (
    <div className="card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Daily Journal</h2>
      <JournalField
        label="Notes"
        icon={BookOpen}
        value={record.notes}
        placeholder="How's your day going? Any thoughts or plans…"
        onChange={v => handleChange('notes', v)}
      />
      <JournalField
        label="Wins / Accomplishments"
        icon={Trophy}
        value={record.wins}
        placeholder="What did you accomplish today? Celebrate small wins too…"
        onChange={v => handleChange('wins', v)}
      />
      <JournalField
        label="Improvements for Tomorrow"
        icon={Lightbulb}
        value={record.improvements}
        placeholder="What would you do differently? What to improve…"
        onChange={v => handleChange('improvements', v)}
      />
      <p className="text-xs text-muted text-right">Auto-saved ✓</p>
    </div>
  );
}

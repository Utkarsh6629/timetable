import { useState, useRef, useEffect } from 'react';
import { Target, Plus, X, ChevronDown, ChevronUp, Sparkles, StickyNote, CheckCircle2, Circle } from 'lucide-react';
import { format, isSunday, addDays } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

interface Props {
  currentDate: Date;
}

export function WeeklyGoals({ currentDate }: Props) {
  const weeklyGoals = useAppStore(s => s.weeklyGoals);
  const {
    getWeekKey,
    initWeeklyGoals,
    addWeeklyGoalItem,
    toggleWeeklyGoalItem,
    removeWeeklyGoalItem,
    updateWeeklyGoalItem,
    updateWeeklyGoalNotes,
  } = useAppStore();

  // For Sunday, show the upcoming week (next Monday's week key)
  const isSun = isSunday(currentDate);
  const weekKey = getWeekKey(isSun ? addDays(currentDate, 1) : currentDate);
  const record = weeklyGoals[weekKey] ?? null;

  const [isExpanded, setIsExpanded] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Reset expanded state if the week changes
  useEffect(() => {
    setIsExpanded(false);
  }, [weekKey]);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleAddGoal = () => {
    if (!newGoalText.trim()) return;
    if (!record) initWeeklyGoals(weekKey);
    addWeeklyGoalItem(weekKey, newGoalText.trim());
    setNewGoalText('');
    inputRef.current?.focus();
  };

  const handleStartEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      updateWeeklyGoalItem(weekKey, editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleInitAndFocus = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    initWeeklyGoals(weekKey);
    setIsExpanded(true);
  };

  // Calculate week date range for display
  const weekStart = new Date(weekKey + 'T00:00:00');
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;

  const hasGoalsOrNotes = Boolean(record && (record.goals.length > 0 || record.notes));

  // No goals set yet and not in active add mode — show prompt
  if (!hasGoalsOrNotes && !isExpanded) {
    return (
      <div
        className="card overflow-hidden cursor-pointer group"
        onClick={handleInitAndFocus}
      >
        <div
          className="relative p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6)' }}
        >
          <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,white,white_1px,transparent_1px,transparent_8px)]" />
          <div className="relative space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-300" />
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {isSun ? 'Plan Your Upcoming Week' : 'Weekly Goals'}
              </span>
            </div>
            <p className="text-lg font-bold">
              {isSun
                ? 'It\'s Sunday — set your goals for next week!'
                : 'No goals set for this week yet'}
            </p>
            <p className="text-sm opacity-80">{weekLabel}</p>
            <button
              type="button"
              onClick={handleInitAndFocus}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-semibold transition-colors"
            >
              <Target size={16} />
              Set Weekly Goals
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Goals exist or currently expanded — show checklist + notes
  const goals = record?.goals ?? [];
  const total = goals.length;
  const done = goals.filter(g => g.completed).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Weekly Goals
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{weekLabel}</span>
            {!hasGoalsOrNotes && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-muted hover:text-primary p-1 rounded-lg hover:bg-secondary-surface transition-colors"
                title="Cancel"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">{done} of {total} goals completed</span>
              <span className={cn(
                'font-semibold',
                progress === 100 ? 'text-green-400' : progress >= 50 ? 'text-violet-400' : 'text-muted'
              )}>
                {progress}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary-surface overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: progress === 100
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="px-5 pb-2 space-y-1">
        {goals.map(goal => (
          <div
            key={goal.id}
            className={cn(
              'group/item flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors',
              goal.completed ? 'bg-green-500/5' : 'hover:bg-secondary-surface/50'
            )}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleWeeklyGoalItem(weekKey, goal.id)}
              className="shrink-0 transition-transform hover:scale-110"
            >
              {goal.completed
                ? <CheckCircle2 size={18} className="text-green-500" />
                : <Circle size={18} className="text-muted hover:text-violet-400" />
              }
            </button>

            {/* Text (editable) */}
            {editingId === goal.id ? (
              <input
                ref={editInputRef}
                className="flex-1 bg-transparent text-sm text-primary outline-none border-b border-violet-400/50 py-0.5"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') { setEditingId(null); setEditText(''); }
                }}
              />
            ) : (
              <span
                className={cn(
                  'flex-1 text-sm cursor-pointer transition-colors min-w-0 truncate',
                  goal.completed ? 'text-muted line-through' : 'text-primary'
                )}
                onClick={() => handleStartEdit(goal.id, goal.text)}
              >
                {goal.text}
              </span>
            )}

            {/* Delete button */}
            <button
              onClick={() => removeWeeklyGoalItem(weekKey, goal.id)}
              className="shrink-0 opacity-0 group-hover/item:opacity-100 text-muted hover:text-red-400 transition-all p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Add goal input */}
        <div className="flex items-center gap-2 py-2">
          <Plus size={16} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted/60 outline-none"
            placeholder="Add a goal…"
            value={newGoalText}
            onChange={e => setNewGoalText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddGoal(); }}
          />
          {newGoalText.trim() && (
            <button
              onClick={handleAddGoal}
              className="text-xs text-violet-400 font-semibold hover:text-violet-300 transition-colors shrink-0"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* Notes section (collapsible) */}
      <div className="border-t border-base">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hover:bg-secondary-surface/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <StickyNote size={13} />
            <span>Notes</span>
            {record?.notes && !showNotes && (
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            )}
          </div>
          {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showNotes && (
          <div className="px-5 pb-4">
            <textarea
              className="textarea-base min-h-[80px]"
              placeholder="Thoughts, reflections, plans for the week…"
              value={record?.notes ?? ''}
              onChange={e => updateWeeklyGoalNotes(weekKey, e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

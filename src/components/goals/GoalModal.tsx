import { useState } from 'react';
import { format, addMonths, endOfYear } from 'date-fns';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Flame,
  Check,
} from 'lucide-react';
import type { GoalCategory, GoalStatus, HighLevelGoal, GoalMilestone } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_META } from './goalUtils';
import { GOAL_TEMPLATES, type GoalTemplate } from './goalTemplates';
import { generateId } from '../../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: HighLevelGoal | null;
}

export function GoalModal({ isOpen, onClose, goalToEdit }: Props) {
  const { addHighLevelGoal, updateHighLevelGoal } = useAppStore();

  const isEditing = Boolean(goalToEdit);

  // Form states
  const [title, setTitle] = useState(() => goalToEdit?.title ?? '');
  const [description, setDescription] = useState(() => goalToEdit?.description ?? '');
  const [whyMotivation, setWhyMotivation] = useState(() => goalToEdit?.whyMotivation ?? '');
  const [category, setCategory] = useState<GoalCategory>(() => goalToEdit?.category ?? 'career');
  const [targetDate, setTargetDate] = useState(() =>
    goalToEdit?.targetDate ?? format(addMonths(new Date(), 3), 'yyyy-MM-dd')
  );
  const [status, setStatus] = useState<GoalStatus>(() => goalToEdit?.status ?? 'in-progress');
  const [isPrimary, setIsPrimary] = useState(() => goalToEdit?.isPrimary ?? false);

  // Metric
  const [enableMetric, setEnableMetric] = useState(() => typeof goalToEdit?.metricTarget === 'number');
  const [metricTarget, setMetricTarget] = useState<number | ''>(() => goalToEdit?.metricTarget ?? 100);
  const [metricCurrent, setMetricCurrent] = useState<number | ''>(() => goalToEdit?.metricCurrent ?? 0);
  const [metricUnit, setMetricUnit] = useState(() => goalToEdit?.metricUnit ?? '');

  // Habits
  const [habits, setHabits] = useState<string[]>(() => goalToEdit?.habits ?? []);
  const [habitInput, setHabitInput] = useState('');

  // Milestones
  const [milestones, setMilestones] = useState<GoalMilestone[]>(() => goalToEdit?.milestones ?? []);
  const [milestoneInput, setMilestoneInput] = useState('');

  // Template drawer
  const [showTemplates, setShowTemplates] = useState(false);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: GoalTemplate) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    setWhyMotivation(tpl.whyMotivation);
    setDescription(tpl.description);
    setTargetDate(format(addMonths(new Date(), tpl.targetMonths), 'yyyy-MM-dd'));
    setHabits(tpl.habits);
    if (typeof tpl.metricTarget === 'number') {
      setEnableMetric(true);
      setMetricTarget(tpl.metricTarget);
      setMetricCurrent(tpl.metricCurrent ?? 0);
      setMetricUnit(tpl.metricUnit ?? '');
    } else {
      setEnableMetric(false);
    }
    setMilestones(
      tpl.milestones.map(text => ({
        id: generateId(),
        title: text,
        completed: false,
      }))
    );
    setShowTemplates(false);
  };

  const handleAddMilestone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!milestoneInput.trim()) return;
    setMilestones(prev => [
      ...prev,
      {
        id: generateId(),
        title: milestoneInput.trim(),
        completed: false,
      },
    ]);
    setMilestoneInput('');
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const handleAddHabit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!habitInput.trim()) return;
    if (!habits.includes(habitInput.trim())) {
      setHabits(prev => [...prev, habitInput.trim()]);
    }
    setHabitInput('');
  };

  const handleRemoveHabit = (text: string) => {
    setHabits(prev => prev.filter(h => h !== text));
  };

  const handleQuickDeadline = (months: number) => {
    setTargetDate(format(addMonths(new Date(), months), 'yyyy-MM-dd'));
  };

  const handleEndOfYear = () => {
    setTargetDate(format(endOfYear(new Date()), 'yyyy-MM-dd'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && goalToEdit) {
      updateHighLevelGoal(goalToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        whyMotivation: whyMotivation.trim(),
        category,
        targetDate,
        status,
        isPrimary,
        metricTarget: enableMetric && typeof metricTarget === 'number' ? metricTarget : undefined,
        metricCurrent: enableMetric && typeof metricCurrent === 'number' ? metricCurrent : undefined,
        metricUnit: enableMetric ? metricUnit.trim() : undefined,
        habits,
        milestones,
      });
    } else {
      addHighLevelGoal({
        title: title.trim(),
        description: description.trim(),
        whyMotivation: whyMotivation.trim(),
        category,
        targetDate,
        status,
        isPrimary,
        metricTarget: enableMetric && typeof metricTarget === 'number' ? metricTarget : undefined,
        metricCurrent: enableMetric && typeof metricCurrent === 'number' ? metricCurrent : undefined,
        metricUnit: enableMetric ? metricUnit.trim() : undefined,
        habits,
        milestones,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-card border border-base shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-primary flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" />
              {isEditing ? 'Edit High-Level Goal' : 'Create High-Level Goal'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Define your overarching objective, key checkpoints, and intrinsic motivation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setShowTemplates(v => !v)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <Layers size={13} />
                {showTemplates ? 'Hide Templates' : 'Use Template'}
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-ghost p-1.5 text-muted hover:text-primary rounded-xl"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Template Drawer */}
        {showTemplates && !isEditing && (
          <div className="bg-secondary-surface/70 px-6 py-4 border-b border-base space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Choose an Inspiring Goal Blueprint
              </span>
              <span className="text-xs text-muted">1-click autofill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {GOAL_TEMPLATES.map(tpl => {
                const meta = CATEGORY_META[tpl.category];
                const TplIcon = meta.icon;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="flex flex-col text-left p-2.5 rounded-xl border border-base bg-card hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${meta.badgeClass}`}>
                        <TplIcon size={10} />
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted">~{tpl.targetMonths} mo</span>
                    </div>
                    <span className="text-xs font-bold text-primary group-hover:text-violet-400 line-clamp-1">
                      {tpl.title}
                    </span>
                    <span className="text-[11px] text-secondary line-clamp-2 mt-0.5">
                      {tpl.whyMotivation}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Goal Title */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Goal Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Master Full-Stack Web Development & Launch My App"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-base font-medium text-sm md:text-base py-2.5"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Domain / Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_META) as GoalCategory[]).map(catKey => {
                const meta = CATEGORY_META[catKey];
                const Icon = meta.icon;
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? `${meta.badgeClass} ring-2 ring-violet-500/30 font-semibold shadow-sm`
                        : 'bg-secondary-surface border-base text-secondary hover:text-primary hover:border-violet-500/30'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Date & Quick shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Target Deadline <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickDeadline(1)}
                  className="btn-ghost text-[10px] py-0.5 px-1.5 rounded-lg border border-base"
                >
                  +1 Mo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDeadline(3)}
                  className="btn-ghost text-[10px] py-0.5 px-1.5 rounded-lg border border-base"
                >
                  +3 Mo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDeadline(6)}
                  className="btn-ghost text-[10px] py-0.5 px-1.5 rounded-lg border border-base"
                >
                  +6 Mo
                </button>
                <button
                  type="button"
                  onClick={handleEndOfYear}
                  className="btn-ghost text-[10px] py-0.5 px-1.5 rounded-lg border border-base"
                >
                  Year End
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="input-base text-sm py-2 pl-10"
              />
              <Calendar size={16} className="absolute left-3.5 top-3 text-muted pointer-events-none" />
            </div>
          </div>

          {/* The "Why" Motivation */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              The Deep &quot;Why&quot; (Intrinsic Motivation)
            </label>
            <textarea
              rows={2}
              placeholder="Why does achieving this goal matter to your life, freedom, or purpose? (This keeps you going when motivation dips)"
              value={whyMotivation}
              onChange={e => setWhyMotivation(e.target.value)}
              className="textarea-base text-xs md:text-sm py-2"
            />
          </div>

          {/* Description / Scope */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Goal Overview &amp; Scope (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Detailed description or context for this high level goal..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="textarea-base text-xs py-2"
            />
          </div>

          {/* Milestones / Checkpoints Builder */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
              Checkpoints &amp; Milestones ({milestones.length})
            </label>
            <p className="text-[11px] text-muted">
              Break this high-level goal into actionable key milestones that mark genuine progress.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add milestone (e.g. Pass certifications, Launch v1)..."
                value={milestoneInput}
                onChange={e => setMilestoneInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
                className="input-base text-xs py-2 flex-1"
              />
              <button
                type="button"
                onClick={() => handleAddMilestone()}
                className="btn-secondary text-xs py-2 px-3 shrink-0"
              >
                <Plus size={13} />
                Add
              </button>
            </div>

            {milestones.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-secondary-surface/70 border border-base text-xs"
                  >
                    <span className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate text-primary">{m.title}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="text-muted hover:text-red-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Supporting Habits */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">
              Daily / Weekly Supporting Habits
            </label>
            <p className="text-[11px] text-muted">
              What recurring routines feed directly into achieving this goal?
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Code 90 minutes daily, 3 gym sessions/week..."
                value={habitInput}
                onChange={e => setHabitInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHabit();
                  }
                }}
                className="input-base text-xs py-2 flex-1"
              />
              <button
                type="button"
                onClick={() => handleAddHabit()}
                className="btn-secondary text-xs py-2 px-3 shrink-0"
              >
                <Plus size={13} />
                Add
              </button>
            </div>

            {habits.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {habits.map((h, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs"
                  >
                    <span>{h}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHabit(h)}
                      className="hover:text-red-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Optional Quantitative Metric */}
          <div className="rounded-2xl border border-base bg-secondary-surface/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={15} className="text-amber-400" />
                <span className="text-xs font-bold text-primary">Track Quantitative Metric (Optional)</span>
              </div>
              <input
                type="checkbox"
                id="enableMetric"
                checked={enableMetric}
                onChange={e => setEnableMetric(e.target.checked)}
                className="rounded accent-violet-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {enableMetric && (
              <div className="grid grid-cols-3 gap-2 pt-1 animate-fadeIn">
                <div>
                  <label className="text-[10px] text-muted block mb-1">Current</label>
                  <input
                    type="number"
                    value={metricCurrent}
                    onChange={e => setMetricCurrent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="input-base text-xs py-1.5"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-1">Target</label>
                  <input
                    type="number"
                    value={metricTarget}
                    onChange={e => setMetricTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    className="input-base text-xs py-1.5"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-1">Unit</label>
                  <input
                    type="text"
                    value={metricUnit}
                    onChange={e => setMetricUnit(e.target.value)}
                    className="input-base text-xs py-1.5"
                    placeholder="kg, $, books"
                  />
                </div>
              </div>
            )}
          </div>

          {/* North Star Focus & Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-base">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={e => setIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-primary flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Make this my primary <strong>North Star Goal</strong>
              </span>
            </label>

            {isEditing && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Status:</span>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as GoalStatus)}
                  className="input-base text-xs py-1 px-2.5 w-auto"
                >
                  <option value="in-progress">In Progress</option>
                  <option value="achieved">Achieved 🎉</option>
                  <option value="paused">On Hold</option>
                </select>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-base">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-5 shadow-lg shadow-violet-500/20"
            >
              <Check size={14} />
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

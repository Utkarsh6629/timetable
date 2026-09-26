import { useState } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  Trophy,
  Flame,
  ArrowUpRight,
  Minus,
} from 'lucide-react';
import type { HighLevelGoal } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_META, calculateGoalProgress, getDaysRemainingText } from './goalUtils';

interface Props {
  goal: HighLevelGoal;
  onEdit: (goal: HighLevelGoal) => void;
}

export function NorthStarHero({ goal, onEdit }: Props) {
  const {
    toggleMilestone,
    addMilestone,
    removeMilestone,
    updateHighLevelGoal,
    deleteHighLevelGoal,
  } = useAppStore();

  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const progress = calculateGoalProgress(goal);
  const cat = CATEGORY_META[goal.category] ?? CATEGORY_META.project;
  const CatIcon = cat.icon;
  const deadline = getDaysRemainingText(goal.targetDate);
  const isAchieved = goal.status === 'achieved';

  const completedMilestonesCount = goal.milestones.filter(m => m.completed).length;

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneText.trim()) return;
    addMilestone(goal.id, newMilestoneText.trim());
    setNewMilestoneText('');
    setIsAddingMilestone(false);
  };

  const handleToggleAchieved = () => {
    if (isAchieved) {
      updateHighLevelGoal(goal.id, { status: 'in-progress' });
    } else {
      updateHighLevelGoal(goal.id, { status: 'achieved' });
    }
  };

  const handleAdjustMetric = (delta: number) => {
    if (typeof goal.metricCurrent !== 'number') return;
    const current = Math.max(0, goal.metricCurrent + delta);
    updateHighLevelGoal(goal.id, { metricCurrent: current });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-b from-card via-card to-card/90 p-5 md:p-7 shadow-2xl shadow-violet-500/10">
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Top Bar: North Star Flag, Category, Countdown & Actions */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-base/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* North Star Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-violet-500/25 to-purple-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20">
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            NORTH STAR OBJECTIVE
          </span>

          {/* Category Tag */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cat.badgeClass}`}>
            <CatIcon size={12} />
            {cat.label}
          </span>

          {/* Target Countdown */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              deadline.isOverdue
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-secondary-surface text-secondary border border-base'
            }`}
            title={`Target: ${deadline.formattedDate}`}
          >
            <Calendar size={12} className="text-muted" />
            {deadline.text}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAchieved}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              isAchieved
                ? 'bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30'
                : 'btn-secondary hover:border-green-500 hover:text-green-400'
            }`}
            title={isAchieved ? 'Mark In Progress' : 'Mark Achieved'}
          >
            <Trophy size={13} className={isAchieved ? 'text-green-400' : 'text-muted'} />
            {isAchieved ? 'Goal Conquered 🎉' : 'Mark Achieved'}
          </button>

          <button
            onClick={() => onEdit(goal)}
            className="btn-ghost p-1.5 rounded-xl text-muted hover:text-primary"
            title="Edit North Star Goal"
          >
            <Edit3 size={15} />
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Delete North Star Goal "${goal.title}"?`)) {
                deleteHighLevelGoal(goal.id);
              }
            }}
            className="btn-ghost p-1.5 rounded-xl text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete Goal"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 pt-5 space-y-6">
        {/* Goal Title */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-snug">
            {goal.title}
          </h2>
          {goal.description && (
            <p className="mt-2 text-sm text-secondary leading-relaxed max-w-3xl">
              {goal.description}
            </p>
          )}
        </div>

        {/* Intrinsic Motivation Quote Banner */}
        {goal.whyMotivation && (
          <div className="relative rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent p-4 border-l-4 border-violet-500 border-t border-r border-b border-violet-500/10">
            <div className="flex items-start gap-2.5">
              <span className="text-violet-400 font-serif text-2xl leading-none select-none">“</span>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider font-bold text-violet-400 mb-1">
                  The Deep &quot;Why&quot; (Intrinsic Motivation)
                </p>
                <p className="text-sm font-medium italic text-primary/90 leading-relaxed">
                  {goal.whyMotivation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress & Metric Block */}
        <div className="rounded-2xl bg-secondary-surface/70 p-4 border border-base space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">Progress</span>
              <span className="text-xs font-semibold text-violet-400">
                {goal.milestones.length > 0 && `${completedMilestonesCount}/${goal.milestones.length} milestones`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-violet-400">{progress}%</span>
              {isAchieved && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-bold border border-green-500/30">
                  COMPLETED
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full rounded-full bg-black/20 dark:bg-white/5 overflow-hidden p-0.5 border border-base/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-400 transition-all duration-700 shadow-md shadow-violet-500/30"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Metric Counter If Applicable */}
          {typeof goal.metricTarget === 'number' && goal.metricTarget > 0 && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-base/60 text-xs">
              <div className="flex items-center gap-1.5 text-secondary">
                <Flame size={14} className="text-amber-400" />
                <span>Target Metric:</span>
                <span className="font-bold text-primary">
                  {goal.metricCurrent ?? 0} / {goal.metricTarget} {goal.metricUnit ?? ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAdjustMetric(-1)}
                  className="btn-ghost p-1 rounded-lg border border-base"
                  title="Decrement metric"
                >
                  <Minus size={13} />
                </button>
                <button
                  onClick={() => handleAdjustMetric(1)}
                  className="btn-ghost p-1 rounded-lg border border-base"
                  title="Increment metric"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Supporting Habits / Daily Action Routines */}
        {goal.habits && goal.habits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Supporting Daily & Weekly Habits
            </p>
            <div className="flex flex-wrap gap-2">
              {goal.habits.map((habit, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 px-3 py-1.5 text-xs text-primary border border-violet-500/20"
                >
                  <ArrowUpRight size={13} className="text-violet-400" />
                  <span>{habit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones / Checkpoints List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">
              Milestones & Checkpoints ({completedMilestonesCount}/{goal.milestones.length})
            </h3>
            <button
              onClick={() => setIsAddingMilestone(v => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Plus size={14} />
              {isAddingMilestone ? 'Cancel' : 'Add Milestone'}
            </button>
          </div>

          {/* Quick Add Form */}
          {isAddingMilestone && (
            <form onSubmit={handleAddMilestone} className="flex items-center gap-2 animate-fadeIn">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Build MVP authentication & database"
                value={newMilestoneText}
                onChange={e => setNewMilestoneText(e.target.value)}
                className="input-base text-xs py-2 flex-1"
              />
              <button type="submit" className="btn-primary text-xs py-2 px-3">
                Add
              </button>
            </form>
          )}

          {/* Milestones Grid / List */}
          {goal.milestones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base p-4 text-center">
              <p className="text-xs text-muted">
                No checkpoints defined yet. Break this big goal into 3-5 manageable milestones!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {goal.milestones.map(m => (
                <div
                  key={m.id}
                  className={`group flex items-center justify-between gap-3 rounded-xl p-3 border transition-all ${
                    m.completed
                      ? 'bg-green-500/5 border-green-500/20 text-muted line-through'
                      : 'bg-card border-base hover:border-violet-500/40 text-primary'
                  }`}
                >
                  <button
                    onClick={() => toggleMilestone(goal.id, m.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <span className="shrink-0 transition-transform active:scale-90">
                      {m.completed ? (
                        <CheckCircle2 size={18} className="text-green-400" />
                      ) : (
                        <Circle size={18} className="text-muted group-hover:text-violet-400" />
                      )}
                    </span>
                    <span className="text-sm font-medium break-words">{m.title}</span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.targetDate && (
                      <span className="text-[11px] text-muted hidden sm:inline">
                        {m.targetDate}
                      </span>
                    )}
                    <button
                      onClick={() => removeMilestone(goal.id, m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-400 transition-opacity"
                      title="Remove milestone"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Star,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Trophy,
} from 'lucide-react';
import type { HighLevelGoal } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_META, calculateGoalProgress, getDaysRemainingText, STATUS_META } from './goalUtils';

interface Props {
  goal: HighLevelGoal;
  onEdit: (goal: HighLevelGoal) => void;
}

export function GoalCard({ goal, onEdit }: Props) {
  const {
    toggleMilestone,
    addMilestone,
    removeMilestone,
    setPrimaryHighLevelGoal,
    deleteHighLevelGoal,
    updateHighLevelGoal,
  } = useAppStore();

  const [expanded, setExpanded] = useState(false);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const progress = calculateGoalProgress(goal);
  const cat = CATEGORY_META[goal.category] ?? CATEGORY_META.project;
  const CatIcon = cat.icon;
  const deadline = getDaysRemainingText(goal.targetDate);
  const statusInfo = STATUS_META[goal.status] ?? STATUS_META['in-progress'];
  const isAchieved = goal.status === 'achieved';

  const completedCount = goal.milestones.filter(m => m.completed).length;

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneText.trim()) return;
    addMilestone(goal.id, newMilestoneText.trim());
    setNewMilestoneText('');
    setIsAddingMilestone(false);
  };

  const handleToggleAchieved = () => {
    updateHighLevelGoal(goal.id, {
      status: isAchieved ? 'in-progress' : 'achieved',
    });
  };

  return (
    <div
      className={`card p-4 md:p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
        goal.isPrimary ? 'border-violet-500/40 shadow-sm' : 'border-base'
      }`}
    >
      <div>
        {/* Top Header: Category, Status & Action menu */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.badgeClass}`}>
              <CatIcon size={12} />
              {cat.label}
            </span>

            <span className={`text-[11px] rounded-full px-2 py-0.5 font-medium ${statusInfo.badgeClass}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!goal.isPrimary && (
              <button
                onClick={() => setPrimaryHighLevelGoal(goal.id)}
                className="btn-ghost p-1.5 text-muted hover:text-amber-400"
                title="Set as North Star Goal"
              >
                <Star size={15} />
              </button>
            )}

            <button
              onClick={() => onEdit(goal)}
              className="btn-ghost p-1.5 text-muted hover:text-violet-400"
              title="Edit Goal"
            >
              <Edit3 size={15} />
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Delete "${goal.title}"?`)) {
                  deleteHighLevelGoal(goal.id);
                }
              }}
              className="btn-ghost p-1.5 text-muted hover:text-red-400"
              title="Delete Goal"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Goal Title */}
        <h3 className="text-base md:text-lg font-bold text-primary leading-snug">
          {goal.title}
        </h3>

        {/* The Why snippet */}
        {goal.whyMotivation && (
          <p className="mt-1.5 text-xs italic text-secondary line-clamp-2">
            &quot;{goal.whyMotivation}&quot;
          </p>
        )}

        {/* Target Date Pill */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <Calendar size={13} />
          <span className={deadline.isOverdue ? 'text-red-400 font-semibold' : ''}>
            {deadline.text} ({deadline.formattedDate})
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">
              {goal.milestones.length > 0
                ? `${completedCount} of ${goal.milestones.length} milestones`
                : 'Progress'}
            </span>
            <span className="font-bold text-violet-400">{progress}%</span>
          </div>
          <div className="progress-bar h-2">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Metric target if available */}
        {typeof goal.metricTarget === 'number' && (
          <div className="mt-2 text-xs text-muted flex items-center justify-between">
            <span>Target:</span>
            <span className="font-semibold text-primary">
              {goal.metricCurrent ?? 0} / {goal.metricTarget} {goal.metricUnit ?? ''}
            </span>
          </div>
        )}

        {/* Expandable Milestones checklist */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-base space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">Milestones</span>
              <button
                onClick={() => setIsAddingMilestone(v => !v)}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
              >
                <Plus size={12} />
                {isAddingMilestone ? 'Cancel' : 'Add'}
              </button>
            </div>

            {isAddingMilestone && (
              <form onSubmit={handleAddMilestone} className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  placeholder="New milestone..."
                  value={newMilestoneText}
                  onChange={e => setNewMilestoneText(e.target.value)}
                  className="input-base text-xs py-1.5 px-3 flex-1"
                />
                <button type="submit" className="btn-primary text-xs py-1.5 px-2.5">
                  Save
                </button>
              </form>
            )}

            {goal.milestones.length === 0 ? (
              <p className="text-xs text-muted py-1">No milestones added yet.</p>
            ) : (
              <div className="space-y-1.5">
                {goal.milestones.map(m => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg text-xs transition-all ${
                      m.completed
                        ? 'bg-green-500/5 text-muted line-through'
                        : 'bg-secondary-surface/70 text-primary'
                    }`}
                  >
                    <button
                      onClick={() => toggleMilestone(goal.id, m.id)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0"
                    >
                      {m.completed ? (
                        <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                      ) : (
                        <Circle size={15} className="text-muted shrink-0" />
                      )}
                      <span className="truncate">{m.title}</span>
                    </button>
                    <button
                      onClick={() => removeMilestone(goal.id, m.id)}
                      className="text-muted hover:text-red-400 p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="mt-4 pt-3 border-t border-base flex items-center justify-between text-xs">
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-secondary hover:text-primary inline-flex items-center gap-1 font-medium transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{expanded ? 'Hide Checkpoints' : `View ${goal.milestones.length} Checkpoints`}</span>
        </button>

        <button
          onClick={handleToggleAchieved}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-colors ${
            isAchieved
              ? 'bg-green-500/15 text-green-300'
              : 'text-muted hover:text-green-400'
          }`}
        >
          <Trophy size={13} />
          {isAchieved ? 'Achieved' : 'Complete'}
        </button>
      </div>
    </div>
  );
}

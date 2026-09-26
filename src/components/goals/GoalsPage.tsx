import { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  Trophy,
  CheckCircle2,
  TrendingUp,
  Layers,
  Compass,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { HighLevelGoal, GoalCategory, GoalStatus } from '../../types';
import { NorthStarHero } from './NorthStarHero';
import { GoalCard } from './GoalCard';
import { GoalModal } from './GoalModal';
import { CATEGORY_META, calculateGoalProgress } from './goalUtils';
import { GOAL_TEMPLATES } from './goalTemplates';

export function GoalsPage() {
  const { highLevelGoals, addHighLevelGoal } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<HighLevelGoal | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');

  // Find designated North Star Goal
  const northStarGoal = useMemo(() => {
    return (
      highLevelGoals.find(g => g.isPrimary && g.status !== 'achieved') ||
      highLevelGoals.find(g => g.isPrimary) ||
      null
    );
  }, [highLevelGoals]);

  // Filtered goals (excluding North Star from the secondary list if North Star is active and matches filter,
  // or including it if filtered differently)
  const filteredGoals = useMemo(() => {
    return highLevelGoals.filter(goal => {
      if (categoryFilter !== 'all' && goal.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && goal.status !== statusFilter) return false;
      return true;
    });
  }, [highLevelGoals, categoryFilter, statusFilter]);

  // Secondary goals are all filtered goals except the one shown in the NorthStarHero
  const secondaryGoals = useMemo(() => {
    if (!northStarGoal) return filteredGoals;
    return filteredGoals.filter(g => g.id !== northStarGoal.id);
  }, [filteredGoals, northStarGoal]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalGoals = highLevelGoals.length;
    const activeGoals = highLevelGoals.filter(g => g.status === 'in-progress').length;
    const achievedGoals = highLevelGoals.filter(g => g.status === 'achieved').length;

    let totalMilestones = 0;
    let completedMilestones = 0;
    let totalProgressSum = 0;

    for (const g of highLevelGoals) {
      totalMilestones += g.milestones.length;
      completedMilestones += g.milestones.filter(m => m.completed).length;
      totalProgressSum += calculateGoalProgress(g);
    }

    const avgProgress = totalGoals > 0 ? Math.round(totalProgressSum / totalGoals) : 0;

    return {
      totalGoals,
      activeGoals,
      achievedGoals,
      totalMilestones,
      completedMilestones,
      avgProgress,
    };
  }, [highLevelGoals]);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (goal: HighLevelGoal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleCreateFromTemplate = (index = 0) => {
    const tpl = GOAL_TEMPLATES[index] ?? GOAL_TEMPLATES[0];
    addHighLevelGoal({
      title: tpl.title,
      category: tpl.category,
      whyMotivation: tpl.whyMotivation,
      description: tpl.description,
      targetDate: new Date(Date.now() + tpl.targetMonths * 30 * 86400000).toISOString().slice(0, 10),
      status: 'in-progress',
      isPrimary: highLevelGoals.length === 0,
      habits: tpl.habits,
      metricTarget: tpl.metricTarget,
      metricCurrent: tpl.metricCurrent,
      metricUnit: tpl.metricUnit,
      milestones: tpl.milestones.map((text, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        title: text,
        completed: false,
      })),
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-primary-surface">
      {/* Top Header */}
      <div className="px-4 py-4 md:px-8 md:py-6 border-b border-base shrink-0 bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25">
                <Target size={20} />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-primary tracking-tight">
                High-Level Goals
              </h1>
            </div>
            <p className="text-xs md:text-sm text-secondary mt-1 max-w-2xl leading-relaxed">
              Define your overarching North Star and long-term milestones. While weekly goals guide your weekly rhythm, high-level goals drive your ultimate life transformation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="btn-primary text-xs md:text-sm py-2 px-4 shadow-lg shadow-violet-500/25"
              id="create-high-level-goal-btn"
            >
              <Plus size={16} />
              <span>Create Goal</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        {highLevelGoals.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-base/80">
            <div className="rounded-xl bg-secondary-surface/60 p-2.5 border border-base">
              <div className="flex items-center gap-1.5 text-muted text-[11px] font-medium">
                <Compass size={13} className="text-violet-400" />
                <span>Active Goals</span>
              </div>
              <p className="text-lg font-extrabold text-primary mt-0.5">
                {stats.activeGoals}
              </p>
            </div>

            <div className="rounded-xl bg-secondary-surface/60 p-2.5 border border-base">
              <div className="flex items-center gap-1.5 text-muted text-[11px] font-medium">
                <Trophy size={13} className="text-green-400" />
                <span>Conquered</span>
              </div>
              <p className="text-lg font-extrabold text-green-400 mt-0.5">
                {stats.achievedGoals}
              </p>
            </div>

            <div className="rounded-xl bg-secondary-surface/60 p-2.5 border border-base">
              <div className="flex items-center gap-1.5 text-muted text-[11px] font-medium">
                <CheckCircle2 size={13} className="text-blue-400" />
                <span>Milestones Done</span>
              </div>
              <p className="text-lg font-extrabold text-primary mt-0.5">
                {stats.completedMilestones} <span className="text-xs font-normal text-muted">/ {stats.totalMilestones}</span>
              </p>
            </div>

            <div className="rounded-xl bg-secondary-surface/60 p-2.5 border border-base">
              <div className="flex items-center gap-1.5 text-muted text-[11px] font-medium">
                <TrendingUp size={13} className="text-purple-400" />
                <span>Average Progress</span>
              </div>
              <p className="text-lg font-extrabold text-violet-400 mt-0.5">
                {stats.avgProgress}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6 space-y-7 pb-24 md:pb-8">
        {highLevelGoals.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border border-dashed border-base bg-card/60 p-8 md:p-12 text-center max-w-3xl mx-auto space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-violet-400 border border-violet-500/30">
              <Sparkles size={28} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-primary">
                What is the #1 High-Level Goal You Want to Achieve?
              </h2>
              <p className="text-sm text-secondary max-w-xl mx-auto leading-relaxed">
                Weekly goals on your daily dashboard keep your short-term momentum rolling. Here on your Goals page, you establish your overarching North Star — whether it&apos;s launching a company, running a marathon, or mastering a discipline.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleOpenCreate}
                className="btn-primary text-sm py-2.5 px-5"
              >
                <Plus size={16} />
                Create High-Level Goal
              </button>
            </div>

            {/* Starter Blueprints */}
            <div className="pt-6 border-t border-base/80">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                Or jump-start with a popular blueprint:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                {GOAL_TEMPLATES.slice(0, 3).map((tpl, idx) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleCreateFromTemplate(idx)}
                    className="p-3 rounded-2xl border border-base bg-secondary-surface/40 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all text-left group"
                  >
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">
                      {tpl.category}
                    </span>
                    <p className="text-xs font-bold text-primary group-hover:text-violet-300 line-clamp-1 mt-0.5">
                      {tpl.title}
                    </p>
                    <p className="text-[11px] text-muted line-clamp-2 mt-1">
                      {tpl.whyMotivation}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                    categoryFilter === 'all'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-secondary-surface text-secondary hover:text-primary border border-base'
                  }`}
                >
                  All Domains
                </button>
                {(Object.keys(CATEGORY_META) as GoalCategory[]).map(catKey => {
                  const meta = CATEGORY_META[catKey];
                  const Icon = meta.icon;
                  const isSelected = categoryFilter === catKey;
                  return (
                    <button
                      key={catKey}
                      onClick={() => setCategoryFilter(catKey)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all shrink-0 border ${
                        isSelected
                          ? `${meta.badgeClass} font-semibold ring-1 ring-violet-500/40`
                          : 'bg-secondary-surface border-base text-secondary hover:text-primary'
                      }`}
                    >
                      <Icon size={12} />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-secondary-surface p-1 rounded-xl border border-base shrink-0">
                {(['all', 'in-progress', 'achieved'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all capitalize ${
                      statusFilter === st
                        ? 'bg-card text-primary font-bold shadow-sm'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    {st === 'all' ? 'All Status' : st === 'in-progress' ? 'Active' : 'Achieved'}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured North Star Section */}
            {northStarGoal && (categoryFilter === 'all' || northStarGoal.category === categoryFilter) && (statusFilter === 'all' || northStarGoal.status === statusFilter) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-secondary">
                      Active North Star Goal
                    </h2>
                  </div>
                </div>

                <NorthStarHero goal={northStarGoal} onEdit={handleOpenEdit} />
              </div>
            )}

            {/* Secondary / Supporting High-Level Goals */}
            {secondaryGoals.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-muted" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-secondary">
                      {northStarGoal ? 'Supporting & Additional Goals' : 'High-Level Goals'} ({secondaryGoals.length})
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {secondaryGoals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} onEdit={handleOpenEdit} />
                  ))}
                </div>
              </div>
            )}

            {/* If filters yielded no results */}
            {filteredGoals.length === 0 && (
              <div className="rounded-2xl border border-dashed border-base p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-primary">No goals match your selected filters.</p>
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Goal Modal */}
      {modalOpen && (
        <GoalModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingGoal(null);
          }}
          goalToEdit={editingGoal}
        />
      )}
    </div>
  );
}

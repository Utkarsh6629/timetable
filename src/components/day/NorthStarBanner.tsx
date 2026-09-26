import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Target } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_META, calculateGoalProgress, getDaysRemainingText } from '../goals/goalUtils';

export function NorthStarBanner() {
  const { getPrimaryHighLevelGoal } = useAppStore();
  const primaryGoal = getPrimaryHighLevelGoal();

  if (!primaryGoal) {
    return (
      <Link
        to="/goals"
        className="group flex items-center justify-between gap-3 rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 p-3.5 transition-all text-xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Target size={14} />
          </div>
          <div>
            <span className="font-bold text-primary group-hover:text-violet-400 transition-colors">
              Set Your High-Level North Star Goal
            </span>
            <p className="text-[11px] text-muted">
              Define the #1 major milestone or transformation you are working toward.
            </p>
          </div>
        </div>
        <span className="btn-secondary text-[11px] py-1 px-2.5 shrink-0 group-hover:border-violet-500/40">
          Create Goal <ArrowRight size={11} />
        </span>
      </Link>
    );
  }

  const progress = calculateGoalProgress(primaryGoal);
  const cat = CATEGORY_META[primaryGoal.category] ?? CATEGORY_META.project;
  const CatIcon = cat.icon;
  const deadline = getDaysRemainingText(primaryGoal.targetDate);

  return (
    <Link
      to="/goals"
      className="group relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/20 via-card to-card p-3.5 md:p-4 hover:border-violet-500/50 transition-all shadow-sm block"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
            <Sparkles size={11} className="text-amber-400" />
            NORTH STAR
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.badgeClass}`}>
            <CatIcon size={10} />
            {cat.label}
          </span>
          <span className="text-[11px] text-muted hidden sm:inline">
            {deadline.text}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 group-hover:translate-x-0.5 transition-transform">
          <span>View High-Level Goal</span>
          <ArrowRight size={13} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-primary truncate group-hover:text-violet-300 transition-colors">
            {primaryGoal.title}
          </h4>
          {primaryGoal.whyMotivation && (
            <p className="text-[11px] text-secondary italic truncate mt-0.5">
              &quot;{primaryGoal.whyMotivation}&quot;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:w-44">
          <div className="progress-bar flex-1 h-2">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-bold text-violet-400">{progress}%</span>
        </div>
      </div>
    </Link>
  );
}

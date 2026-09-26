import { differenceInDays, parseISO, isValid, format } from 'date-fns';
import {
  Briefcase,
  GraduationCap,
  Flame,
  TrendingUp,
  Heart,
  Rocket,
  type LucideIcon,
} from 'lucide-react';
import type { GoalCategory, GoalStatus, HighLevelGoal } from '../../types';

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  borderClass: string;
  glowClass: string;
  textClass: string;
  accentBg: string;
}

export const CATEGORY_META: Record<GoalCategory, CategoryMeta> = {
  career: {
    label: 'Career & Work',
    icon: Briefcase,
    badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    borderClass: 'border-blue-500/30',
    glowClass: 'shadow-blue-500/20',
    textClass: 'text-blue-400',
    accentBg: 'from-blue-600/20 via-blue-500/10 to-transparent',
  },
  learning: {
    label: 'Learning & Mastery',
    icon: GraduationCap,
    badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    borderClass: 'border-purple-500/30',
    glowClass: 'shadow-purple-500/20',
    textClass: 'text-purple-400',
    accentBg: 'from-purple-600/20 via-purple-500/10 to-transparent',
  },
  fitness: {
    label: 'Health & Fitness',
    icon: Flame,
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    borderClass: 'border-emerald-500/30',
    glowClass: 'shadow-emerald-500/20',
    textClass: 'text-emerald-400',
    accentBg: 'from-emerald-600/20 via-emerald-500/10 to-transparent',
  },
  finance: {
    label: 'Wealth & Finance',
    icon: TrendingUp,
    badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    borderClass: 'border-amber-500/30',
    glowClass: 'shadow-amber-500/20',
    textClass: 'text-amber-400',
    accentBg: 'from-amber-600/20 via-amber-500/10 to-transparent',
  },
  personal: {
    label: 'Personal & Mind',
    icon: Heart,
    badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    borderClass: 'border-rose-500/30',
    glowClass: 'shadow-rose-500/20',
    textClass: 'text-rose-400',
    accentBg: 'from-rose-600/20 via-rose-500/10 to-transparent',
  },
  project: {
    label: 'Side Projects & SaaS',
    icon: Rocket,
    badgeClass: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    borderClass: 'border-cyan-500/30',
    glowClass: 'shadow-cyan-500/20',
    textClass: 'text-cyan-400',
    accentBg: 'from-cyan-600/20 via-cyan-500/10 to-transparent',
  },
};

export const STATUS_META: Record<GoalStatus, { label: string; badgeClass: string }> = {
  'in-progress': {
    label: 'In Progress',
    badgeClass: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
  },
  'achieved': {
    label: 'Achieved 🎉',
    badgeClass: 'bg-green-500/15 text-green-400 border border-green-500/30 font-bold',
  },
  'paused': {
    label: 'On Hold',
    badgeClass: 'bg-slate-500/15 text-muted border border-slate-500/30',
  },
};

/** Calculates overall goal progress (0 to 100%) factoring in milestones and target metric */
export function calculateGoalProgress(goal: HighLevelGoal): number {
  if (goal.status === 'achieved') return 100;

  const hasMilestones = goal.milestones.length > 0;
  const hasMetric =
    typeof goal.metricTarget === 'number' &&
    goal.metricTarget > 0 &&
    typeof goal.metricCurrent === 'number';

  if (!hasMilestones && !hasMetric) {
    return 0;
  }

  let milestoneProgress = 0;
  if (hasMilestones) {
    const done = goal.milestones.filter(m => m.completed).length;
    milestoneProgress = Math.round((done / goal.milestones.length) * 100);
  }

  let metricProgress = 0;
  if (hasMetric) {
    const current = Math.max(0, goal.metricCurrent ?? 0);
    const target = goal.metricTarget!;
    metricProgress = Math.min(100, Math.round((current / target) * 100));
  }

  if (hasMilestones && hasMetric) {
    // 60% weight to milestones, 40% to quantitative metric
    return Math.round(milestoneProgress * 0.6 + metricProgress * 0.4);
  }

  return hasMilestones ? milestoneProgress : metricProgress;
}

/** Formats deadline information into user-friendly countdown */
export function getDaysRemainingText(targetDateStr: string): {
  text: string;
  isOverdue: boolean;
  isToday: boolean;
  formattedDate: string;
} {
  try {
    const target = parseISO(targetDateStr);
    if (!isValid(target)) {
      return { text: targetDateStr, isOverdue: false, isToday: false, formattedDate: targetDateStr };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = differenceInDays(target, today);
    const formattedDate = format(target, 'MMM d, yyyy');

    if (diff === 0) {
      return { text: 'Due Today', isOverdue: false, isToday: true, formattedDate };
    }
    if (diff > 0) {
      return {
        text: `${diff} ${diff === 1 ? 'day' : 'days'} left`,
        isOverdue: false,
        isToday: false,
        formattedDate,
      };
    }
    return {
      text: `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'day' : 'days'} overdue`,
      isOverdue: true,
      isToday: false,
      formattedDate,
    };
  } catch {
    return { text: targetDateStr, isOverdue: false, isToday: false, formattedDate: targetDateStr };
  }
}

import type { GoalCategory } from '../../types';

export interface GoalTemplate {
  id: string;
  title: string;
  category: GoalCategory;
  whyMotivation: string;
  description: string;
  targetMonths: number;
  habits: string[];
  metricTarget?: number;
  metricCurrent?: number;
  metricUnit?: string;
  milestones: string[];
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'tpl-saas',
    title: 'Build & Launch SaaS Product to $1k MRR',
    category: 'project',
    whyMotivation: 'To achieve creative freedom, build a recurring revenue stream, and prove I can take an idea from zero to a live profitable product.',
    description: 'Design, develop, and launch a focused micro-SaaS application, acquire first 100 beta users, and convert 20 paying customers.',
    targetMonths: 4,
    habits: ['Code 90 minutes every morning before work', 'Talk to 2 potential customers every week'],
    metricTarget: 1000,
    metricCurrent: 0,
    metricUnit: '$ MRR',
    milestones: [
      'Validate problem with 15 customer interviews',
      'Build core MVP with auth and billing',
      'Deploy to production with landing page',
      'Acquire first 10 beta testers',
      'Launch on Product Hunt & tech communities',
      'Reach first 10 paying customers',
    ],
  },
  {
    id: 'tpl-swe-career',
    title: 'Transition to Senior Full-Stack Engineer',
    category: 'career',
    whyMotivation: 'To master modern scalable systems architecture, increase compensation, and lead high-impact engineering projects with confidence.',
    description: 'Master advanced distributed systems, lead end-to-end architecture decisions, and level up system design & leadership skills.',
    targetMonths: 6,
    habits: ['Study 1 system design concept every weekday', 'Review 2 open source architecture patterns weekly'],
    milestones: [
      'Complete Designing Data-Intensive Applications study',
      'Lead design doc for high-scale microservice',
      'Deliver a high-visibility architectural optimization',
      'Mentor 2 junior or mid-level team members',
      'Prepare and execute senior promotion case',
    ],
  },
  {
    id: 'tpl-half-marathon',
    title: 'Run a Half Marathon in Under 2 Hours',
    category: 'fitness',
    whyMotivation: 'To build unstoppable cardiovascular stamina, test mental endurance, and feel at the absolute peak of physical health.',
    description: 'Follow a 16-week progressive running plan with interval training, weekly long runs, and strength mobility work.',
    targetMonths: 4,
    habits: ['Run 3x weekly without skipping', 'Stretch & mobility session every night', 'Sleep 8 hours consistently'],
    metricTarget: 21,
    metricCurrent: 5,
    metricUnit: 'km longest run',
    milestones: [
      'Build comfortable 5km base pace (5:20/km)',
      'Complete first continuous 10km run',
      'Achieve 15km long run milestone',
      'Run official half-marathon test trial (18km)',
      'Race Day: Finish official 21.1km under 2:00:00',
    ],
  },
  {
    id: 'tpl-emergency-fund',
    title: 'Build 6-Month Emergency & Wealth Fund',
    category: 'finance',
    whyMotivation: 'To achieve true peace of mind, eliminate financial stress, and establish a rock-solid foundation for future investments and freedom.',
    description: 'Accumulate a 6-month living expense buffer in a high-yield account by automating savings and eliminating unnecessary leaks.',
    targetMonths: 6,
    habits: ['Track every expense weekly', 'Save 30% of income on payday before spending'],
    metricTarget: 15000,
    metricCurrent: 2500,
    metricUnit: '$',
    milestones: [
      'Audit last 6 months expenses and create lean budget',
      'Save first $3,000 baseline reserve',
      'Reach $7,500 (3-month living buffer)',
      'Reach $15,000 (full 6-month emergency fund)',
      'Set up automated monthly index fund investments',
    ],
  },
  {
    id: 'tpl-read-books',
    title: 'Read 24 High-Impact Non-Fiction Books',
    category: 'learning',
    whyMotivation: 'To expand cognitive models, absorb decades of wisdom from world-class thinkers, and sharpen decision-making in life and work.',
    description: 'Read 2 books per month spanning philosophy, systems thinking, biologies, business, and psychology, taking key actionable notes.',
    targetMonths: 12,
    habits: ['Read 30 pages every morning with coffee', 'Write a 3-bullet takeaway after finishing each book'],
    metricTarget: 24,
    metricCurrent: 3,
    metricUnit: 'books',
    milestones: [
      'Curate the 24-book reading list',
      'Finish first 6 books (Quarter 1)',
      'Finish 12 books & conduct mid-year review',
      'Finish 18 books (Quarter 3)',
      'Complete all 24 books and publish personal reading insights',
    ],
  },
  {
    id: 'tpl-mindfulness',
    title: 'Cultivate Deep Daily Mindfulness & Focus',
    category: 'personal',
    whyMotivation: 'To break free from reactive digital dopamine loops, remain calm under high pressure, and be fully present with family and work.',
    description: 'Establish unbroken morning meditation, no-phone morning routines, and weekly digital detox days.',
    targetMonths: 3,
    habits: ['15 minutes morning mindfulness breathwork', 'No screens for the first 45 minutes of the day', 'Sunday digital detox afternoon'],
    metricTarget: 90,
    metricCurrent: 14,
    metricUnit: 'mindful days',
    milestones: [
      'Complete 14 consecutive days of morning meditation',
      'Implement phone-free bedroom environment',
      'Reach 30-day consistent practice milestone',
      'Complete first full 24-hour weekend screen detox',
      'Reach 90 days of sustained mindfulness',
    ],
  },
];

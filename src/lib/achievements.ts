import { Trophy, Zap, Shield, Target, Award, Star } from 'lucide-react';
import { type Habit, type Log } from '../db/db';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  check: (habits: Habit[], logs: Log[]) => boolean;
}

export const achievements: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first protocol.',
    icon: Zap,
    color: '#00ff9d',
    check: (_, logs) => logs.some(l => l.status === 'done')
  },
  {
    id: 'consistent_7',
    title: 'Consistent',
    description: 'Reach a 7-day streak on any habit.',
    icon: Target,
    color: '#3B82F6',
    check: (habits) => habits.some(h => h.streak >= 7)
  },
  {
    id: 'unstoppable_30',
    title: 'Unstoppable',
    description: 'Reach a 30-day streak on any habit.',
    icon: Trophy,
    color: '#F59E0B',
    check: (habits) => habits.some(h => h.streak >= 30)
  },
  {
    id: 'strict_disciple',
    title: 'Strict Disciple',
    description: 'Maintain a 30-day streak on a Strict Mode habit.',
    icon: Shield,
    color: '#EF4444',
    check: (habits) => habits.some(h => h.strictMode && h.streak >= 30)
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Complete 100 total habit logs.',
    icon: Award,
    color: '#8B5CF6',
    check: (_, logs) => logs.filter(l => l.status === 'done').length >= 100
  },
  {
    id: 'aura_master',
    title: 'Aura Master',
    description: 'Have 5 active habits at once.',
    icon: Star,
    color: '#EC4899',
    check: (habits) => habits.filter(h => !h.isArchived).length >= 5
  }
];

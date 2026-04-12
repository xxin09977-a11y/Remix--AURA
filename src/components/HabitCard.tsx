import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Dumbbell, Shield, Zap, Book, Droplets, Moon, Code, 
  Sword, Flame, Heart, Coffee, Music, Camera, Bike, Timer, 
  Target, Award, Sun, Wind, Cloud, Trees, Anchor, Compass, 
  Map, PenTool, Smile, Star, Trophy, Users, Laptop, Utensils,
  Wallet, Plane, GraduationCap, Activity, Check, X, Edit2, Trash2
} from 'lucide-react';
import { type Habit, db } from '../db/db';
import { cn } from '../lib/utils';
import { format, isToday, startOfDay } from 'date-fns';

const iconMap: Record<string, any> = {
  Brain, Dumbbell, Shield, Zap, Book, Droplets, Moon, Code, 
  Sword, Flame, Heart, Coffee, Music, Camera, Bike, Timer, 
  Target, Award, Sun, Wind, Cloud, Trees, Anchor, Compass, 
  Map, PenTool, Smile, Star, Trophy, Users, Laptop, Utensils,
  Wallet, Plane, GraduationCap, Activity
};

interface HabitCardProps {
  key?: React.Key;
  habit: Habit;
  todayStatus?: 'done' | 'skip' | 'fail';
  onEdit: (habit: Habit) => void;
  onDelete: (id: number) => Promise<void> | void;
  onComplete: (id: number) => Promise<void> | void;
  onSkip: (id: number) => Promise<void> | void;
}

export function HabitCard({ habit, todayStatus, onEdit, onDelete, onComplete, onSkip }: HabitCardProps) {
  const Icon = iconMap[habit.icon] || Zap;
  const isCompletedToday = todayStatus === 'done';
  const isSkippedToday = todayStatus === 'skip';
  const isActionedToday = !!todayStatus;
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Long press handler
  let pressTimer: NodeJS.Timeout;

  const startPress = () => {
    pressTimer = setTimeout(() => {
      setIsLongPressing(true);
      onEdit(habit);
    }, 600);
  };

  const endPress = () => {
    clearTimeout(pressTimer);
    setIsLongPressing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className={cn(
        "glass relative overflow-hidden rounded-2xl p-3 group transition-all duration-300",
        isLongPressing && "scale-[0.98] border-white/20"
      )}
    >
      {/* Background Glow */}
      <div 
        className="absolute -right-6 -top-6 w-20 h-20 blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: habit.color }}
      />

      {/* Single Line Header: Icon, Title, Streak */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center glass shrink-0"
            style={{ color: habit.color, boxShadow: `0 0 12px ${habit.color}22` }}
          >
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold tracking-tight truncate leading-tight">{habit.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-white/30 whitespace-nowrap">
                {format(new Date(habit.startDate), 'MMM d, HH:mm')}
              </span>
              {habit.strictMode && (
                <div className="flex items-center gap-1 text-red-500/60">
                  <Shield size={8} />
                  <span className="text-[8px] font-mono uppercase tracking-tighter">Strict</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end ml-2 shrink-0">
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest leading-none mb-0.5">Streak</span>
          <span className="text-sm font-black text-white/90 leading-none">{habit.streak}d</span>
        </div>
      </div>

      {/* Compact Action Row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => habit.id && onComplete(habit.id)}
          disabled={isActionedToday}
          className={cn(
            "flex-[2.5] h-9 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 overflow-hidden",
            isActionedToday 
              ? "bg-white/5 text-white/20 cursor-not-allowed" 
              : "bg-white text-black hover:bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.15)]"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isCompletedToday ? 'done' : isSkippedToday ? 'skipped' : 'todo'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1.5"
            >
              {isCompletedToday ? <Check size={12} /> : isSkippedToday ? <X size={12} /> : <Zap size={12} />}
              <span>{isCompletedToday ? 'Done' : isSkippedToday ? 'Skipped' : 'Complete'}</span>
            </motion.div>
          </AnimatePresence>
        </button>

        <button
          onClick={() => habit.id && onSkip(habit.id)}
          disabled={isActionedToday}
          className={cn(
            "flex-1 h-9 rounded-xl glass text-[10px] font-bold transition-all flex items-center justify-center",
            isActionedToday ? "text-white/5 cursor-not-allowed" : "text-white/30 hover:text-white hover:bg-white/5"
          )}
        >
          {isSkippedToday ? 'Skipped' : 'Skip'}
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(habit)}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center text-white/20 hover:text-white transition-all active:scale-90"
          >
            <Edit2 size={12} />
          </button>
          <button 
            onClick={() => habit.id && onDelete(habit.id)}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center text-red-500/30 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Progress Glow Line */}
      <div className="h-[1.5px] w-full bg-white/5 rounded-full mt-2.5 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((habit.streak / 30) * 100, 100)}%` }}
          className="h-full shadow-[0_0_6px_currentColor]"
          style={{ backgroundColor: habit.color, color: habit.color }}
        />
      </div>
    </motion.div>
  );
}

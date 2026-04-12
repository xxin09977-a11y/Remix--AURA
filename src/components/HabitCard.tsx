import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Dumbbell, Shield, Zap, Book, Droplets, Moon, Code, 
  Sword, Flame, Heart, Coffee, Music, Camera, Bike, Timer, 
  Target, Award, Sun, Wind, Cloud, Trees, Anchor, Compass, 
  Map, PenTool, Smile, Star, Trophy, Users, Laptop, Utensils,
  Wallet, Plane, GraduationCap, Activity, Check, X, Edit2, Trash2,
  Lock
} from 'lucide-react';
import { type Habit, db } from '../db/db';
import { cn } from '../lib/utils';
import { format, isToday, startOfDay } from 'date-fns';
import { triggerHaptic } from '../App';
import { translations } from '../lib/i18n';

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
  const isLocked = habit.strictMode && isActionedToday;
  const [isLongPressing, setIsLongPressing] = useState(false);

  const lang = (localStorage.getItem('aura-lang') as 'en' | 'mm') || 'en';
  const t = translations[lang];

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
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ 
        scale: 1.01, 
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5), 0 0 20px 0px rgba(255,255,255,0.02)",
        borderColor: "rgba(255,255,255,0.1)"
      }}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className={cn(
        "glass relative overflow-hidden rounded-2xl p-3.5 group transition-all duration-300 border border-white/5",
        isLongPressing && "scale-[0.98] border-white/20"
      )}
    >
      {/* Background Glow */}
      <div 
        className="absolute -right-6 -top-6 w-20 h-20 blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: habit.color }}
      />

      {/* Single Line Header: Icon, Title, Streak */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center glass shrink-0"
            style={{ color: habit.color, boxShadow: `0 0 12px ${habit.color}15` }}
          >
            <Icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold tracking-tight truncate leading-tight text-primary">{habit.name}</h3>
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <span className="text-[9px] font-mono text-muted uppercase tracking-widest">{t.streak}</span>
                <span className="text-sm font-black text-primary">{habit.streak}d</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-secondary whitespace-nowrap">
                {format(new Date(habit.startDate), 'MMM d, HH:mm')}
              </span>
              {habit.strictMode && (
                <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                  <Shield size={9} />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">{t.strict_mode}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Row: Refined Hierarchy and Tap Targets */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-2 flex-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('medium');
              habit.id && onComplete(habit.id);
            }}
            className={cn(
              "flex-[2] h-10 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 transition-all overflow-hidden",
              isCompletedToday 
                ? "bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]" 
                : "bg-primary text-black dark:text-black hover:opacity-90 shadow-[0_0_15px_rgba(255,255,255,0.1)]",
              isLocked && isCompletedToday && "opacity-90 cursor-default"
            )}
            style={!isCompletedToday ? { backgroundColor: 'var(--text-primary)' } : {}}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isCompletedToday ? 'done' : 'todo'}
                initial={isLocked ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={isLocked ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                {isCompletedToday ? (isLocked ? <Lock size={14} /> : <Check size={14} />) : <Zap size={14} />}
                <span>{isCompletedToday ? t.done : t.complete}</span>
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('light');
              habit.id && onSkip(habit.id);
            }}
            className={cn(
              "flex-1 h-10 text-[12px] font-bold transition-all flex items-center justify-center gap-1.5",
              isSkippedToday 
                ? "text-red-400" 
                : "text-secondary hover:text-primary"
            )}
          >
            {isSkippedToday ? (isLocked ? <Lock size={12} /> : <X size={12} />) : null}
            <span>{isSkippedToday ? t.skipped : t.skip}</span>
          </motion.button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('light');
              onEdit(habit);
            }}
            className="flex items-center gap-2 px-3 h-10 rounded-xl glass text-muted hover:text-primary transition-all"
          >
            <Edit2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t.edit}</span>
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('medium');
              habit.id && onDelete(habit.id);
            }}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={16} />
          </motion.button>
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

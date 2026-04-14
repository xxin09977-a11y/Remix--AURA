import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, X, Edit2, Trash2,
  Lock, Archive, ArchiveRestore, AlertCircle, MessageSquare, StickyNote, Zap, Shield, Flame, Calendar as CalendarIcon
} from 'lucide-react';
import { type Habit, db, type Log } from '../db/db';
import { cn } from '../lib/utils';
import { format, isToday, startOfDay, subDays, isSameDay, parseISO } from 'date-fns';
import { triggerHaptic } from '../App';
import { translations } from '../lib/i18n';
import { playSound } from '../lib/sounds';
import { iconMap } from '../lib/icons';

interface HabitCardProps {
  key?: React.Key;
  habit: Habit;
  todayStatus?: 'done' | 'skip' | 'skipped' | 'fail';
  history?: ('done' | 'skip' | 'skipped' | 'fail' | 'none')[];
  onEdit: (habit: Habit) => void;
  onDelete: (id: number) => Promise<void> | void;
  onComplete: (id: number) => Promise<void> | void;
  onSkip: (id: number) => Promise<void> | void;
  onArchive: (id: number) => Promise<void> | void;
  onSaveNote: (habitId: number, note: string) => Promise<void> | void;
  onRetroComplete: (id: number, date: string) => Promise<void> | void;
  currentLog?: Log;
  allLogs?: Log[];
}

export function HabitCard({ habit, todayStatus, history = [], onEdit, onDelete, onComplete, onSkip, onArchive, onSaveNote, onRetroComplete, currentLog, allLogs = [] }: HabitCardProps) {
  const Icon = iconMap[habit.icon] || Zap;
  const isCompletedToday = todayStatus === 'done';
  const isSkippedToday = todayStatus === 'skip' || todayStatus === 'skipped';
  const isActionedToday = !!todayStatus;
  const isLocked = habit.strictMode && isActionedToday;
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isRetroOpen, setIsRetroOpen] = useState(false);
  const [noteText, setNoteText] = useState(currentLog?.note || '');

  const lang = (localStorage.getItem('aura-lang') as 'en' | 'mm') || 'en';
  const t = translations[lang];

  useEffect(() => {
    setNoteText(currentLog?.note || '');
  }, [currentLog]);

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

      {/* Header: Identity & Streak */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center glass shrink-0 border border-white/10"
            style={{ color: habit.color, boxShadow: `0 0 20px ${habit.color}15` }}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold tracking-tight truncate text-primary leading-none mb-1.5">{habit.name}</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <motion.div
                  animate={habit.streak > 0 ? {
                    scale: [1, 1.1, 1],
                    filter: ["drop-shadow(0 0 0px #f97316)", "drop-shadow(0 0 4px #f97316)", "drop-shadow(0 0 0px #f97316)"]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Flame 
                    size={12} 
                    className={cn(
                      "transition-all duration-500",
                      habit.streak > 0 ? "text-orange-500 fill-orange-500/20" : "text-muted/20"
                    )} 
                  />
                </motion.div>
                <span className="text-sm font-black text-primary tracking-tighter">{habit.streak}d</span>
              </div>
              
              {/* Weekly Progress Meter */}
              <div className="flex gap-0.5 h-1.5 w-14 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                {Array.from({ length: 7 }).map((_, i) => {
                  const dayInWeek = habit.streak % 7 || (habit.streak > 0 ? 7 : 0);
                  const isActive = habit.streak > 0 && (habit.streak >= 7 || i < dayInWeek);
                  return (
                    <div 
                      key={i}
                      className={cn(
                        "flex-1 rounded-full transition-all duration-700",
                        isActive ? "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]" : "bg-transparent"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 items-end h-8">
          {history.map((status, i) => (
            <div 
              key={i}
              className={cn(
                "w-1.5 rounded-full transition-all duration-500",
                status === 'done' ? "h-full bg-primary" : 
                status === 'skip' ? "h-1/2 bg-secondary opacity-30" : 
                status === 'skipped' ? "h-1/2 bg-amber-400 opacity-50" :
                status === 'fail' ? "h-full bg-red-500 opacity-50" : "h-1/4 bg-white/5"
              )}
              style={status === 'done' ? { backgroundColor: habit.color } : {}}
            />
          ))}
        </div>
      </div>

      {/* Metadata & Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-5 px-1">
        <span className="text-[9px] font-mono text-muted/60 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
          {format(new Date(habit.startDate), 'MMM d, HH:mm')}
        </span>
        {habit.strictMode && (
          <div className="flex items-center gap-1 text-red-500/80 bg-red-500/5 px-2 py-0.5 rounded-md border border-red-500/10">
            <Shield size={8} />
            <span className="text-[8px] font-bold uppercase tracking-widest">{t.strict_mode}</span>
          </div>
        )}
        {habit.priority && habit.priority !== 'medium' && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md border",
            habit.priority === 'high' 
              ? "text-red-400/80 bg-red-400/5 border-red-400/10" 
              : "text-blue-400/80 bg-blue-400/5 border-blue-400/10"
          )}>
            <AlertCircle size={8} />
            <span className="text-[8px] font-bold uppercase tracking-widest">{t[habit.priority]}</span>
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="grid grid-cols-12 gap-2 mb-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          animate={isCompletedToday ? {
            boxShadow: [
              `0 0 20px ${habit.color}20`,
              `0 0 40px ${habit.color}40`,
              `0 0 20px ${habit.color}20`
            ],
            scale: [1, 1.02, 1]
          } : {}}
          transition={isCompletedToday ? { repeat: Infinity, duration: 2 } : {}}
          onClick={() => {
            triggerHaptic('medium');
            playSound('click');
            habit.id && onComplete(habit.id);
          }}
          className={cn(
            "col-span-7 h-12 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all border",
            isCompletedToday 
              ? "bg-[#00ff9d] text-black border-[#00ff9d] shadow-[0_0_30px_rgba(0,255,157,0.3)]" 
              : "bg-white text-black border-white hover:bg-white/90 shadow-[0_4px_20px_rgba(255,255,255,0.15)]",
            isLocked && isCompletedToday && "opacity-90 cursor-default"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isCompletedToday ? 'done' : 'todo'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2"
            >
              {isCompletedToday ? (isLocked ? <Lock size={16} /> : <Check size={16} />) : <Zap size={16} />}
              <span>{isCompletedToday ? t.done : t.complete}</span>
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            setIsRetroOpen(!isRetroOpen);
          }}
          className={cn(
            "col-span-2 h-12 rounded-2xl flex items-center justify-center border transition-all",
            isRetroOpen ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-muted hover:text-primary"
          )}
          title={t.retro_log}
        >
          <CalendarIcon size={18} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('light');
            playSound('click');
            habit.id && onSkip(habit.id);
          }}
          className={cn(
            "col-span-3 h-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 border",
            isSkippedToday 
              ? (todayStatus === 'skipped' ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : "text-red-400 border-red-400/30 bg-red-400/10") 
              : "text-muted border-white/10 hover:border-white/30 hover:text-primary bg-white/[0.03]"
          )}
        >
          {isSkippedToday ? (isLocked ? <Lock size={12} /> : <X size={12} />) : null}
          <span>{isSkippedToday ? t.skipped : t.skip}</span>
        </motion.button>
      </div>

      {/* Retro Log Date Picker */}
      <AnimatePresence>
        {isRetroOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="glass p-3 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted">{t.select_date}</span>
                <button onClick={() => setIsRetroOpen(false)} className="text-muted hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 14 }).map((_, i) => {
                  const date = subDays(new Date(), i);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isCompleted = allLogs.some(l => l.date === dateStr && l.status === 'done');
                  const isTodayDate = isToday(date);
                  
                  return (
                    <motion.button
                      key={dateStr}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        triggerHaptic('medium');
                        habit.id && onRetroComplete(habit.id, dateStr);
                        setIsRetroOpen(false);
                      }}
                      className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-center relative border transition-all",
                        isCompleted 
                          ? "bg-[#00ff9d]/20 border-[#00ff9d]/30 text-[#00ff9d]" 
                          : "bg-white/5 border-white/5 text-muted hover:border-white/20",
                        isTodayDate && "ring-1 ring-white/40"
                      )}
                    >
                      <span className="text-[10px] font-bold">{format(date, 'd')}</span>
                      <span className="text-[7px] opacity-40 uppercase">{format(date, 'EEE')}</span>
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00ff9d] rounded-full shadow-[0_0_5px_#00ff9d]" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secondary Actions: Subtle & Organized */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic('light'); setIsNoteOpen(!isNoteOpen); }}
            className={cn(
              "p-2.5 rounded-xl transition-all border border-transparent",
              currentLog?.note ? "text-accent-neon bg-accent-neon/10 border-accent-neon/20" : "text-muted/40 hover:text-primary hover:bg-white/5"
            )}
            title={t.journal}
          >
            <MessageSquare size={14} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic('light'); onEdit(habit); }}
            className="p-2.5 rounded-xl text-muted/40 hover:text-primary hover:bg-white/5 transition-all"
            title={t.edit}
          >
            <Edit2 size={14} />
          </motion.button>
        </div>

        <div className="flex items-center gap-1">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic('light'); habit.id && onArchive(habit.id); }}
            className="p-2.5 rounded-xl text-muted/40 hover:text-primary hover:bg-white/5 transition-all"
            title={habit.isArchived ? t.unarchive : t.archive}
          >
            {habit.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic('medium'); habit.id && onDelete(habit.id); }}
            className="p-2.5 rounded-xl text-red-500/20 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      </div>

      {/* Journal Entry Area */}
      <AnimatePresence>
        {isNoteOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="glass p-3 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-accent-neon">
                <StickyNote size={12} />
                <span className="text-[10px] font-mono uppercase tracking-widest">{t.journal}</span>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t.note_placeholder}
                className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-white/80 focus:outline-none focus:border-accent-neon/30 min-h-[60px] resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    habit.id && onSaveNote(habit.id, noteText);
                    setIsNoteOpen(false);
                  }}
                  className="px-3 py-1.5 bg-accent-neon text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  {t.save_note}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Glow Line */}
      <div className="h-[1.5px] w-full bg-white/5 rounded-full mt-2.5 overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((habit.streak / 30) * 100, 100)}%` }}
          className="h-full shadow-[0_0_6px_currentColor] relative"
          style={{ backgroundColor: habit.color, color: habit.color }}
        >
          {/* Scanning Shimmer */}
          <motion.div 
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-20"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

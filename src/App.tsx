/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Zap, Calendar, Trophy, Info, BarChart3, Settings as SettingsIcon, Languages, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import { db, seedDatabase, type Habit, type Log } from './db/db';
import { HabitCard } from './components/HabitCard';
import { AddHabitModal } from './components/AddHabitModal';
import { StrictPenalty } from './components/StrictPenalty';
import { StatsModal } from './components/StatsModal';
import { UndoSnackbar } from './components/UndoSnackbar';
import { cn } from './lib/utils';
import { isToday, differenceInDays, startOfDay, subDays, format } from 'date-fns';
import { translations, type Language } from './lib/i18n';

const HYPE_MESSAGES_EN = [
  "STAY ALPHA",
  "UNSTOPPABLE",
  "GOD MODE",
  "AURA EXPANDING",
  "LIMITLESS",
  "PROTOCOL ACTIVE",
  "DISCIPLINE IS FREEDOM",
  "BEYOND HUMAN",
  "ASCENDING",
  "NO EXCUSES"
];

// Public Lottie URL for success
const SUCCESS_LOTTIE_URL = "https://fonts.gstatic.com/s/i/short-term/release/googlestandardsymbols/check_circle/default/24px.svg"; // Fallback to SVG if needed, but let's use a real lottie JSON if possible.
// Actually, I'll use a reliable Lottie JSON URL
const LOTTIE_SUCCESS = "https://assets9.lottiefiles.com/packages/lf20_pqnfb1al.json";

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  const hapticEnabled = localStorage.getItem('aura-haptic') !== 'false';
  if (hapticEnabled && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    const patterns = {
      light: 10,
      medium: 30,
      heavy: 50
    };
    window.navigator.vibrate(patterns[type]);
  }
};

export default function App() {
  const habits = useLiveQuery(() => db.habits.toArray());
  const logs = useLiveQuery(() => db.logs.toArray());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [penaltyHabit, setPenaltyHabit] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('aura-lang') as Language) || 'en';
  });
  const [hapticEnabled, setHapticEnabled] = useState(() => {
    return localStorage.getItem('aura-haptic') !== 'false';
  });

  const t = translations[language];
  const [hypeMessage, setHypeMessage] = useState(t.hype_messages[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [strictToast, setStrictToast] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    seedDatabase();
    setHypeMessage(t.hype_messages[Math.floor(Math.random() * t.hype_messages.length)]);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('aura-lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('aura-haptic', String(hapticEnabled));
  }, [hapticEnabled]);

  const auraFeedback = useMemo(() => {
    if (!logs || logs.length === 0) return { text: t.protocol_init, type: 'positive' };

    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
    const recentLogs = logs.filter(l => last7Days.includes(l.date));
    const skipCount = recentLogs.filter(l => l.status === 'skip').length;
    
    // Check for declining trend (last 3 days vs previous 3 days)
    const last3Days = last7Days.slice(0, 3);
    const prev3Days = last7Days.slice(3, 6);
    const last3Done = logs.filter(l => last3Days.includes(l.date) && l.status === 'done').length;
    const prev3Done = logs.filter(l => prev3Days.includes(l.date) && l.status === 'done').length;

    if (skipCount > 2 || (last3Done < prev3Done && prev3Done > 0)) {
      return { 
        text: t.aura_fading, 
        type: 'warning' 
      };
    }

    return { 
      text: t.aura_surging, 
      type: 'positive' 
    };
  }, [logs, language]);

  const handleComplete = async (id: number) => {
    const habit = await db.habits.get(id);
    if (!habit) return;

    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const existingLog = await db.logs.where({ habitId: id, date: todayStr }).first();

    if (existingLog) {
      if (habit.strictMode) {
        setStrictToast(true);
        setTimeout(() => setStrictToast(false), 2000);
        return;
      }
      if (existingLog.status === 'done') {
        // Toggle OFF: Revert completion
        await handleUndoAction(id);
        return;
      } else if (existingLog.status === 'skip') {
        // Switch from Skip to Done: Remove skip log first
        await db.logs.delete(existingLog.id!);
      }
    }

    const lastCompleted = habit.lastCompleted ? startOfDay(new Date(habit.lastCompleted)) : null;
    let newStreak = habit.streak + 1;
    
    // Check if streak was broken (missed yesterday)
    if (lastCompleted) {
      const daysSinceLast = differenceInDays(today, lastCompleted);
      if (daysSinceLast > 1) {
        if (habit.strictMode) setPenaltyHabit(habit.name);
        newStreak = 1;
      }
    }

    await db.habits.update(id, {
      streak: newStreak,
      lastCompleted: new Date()
    });

    await db.logs.add({
      habitId: id,
      date: todayStr,
      status: 'done',
      timestamp: new Date()
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: [habit.color, '#ffffff', '#00ff9d']
    });
  };

  const handleUndoAction = async (id: number) => {
    const habit = await db.habits.get(id);
    if (!habit) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayLog = await db.logs
      .where({ habitId: id, date: todayStr })
      .first();

    if (todayLog && todayLog.id) {
      const isDone = todayLog.status === 'done';
      await db.logs.delete(todayLog.id);
      
      // Find the previous completion date
      const prevLog = await db.logs
        .where('habitId')
        .equals(id)
        .and(l => l.status === 'done')
        .reverse()
        .first();

      await db.habits.update(id, {
        streak: isDone ? Math.max(0, habit.streak - 1) : habit.streak,
        lastCompleted: prevLog ? prevLog.timestamp : null
      });
    }
  };

  const handleSkip = async (id: number) => {
    const habit = await db.habits.get(id);
    if (!habit) return;

    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const existingLog = await db.logs.where({ habitId: id, date: todayStr }).first();

    if (existingLog) {
      if (habit.strictMode) {
        setStrictToast(true);
        setTimeout(() => setStrictToast(false), 2000);
        return;
      }
      if (existingLog.status === 'skip') {
        // Toggle OFF: Revert skip
        await handleUndoAction(id);
        return;
      } else if (existingLog.status === 'done') {
        // Switch from Done to Skip: Revert completion first
        await handleUndoAction(id);
      }
    }

    await db.logs.add({
      habitId: id,
      date: todayStr,
      status: 'skip',
      timestamp: new Date()
    });
    
    await db.habits.update(id, {
      lastCompleted: new Date()
    });
  };

  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    if (editingHabit?.id) {
      await db.habits.update(editingHabit.id, habitData);
    } else {
      await db.habits.add(habitData as Habit);
    }
    setEditingHabit(undefined);
  };

  const handleDeleteHabit = async (id: number) => {
    await db.habits.delete(id);
    await db.logs.where('habitId').equals(id).delete();
  };

  const totalStreaks = habits?.reduce((acc, h) => acc + h.streak, 0) || 0;

  const todayLogs = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return logs?.filter(l => l.date === todayStr) || [];
  }, [logs]);

  return (
    <div className="min-h-screen pb-20">
      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="w-48 h-48">
              <Lottie 
                animationData={null}
                path={LOTTIE_SUCCESS}
                loop={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: Refined Hierarchy */}
      <header className="px-5 pt-10 pb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                <Zap size={14} className="text-black fill-black" />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic text-white/90">{t.app_name}</h1>
            </motion.div>
            
            <div className="flex flex-col">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/70 font-mono text-[11px] font-semibold uppercase tracking-[0.2em]"
              >
                {hypeMessage}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "text-[10px] italic font-bold",
                  auraFeedback.type === 'warning' ? "text-red-400" : "text-[#00ff9d]"
                )}
              >
                {auraFeedback.text}
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsStatsModalOpen(true)}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white/40 hover:text-white transition-all"
            >
              <BarChart3 size={16} />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted hover:text-primary transition-all"
            >
              <SettingsIcon size={16} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Stats Overview: Consistent Margins */}
      <section className="px-5 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="glass rounded-2xl p-4 relative overflow-hidden group h-20 flex flex-col justify-center"
          >
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity text-primary">
              <Trophy size={40} />
            </div>
            <p className="text-[9px] font-mono text-muted uppercase tracking-widest mb-0.5">{t.total_power}</p>
            <p className="text-xl font-black tracking-tight text-primary">{totalStreaks}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="glass rounded-2xl p-4 relative overflow-hidden group h-20 flex flex-col justify-center"
          >
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity text-primary">
              <Calendar size={40} />
            </div>
            <p className="text-[9px] font-mono text-muted uppercase tracking-widest mb-0.5">{t.active_auras}</p>
            <p className="text-xl font-black tracking-tight text-primary">{habits?.length || 0}</p>
          </motion.div>
        </div>
      </section>

      {/* Habits List: Consistent Margins */}
      <main className="px-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] font-light">{t.current_protocols}</h2>
          <div className="h-[1px] flex-1 mx-3 bg-black/5 dark:bg-white/5" />
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div 
            className="grid gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {habits?.map((habit) => {
              const todayLog = todayLogs.find(l => l.habitId === habit.id);
              return (
                <HabitCard
                  key={habit.id!}
                  habit={habit}
                  todayStatus={todayLog?.status}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                  onEdit={(h) => {
                    setEditingHabit(h);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={handleDeleteHabit}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        {habits?.length === 0 && (
          <div className="text-center py-12 glass rounded-2xl border-dashed border border-white/5">
            <Info className="mx-auto text-white/10 mb-3" size={24} />
            <p className="text-white/60 font-mono text-[10px] uppercase tracking-widest">{t.no_protocols}</p>
          </div>
        )}
      </main>

      {/* Floating Action Button: Scaled down and softened */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          triggerHaptic('heavy');
          setEditingHabit(undefined);
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center shadow-[0_5px_15px_rgba(255,255,255,0.1)] z-40"
      >
        <Plus size={20} />
      </motion.button>

      {/* Modals */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingHabit(undefined);
        }}
        onSave={handleSaveHabit}
        initialData={editingHabit}
      />

      <StrictPenalty
        isVisible={!!penaltyHabit}
        habitName={penaltyHabit || ''}
        onClose={() => setPenaltyHabit(null)}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        habits={habits || []}
        logs={logs || []}
      />

      {/* Simple Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="glass w-full max-w-sm rounded-[2rem] p-6 relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black tracking-tight text-primary">{t.settings}</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted hover:text-primary transition-all"
                >
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Language Segmented Control */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted mb-1">
                    <Languages size={14} />
                    <span className="text-[10px] font-mono uppercase tracking-widest">{t.language}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 glass rounded-xl">
                    <button
                      onClick={() => { triggerHaptic('light'); setLanguage('en'); }}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold transition-all",
                        language === 'en' ? "bg-white text-black shadow-lg" : "text-muted hover:text-primary"
                      )}
                    >
                      English
                    </button>
                    <button
                      onClick={() => { triggerHaptic('light'); setLanguage('mm'); }}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold transition-all",
                        language === 'mm' ? "bg-white text-black shadow-lg" : "text-muted hover:text-primary"
                      )}
                    >
                      မြန်မာ
                    </button>
                  </div>
                </div>

                {/* Haptic Toggle */}
                <div className="flex items-center justify-between glass p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", hapticEnabled ? "bg-accent-neon/10 text-accent-neon" : "bg-white/5 text-muted")}>
                      <BellRing size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">{t.haptic_feedback}</p>
                      <p className="text-[9px] text-muted">{t.haptic_desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newState = !hapticEnabled;
                      setHapticEnabled(newState);
                      if (newState) triggerHaptic('medium');
                    }}
                    className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      hapticEnabled ? "bg-accent-neon" : "bg-white/10"
                    )}
                  >
                    <motion.div
                      animate={{ x: hapticEnabled ? 22 : 2 }}
                      className="absolute top-1 w-3 h-3 bg-white rounded-full"
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full h-12 bg-white text-black rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 mt-8 shadow-lg"
              >
                {t.done_btn}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Strict Mode Toast */}
      <AnimatePresence>
        {strictToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] glass px-6 py-3 rounded-2xl border border-red-500/20 shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-tight">{t.strict_toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

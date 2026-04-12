/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Zap, Calendar, Trophy, Info, BarChart3 } from 'lucide-react';
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

const HYPE_MESSAGES = [
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

export default function App() {
  const habits = useLiveQuery(() => db.habits.toArray());
  const logs = useLiveQuery(() => db.logs.toArray());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [penaltyHabit, setPenaltyHabit] = useState<string | null>(null);
  const [hypeMessage, setHypeMessage] = useState(HYPE_MESSAGES[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [undoState, setUndoState] = useState<{ habitId: number; isStrict: boolean } | null>(null);

  useEffect(() => {
    seedDatabase();
    setHypeMessage(HYPE_MESSAGES[Math.floor(Math.random() * HYPE_MESSAGES.length)]);
  }, []);

  const auraFeedback = useMemo(() => {
    if (!logs || logs.length === 0) return { text: "Protocol initialized. Awaiting data...", type: 'positive' };

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
        text: "Warning: Aura is fading. Recover your discipline immediately.", 
        type: 'warning' 
      };
    }

    return { 
      text: "Aura is surging! Keep the momentum.", 
      type: 'positive' 
    };
  }, [logs]);

  const handleComplete = async (id: number) => {
    const habit = await db.habits.get(id);
    if (!habit) return;

    const today = startOfDay(new Date());
    const lastCompleted = habit.lastCompleted ? startOfDay(new Date(habit.lastCompleted)) : null;

    if (lastCompleted && isToday(lastCompleted)) return;

    let newStreak = habit.streak + 1;
    
    // Check if streak was broken (missed yesterday)
    if (lastCompleted) {
      const daysSinceLast = differenceInDays(today, lastCompleted);
      if (daysSinceLast > 1) {
        if (habit.strictMode) {
          setPenaltyHabit(habit.name);
          newStreak = 1; 
        } else {
          newStreak = 1;
        }
      }
    }

    await db.habits.update(id, {
      streak: newStreak,
      lastCompleted: new Date()
    });

    await db.logs.add({
      habitId: id,
      date: format(today, 'yyyy-MM-dd'),
      status: 'done',
      timestamp: new Date()
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Set undo state - Always allow undo now
    setUndoState({ habitId: id, isStrict: habit.strictMode });

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: [habit.color, '#ffffff', '#00ff9d']
    });
  };

  const handleUndo = async () => {
    if (!undoState || undoState.isStrict) return;

    const habit = await db.habits.get(undoState.habitId);
    if (!habit) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayLog = await db.logs
      .where({ habitId: undoState.habitId, date: todayStr })
      .filter(l => l.status === 'done' || l.status === 'skip')
      .first();

    if (todayLog && todayLog.id) {
      const isDone = todayLog.status === 'done';
      await db.logs.delete(todayLog.id);
      
      // Find the previous completion date
      const prevLog = await db.logs
        .where('habitId')
        .equals(undoState.habitId)
        .and(l => l.status === 'done')
        .reverse()
        .first();

      await db.habits.update(undoState.habitId, {
        streak: isDone ? Math.max(0, habit.streak - 1) : habit.streak,
        lastCompleted: prevLog ? prevLog.timestamp : null
      });
    }

    setUndoState(null);
  };

  const handleSkip = async (id: number) => {
    const habit = await db.habits.get(id);
    if (!habit) return;

    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Check if already logged today
    const existingLog = await db.logs.where({ habitId: id, date: todayStr }).first();
    if (existingLog) return;

    await db.logs.add({
      habitId: id,
      date: todayStr,
      status: 'skip',
      timestamp: new Date()
    });
    
    await db.habits.update(id, {
      lastCompleted: new Date()
    });

    // Set undo state - Conditional based on strict mode
    setUndoState({ habitId: id, isStrict: habit.strictMode });
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

      {/* Header: Compressed padding */}
      <header className="p-6 pt-10 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.25)]">
              <Zap size={16} className="text-black fill-black" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Aura</h1>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsStatsModalOpen(true)}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <BarChart3 size={18} />
          </motion.button>
        </div>
        
        <div className="flex flex-col">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/30 font-mono text-[10px] uppercase tracking-[0.25em]"
          >
            {hypeMessage}
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "text-[9px] italic mt-1 font-medium",
              auraFeedback.type === 'warning' ? "text-red-500/80" : "text-[#00ff9d]/60"
            )}
          >
            {auraFeedback.text}
          </motion.p>
        </div>
      </header>

      {/* Stats Overview: Significantly smaller cards */}
      <section className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="glass rounded-2xl p-3 relative overflow-hidden group h-20 flex flex-col justify-center"
          >
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Trophy size={40} />
            </div>
            <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-0.5">Total Power</p>
            <p className="text-xl font-black tracking-tight">{totalStreaks}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="glass rounded-2xl p-3 relative overflow-hidden group h-20 flex flex-col justify-center"
          >
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Calendar size={40} />
            </div>
            <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-0.5">Active Auras</p>
            <p className="text-xl font-black tracking-tight">{habits?.length || 0}</p>
          </motion.div>
        </div>
      </section>

      {/* Habits List: Compressed spacing */}
      <main className="px-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] font-light">Current Protocols</h2>
          <div className="h-[1px] flex-1 mx-3 bg-white/5" />
        </div>

        <AnimatePresence mode="popLayout">
          <div className="grid gap-3">
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
          </div>
        </AnimatePresence>

        {habits?.length === 0 && (
          <div className="text-center py-12 glass rounded-2xl border-dashed border border-white/5">
            <Info className="mx-auto text-white/10 mb-3" size={24} />
            <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest">No active protocols</p>
          </div>
        )}
      </main>

      {/* Floating Action Button: Smaller and less obtrusive */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setEditingHabit(undefined);
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-white text-black rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.25)] z-40"
      >
        <Plus size={24} />
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

      <UndoSnackbar
        isVisible={!!undoState}
        onUndo={handleUndo}
        onClose={() => setUndoState(null)}
        isStrict={undoState?.isStrict || false}
      />
    </div>
  );
}

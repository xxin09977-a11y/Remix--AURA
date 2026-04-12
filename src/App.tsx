/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Zap, Calendar, Trophy, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import { db, seedDatabase, type Habit } from './db/db';
import { HabitCard } from './components/HabitCard';
import { AddHabitModal } from './components/AddHabitModal';
import { StrictPenalty } from './components/StrictPenalty';
import { isToday, differenceInDays, startOfDay } from 'date-fns';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [penaltyHabit, setPenaltyHabit] = useState<string | null>(null);
  const [hypeMessage, setHypeMessage] = useState(HYPE_MESSAGES[0]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    seedDatabase();
    setHypeMessage(HYPE_MESSAGES[Math.floor(Math.random() * HYPE_MESSAGES.length)]);
  }, []);

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
      date: today.toISOString().split('T')[0],
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

  const handleSkip = async (id: number) => {
    const habit = await db.habits.get(id);
    if (!habit) return;

    const today = startOfDay(new Date());
    await db.logs.add({
      habitId: id,
      date: today.toISOString().split('T')[0],
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
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <Zap size={16} className="text-black fill-black" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Aura</h1>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/30 font-mono text-[10px] uppercase tracking-[0.25em]"
        >
          {hypeMessage}
        </motion.p>
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
            {habits?.map((habit) => (
              <HabitCard
                key={habit.id!}
                habit={habit}
                onComplete={handleComplete}
                onSkip={handleSkip}
                onEdit={(h) => {
                  setEditingHabit(h);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteHabit}
              />
            ))}
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
    </div>
  );
}

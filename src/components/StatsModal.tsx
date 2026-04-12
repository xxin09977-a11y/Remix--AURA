import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart3, Trophy, Target, Activity } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { type Habit, type Log } from '../db/db';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  logs: Log[];
}

export function StatsModal({ isOpen, onClose, habits, logs }: StatsModalProps) {
  const stats = useMemo(() => {
    if (!logs.length) return { chartData: [], longestStreak: 0, completionRate: 0 };

    // 1. Chart Data (Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayLogs = logs.filter(l => l.date === dateStr);
      // Support both 'skip' and 'skipped' for robustness
      const doneCount = dayLogs.filter(l => l.status === 'done').length;
      const skipCount = dayLogs.filter(l => l.status === 'skip' || l.status === 'skipped').length;
      
      return {
        name: format(date, 'EEE'),
        done: doneCount,
        skip: skipCount,
        empty: (doneCount === 0 && skipCount === 0) ? 0.2 : 0,
        date: dateStr
      };
    });

    // 2. Longest Streak
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

    // 3. Completion Rate
    const totalLogs = logs.length;
    const doneLogs = logs.filter(l => l.status === 'done').length;
    const completionRate = totalLogs > 0 ? Math.round((doneLogs / totalLogs) * 100) : 0;

    return { chartData: last7Days, longestStreak, completionRate };
  }, [logs, habits]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <BarChart3 size={16} className="text-white" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Aura Analytics</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="glass rounded-2xl p-4 flex flex-col items-center text-center">
                <Trophy size={20} className="text-yellow-500 mb-2" />
                <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Longest Streak</p>
                <p className="text-2xl font-black text-white">{stats.longestStreak}d</p>
              </div>
              <div className="glass rounded-2xl p-4 flex flex-col items-center text-center">
                <Target size={20} className="text-emerald-500 mb-2" />
                <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Completion Rate</p>
                <p className="text-2xl font-black text-white">{stats.completionRate}%</p>
              </div>
            </div>

            {/* Weekly Activity Chart */}
            <div className="glass rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Weekly Activity</h3>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#00ff9d]" />
                    <span className="text-[10px] text-white/50 font-mono">Done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                    <span className="text-[10px] text-white/50 font-mono">Skip</span>
                  </div>
                </div>
              </div>
              
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-2xl">
                              <p className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-widest">{format(new Date(data.date), 'MMMM d')}</p>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-8">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d]" />
                                    <span className="text-xs text-white/70">Done</span>
                                  </div>
                                  <span className="text-xs font-bold">{data.done}</span>
                                </div>
                                <div className="flex items-center justify-between gap-8">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                                    <span className="text-xs text-white/70">Skip</span>
                                  </div>
                                  <span className="text-xs font-bold">{data.skip}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="empty" 
                      stackId="a" 
                      fill="rgba(255,255,255,0.05)" 
                      radius={[4, 4, 0, 0]} 
                      isAnimationActive={true}
                    />
                    <Bar 
                      dataKey="done" 
                      stackId="a" 
                      fill="#00ff9d" 
                      radius={[0, 0, 0, 0]} 
                      isAnimationActive={true}
                    />
                    <Bar 
                      dataKey="skip" 
                      stackId="a" 
                      fill="#ef4444" 
                      radius={[4, 4, 0, 0]} 
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] font-mono text-white/50 italic">
                "Data is the fuel of discipline. Analyze. Adapt. Ascend."
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

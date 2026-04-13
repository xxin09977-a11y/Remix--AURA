import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart3, Trophy, Target, Activity, Award, Lock, TrendingUp, Zap } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  ReferenceLine
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { type Habit, type Log } from '../db/db';
import { achievements } from '../lib/achievements';
import { translations } from '../lib/i18n';
import { cn } from '../lib/utils';
import { CalendarView } from './CalendarView';
import { TrendsView } from './TrendsView';
import { iconMap } from '../lib/icons';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  logs: Log[];
}

export function StatsModal({ isOpen, onClose, habits, logs }: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'calendar' | 'trends'>('stats');
  const lang = (localStorage.getItem('aura-lang') as 'en' | 'mm') || 'en';
  const t = translations[lang];

  const stats = useMemo(() => {
    if (!logs.length) return { chartData: [], longestStreak: 0, completionRate: 0, habitStats: [] };

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

    // 4. Per-habit stats
    const habitStats = habits.map(habit => {
      const habitLogs = logs.filter(l => l.habitId === habit.id);
      const total = habitLogs.length;
      const done = habitLogs.filter(l => l.status === 'done').length;
      const skip = habitLogs.filter(l => l.status === 'skip' || l.status === 'skipped').length;
      
      return {
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        skipRate: total > 0 ? Math.round((skip / total) * 100) : 0,
        streak: habit.streak
      };
    });

    return { chartData: last7Days, longestStreak, completionRate, habitStats };
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
                  <Activity size={16} className="text-white" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">{t.app_name} Analytics</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 glass rounded-xl mb-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('stats')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap",
                  activeTab === 'stats' ? "bg-white text-black" : "text-muted hover:text-primary"
                )}
              >
                <BarChart3 size={12} />
                <span>Stats</span>
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap",
                  activeTab === 'trends' ? "bg-white text-black" : "text-muted hover:text-primary"
                )}
              >
                <TrendingUp size={12} />
                <span>{t.trends}</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap",
                  activeTab === 'calendar' ? "bg-white text-black" : "text-muted hover:text-primary"
                )}
              >
                <Activity size={12} />
                <span>{t.calendar}</span>
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap",
                  activeTab === 'achievements' ? "bg-white text-black" : "text-muted hover:text-primary"
                )}
              >
                <Trophy size={12} />
                <span>{t.achievements}</span>
              </button>
            </div>

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="glass rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute -right-2 -top-2 w-12 h-12 bg-yellow-500/10 blur-xl rounded-full" />
                    <Trophy size={20} className="text-yellow-500 mb-2" />
                    <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Longest Streak</p>
                    <p className="text-2xl font-black text-white">{stats.longestStreak}d</p>
                  </div>
                  <div className="glass rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute -right-2 -top-2 w-12 h-12 bg-emerald-500/10 blur-xl rounded-full" />
                    <div className="h-12 w-12 mb-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Done', value: stats.completionRate },
                              { name: 'Remaining', value: 100 - stats.completionRate }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={15}
                            outerRadius={22}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill="#00ff9d" />
                            <Cell fill="rgba(255,255,255,0.05)" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Completion Rate</p>
                    <p className="text-xl font-black text-white">{stats.completionRate}%</p>
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
                          cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                                  <p className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-widest">{format(new Date(data.date), 'MMMM d')}</p>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-8">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] shadow-[0_0_8px_#00ff9d]" />
                                        <span className="text-xs text-white/70">Done</span>
                                      </div>
                                      <span className="text-xs font-bold text-white">{data.done}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-8">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
                                        <span className="text-xs text-white/70">Skip</span>
                                      </div>
                                      <span className="text-xs font-bold text-white">{data.skip}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={habits.length} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
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

                {/* Protocol Performance List */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 px-1">Protocol Performance</h3>
                  <div className="grid gap-3">
                    {stats.habitStats.map((habit) => {
                      const Icon = iconMap[habit.icon] || Zap;
                      return (
                        <div key={habit.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                          >
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-bold truncate">{habit.name}</h4>
                              <span className="text-[10px] font-mono text-white/40">{habit.streak}d streak</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Done</span>
                                <span className="text-xs font-bold text-emerald-400">{habit.completionRate}%</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Skip</span>
                                <span className="text-xs font-bold text-amber-400">{habit.skipRate}%</span>
                              </div>
                              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden self-end mb-1">
                                <div 
                                  className="h-full bg-emerald-400 transition-all duration-1000" 
                                  style={{ width: `${habit.completionRate}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'trends' && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TrendsView habits={habits} logs={logs} />
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CalendarView habits={habits} logs={logs} />
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {achievements.map((achievement) => {
                  const isEarned = achievement.check(habits, logs);
                  const Icon = achievement.icon;
                  return (
                    <div 
                      key={achievement.id}
                      className={cn(
                        "glass rounded-2xl p-4 flex items-center gap-4 transition-all",
                        isEarned ? "border-white/10" : "opacity-40 grayscale"
                      )}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isEarned ? `${achievement.color}22` : 'rgba(255,255,255,0.05)', color: isEarned ? achievement.color : 'rgba(255,255,255,0.2)' }}
                      >
                        {isEarned ? <Icon size={24} /> : <Lock size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm truncate">{achievement.title}</h3>
                          {isEarned && (
                            <span className="text-[9px] font-mono text-accent-neon uppercase tracking-widest">{t.earned}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed mt-0.5">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            <div className="text-center mt-6">
              <p className="text-[10px] font-mono text-white/50 italic">
                {activeTab === 'stats' ? '"Data is the fuel of discipline. Analyze. Adapt. Ascend."' : '"Every achievement is a testament to your unyielding will."'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

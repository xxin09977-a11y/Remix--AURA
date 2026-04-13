import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  AreaChart,
  Area,
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { 
  format, 
  subWeeks, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval 
} from 'date-fns';
import { type Habit, type Log } from '../db/db';
import { translations } from '../lib/i18n';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendsViewProps {
  habits: Habit[];
  logs: Log[];
}

export function TrendsView({ habits, logs }: TrendsViewProps) {
  const lang = (localStorage.getItem('aura-lang') as 'en' | 'mm') || 'en';
  const t = translations[lang];

  const trendData = useMemo(() => {
    // 1. Weekly Trend (Last 8 Weeks)
    const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(new Date(), 7 - i));
      const weekEnd = endOfWeek(weekStart);
      
      const weekLogs = logs.filter(l => {
        const logDate = new Date(l.date);
        return l.status !== 'none' && isWithinInterval(logDate, { start: weekStart, end: weekEnd });
      });

      const doneCount = weekLogs.filter(l => l.status === 'done').length;
      const totalCount = weekLogs.length;
      const rate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

      return {
        name: `W${8-i}`,
        rate,
        label: format(weekStart, 'MMM d')
      };
    });

    // 2. Monthly Trend (Last 6 Months)
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
      const monthEnd = endOfMonth(monthStart);

      const monthLogs = logs.filter(l => {
        const logDate = new Date(l.date);
        return l.status !== 'none' && isWithinInterval(logDate, { start: monthStart, end: monthEnd });
      });

      const doneCount = monthLogs.filter(l => l.status === 'done').length;
      const totalCount = monthLogs.length;
      const rate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

      return {
        name: format(monthStart, 'MMM'),
        rate
      };
    });

    // 3. Insights
    const currentWeekRate = weeklyTrend[7].rate;
    const prevWeekRate = weeklyTrend[6].rate;
    const diff = currentWeekRate - prevWeekRate;

    return { weeklyTrend, monthlyTrend, diff };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Weekly Trend Chart */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">{t.weekly_trend}</h3>
          <div className="flex items-center gap-2">
            {trendData.diff > 0 ? (
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp size={14} />
                <span className="text-[10px] font-bold">+{trendData.diff}%</span>
              </div>
            ) : trendData.diff < 0 ? (
              <div className="flex items-center gap-1 text-red-400">
                <TrendingDown size={14} />
                <span className="text-[10px] font-bold">{trendData.diff}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted">
                <Minus size={14} />
                <span className="text-[10px] font-bold">0%</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData.weeklyTrend}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-neon)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-neon)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              />
              <YAxis 
                hide 
                domain={[0, 100]}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#111] border border-white/10 p-2 rounded-lg shadow-2xl backdrop-blur-md">
                        <p className="text-[9px] font-mono text-white/40 mb-1 uppercase tracking-widest">{payload[0].payload.label}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-neon shadow-[0_0_8px_var(--accent-neon)]" />
                          <p className="text-xs font-bold text-white">{payload[0].value}% {t.completion_rate}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={80} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" label={{ value: 'ELITE', position: 'right', fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 'bold' }} />
              <Area 
                type="monotone" 
                dataKey="rate" 
                stroke="var(--accent-neon)" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorRate)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">{t.monthly_trend}</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData.monthlyTrend}>
              <defs>
                <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-neon)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--accent-neon)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              />
              <YAxis 
                hide 
                domain={[0, 100]}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#111] border border-white/10 p-2 rounded-lg shadow-2xl backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-neon" />
                          <p className="text-xs font-bold text-white">{payload[0].value}% {t.completion_rate}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="stepAfter" 
                dataKey="rate" 
                stroke="var(--accent-neon)" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorMonthly)"
                activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Section */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">{t.insights}</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-neon mt-1.5 shrink-0" />
            <p className="text-[10px] text-white/60 leading-relaxed font-mono">
              {trendData.diff > 0 
                ? `Your discipline is surging. Weekly completion rate increased by ${trendData.diff}% compared to last week.`
                : trendData.diff < 0
                ? `Aura fading. Completion rate dropped by ${Math.abs(trendData.diff)}%. Re-establish protocol immediately.`
                : "Steady state achieved. Maintain current discipline levels."}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-neon mt-1.5 shrink-0" />
            <p className="text-[10px] text-white/60 leading-relaxed font-mono">
              {habits.some(h => h.strictMode && h.streak > 7)
                ? "Strict Mode protocols are anchoring your aura. High-stakes discipline is effective."
                : "Consider activating Strict Mode for underperforming protocols to increase accountability."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Filter, StickyNote } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval 
} from 'date-fns';
import { type Habit, type Log } from '../db/db';
import { translations } from '../lib/i18n';
import { cn } from '../lib/utils';

interface CalendarViewProps {
  habits: Habit[];
  logs: Log[];
}

export function CalendarView({ habits, logs }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHabitIds, setSelectedHabitIds] = useState<number[]>(habits.map(h => h.id!).filter(Boolean));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const lang = (localStorage.getItem('aura-lang') as 'en' | 'mm') || 'en';
  const t = translations[lang];

  const toggleHabit = (id: number) => {
    setSelectedHabitIds(prev => 
      prev.includes(id) ? prev.filter(hId => hId !== id) : [...prev, id]
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 glass rounded-lg hover:bg-white/10 transition-all"
            title={t.prev_month}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 glass rounded-lg hover:bg-white/10 transition-all"
            title={t.next_month}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-mono text-muted uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayLogs = logs.filter(l => l.date === dateStr && selectedHabitIds.includes(l.habitId));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={i}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "aspect-square glass rounded-lg p-1 flex flex-col items-center justify-between relative transition-all cursor-pointer",
                !isCurrentMonth && "opacity-20 grayscale",
                isToday && "border-primary/40 bg-white/5",
                selectedDay && isSameDay(day, selectedDay) && "ring-1 ring-accent-neon bg-accent-neon/5"
              )}
            >
              <span className={cn(
                "text-[9px] font-mono",
                isToday ? "text-primary font-bold" : "text-muted"
              )}>
                {format(day, 'd')}
              </span>
              
              <div className="flex flex-wrap justify-center gap-0.5 max-w-full overflow-hidden">
                {dayLogs.filter(l => l.status !== 'none').slice(0, 4).map((log, idx) => {
                  const habit = habits.find(h => h.id === log.habitId);
                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        log.status === 'done' ? "bg-primary" : "bg-red-500"
                      )}
                      style={log.status === 'done' && habit ? { backgroundColor: habit.color } : {}}
                    />
                  );
                })}
                {dayLogs.some(l => l.note) && (
                  <div className="absolute top-1 right-1">
                    <StickyNote size={6} className="text-accent-neon" />
                  </div>
                )}
                {dayLogs.length > 4 && (
                  <div className="w-1 h-1 rounded-full bg-white/40" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDay) return null;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.date === dateStr && selectedHabitIds.includes(l.habitId));
    const logsWithNotes = dayLogs.filter(l => l.note);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 glass rounded-2xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-mono text-primary uppercase tracking-widest">
            {format(selectedDay, 'MMMM d, yyyy')}
          </h4>
          <button onClick={() => setSelectedDay(null)} className="text-muted hover:text-primary">
            <ChevronLeft size={14} className="rotate-90" />
          </button>
        </div>
        
        {dayLogs.length === 0 ? (
          <p className="text-[10px] text-muted italic">No activity recorded for this day.</p>
        ) : (
          <div className="space-y-2">
            {dayLogs.map((log, idx) => {
              const habit = habits.find(h => h.id === log.habitId);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: habit?.color || '#fff' }} />
                      <span className="text-xs font-bold">{habit?.name}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-mono uppercase",
                      log.status === 'done' ? "text-primary" : 
                      log.status === 'none' ? "text-muted" : "text-red-500"
                    )}>
                      {log.status === 'none' ? 'Pending' : log.status}
                    </span>
                  </div>
                  {log.note && (
                    <div className="pl-3.5 border-l border-white/5">
                      <p className="text-[10px] text-white/50 italic leading-relaxed">
                        "{log.note}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="glass rounded-2xl p-4">
      {renderHeader()}
      
      {/* Habit Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={12} className="text-muted" />
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Filter Protocols</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {habits.map(habit => (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id!)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border",
                selectedHabitIds.includes(habit.id!)
                  ? "bg-white/10 border-white/20 text-primary"
                  : "bg-transparent border-white/5 text-muted opacity-40"
              )}
              style={selectedHabitIds.includes(habit.id!) ? { borderColor: `${habit.color}44`, boxShadow: `0 0 10px ${habit.color}11` } : {}}
            >
              {habit.name}
            </button>
          ))}
        </div>
      </div>

      {renderDays()}
      {renderCells()}
      {renderDayDetails()}
      
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Skip/Fail</span>
        </div>
      </div>
    </div>
  );
}

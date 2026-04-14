import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Brain, Dumbbell, Shield, Zap, Info, Book, Droplets, Moon, Code, 
  Sword, Flame, Heart, Coffee, Music, Camera, Bike, Timer, 
  Target, Award, Sun, Wind, Cloud, Trees, Anchor, Compass, 
  Map, PenTool, Smile, Star, Trophy, Users, Laptop, Utensils,
  Wallet, Plane, GraduationCap, Activity, AlertTriangle
} from 'lucide-react';
import { type Habit } from '../db/db';
import { cn } from '../lib/utils';
import { translations } from '../lib/i18n';

const icons = [
  { name: 'Brain', icon: Brain },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Shield', icon: Shield },
  { name: 'Zap', icon: Zap },
  { name: 'Book', icon: Book },
  { name: 'Droplets', icon: Droplets },
  { name: 'Moon', icon: Moon },
  { name: 'Code', icon: Code },
  { name: 'Sword', icon: Sword },
  { name: 'Flame', icon: Flame },
  { name: 'Heart', icon: Heart },
  { name: 'Coffee', icon: Coffee },
  { name: 'Music', icon: Music },
  { name: 'Camera', icon: Camera },
  { name: 'Bike', icon: Bike },
  { name: 'Timer', icon: Timer },
  { name: 'Target', icon: Target },
  { name: 'Award', icon: Award },
  { name: 'Sun', icon: Sun },
  { name: 'Wind', icon: Wind },
  { name: 'Cloud', icon: Cloud },
  { name: 'Trees', icon: Trees },
  { name: 'Anchor', icon: Anchor },
  { name: 'Compass', icon: Compass },
  { name: 'Map', icon: Map },
  { name: 'PenTool', icon: PenTool },
  { name: 'Smile', icon: Smile },
  { name: 'Star', icon: Star },
  { name: 'Trophy', icon: Trophy },
  { name: 'Users', icon: Users },
  { name: 'Laptop', icon: Laptop },
  { name: 'Utensils', icon: Utensils },
  { name: 'Wallet', icon: Wallet },
  { name: 'Plane', icon: Plane },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Activity', icon: Activity }
];

const colors = [
  // Neons
  '#8B5CF6', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16',
  // Pastels
  '#A78BFA', '#F87171', '#34D399', '#60A5FA', '#FBBF24', '#F472B6', '#22D3EE', '#A3E635',
  // Deep Jewels
  '#4C1D95', '#7F1D1D', '#064E3B', '#1E3A8A', '#78350F', '#831843', '#164E63', '#365314',
  // Gradients (represented by primary color for simplicity in this palette)
  '#C026D3', '#DB2777', '#4ADE80', '#2DD4BF', '#FB923C'
];

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Partial<Habit>) => void;
  initialData?: Habit;
}

export function AddHabitModal({ isOpen, onClose, onSave, initialData }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Brain');
  const [color, setColor] = useState(colors[0]);
  const [strictMode, setStrictMode] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'interval'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [interval, setIntervalValue] = useState(2);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showStrictConfirm, setShowStrictConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const lang = (localStorage.getItem('aura-lang') as 'en' | 'mm') || 'en';
  const t = translations[lang];

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIcon(initialData.icon);
      setColor(initialData.color);
      setStrictMode(initialData.strictMode);
      setReminderTime(initialData.reminderTime || '');
      setFrequency(initialData.frequency || 'daily');
      setSelectedDays(initialData.frequencyConfig?.days || [1, 2, 3, 4, 5]);
      setIntervalValue(initialData.frequencyConfig?.interval || 2);
      setPriority(initialData.priority || 'medium');
    } else {
      setName('');
      setIcon('Brain');
      setColor(colors[0]);
      setStrictMode(false);
      setReminderTime('');
      setFrequency('daily');
      setSelectedDays([1, 2, 3, 4, 5]);
      setIntervalValue(2);
      setPriority('medium');
    }
  }, [initialData, isOpen]);

  const handleStrictToggle = () => {
    if (!strictMode) {
      setShowStrictConfirm(true);
    } else {
      setStrictMode(false);
    }
  };

  const confirmStrictMode = () => {
    setStrictMode(true);
    setShowStrictConfirm(false);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      icon,
      color,
      strictMode,
      reminderTime,
      frequency,
      frequencyConfig: {
        days: frequency === 'weekly' ? selectedDays : undefined,
        interval: frequency === 'interval' ? interval : undefined
      },
      priority,
      startDate: initialData?.startDate || new Date(),
      createdAt: initialData?.createdAt || new Date(),
      streak: initialData?.streak || 0,
      isArchived: initialData?.isArchived || false
    });
    onClose();
  };

  const SelectedIcon = icons.find(i => i.name === icon)?.icon || Brain;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[20px]"
          >
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          </motion.div>
          
          <motion.div
            initial={{ y: '100%', scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: '100%', scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            className="glass w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-primary">
                {initialData ? t.edit_protocol : t.new_protocol}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Compact Name Input with Aura Preview */}
              <div>
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1.5 block">{t.protocol_name}</label>
                <div className="relative">
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: `${color}22`, color: color }}
                  >
                    <SelectedIcon size={14} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deep Work"
                    className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl p-3 pl-11 focus:outline-none transition-all duration-300 text-base text-primary placeholder:text-muted"
                    style={{ borderColor: name ? `${color}44` : undefined, boxShadow: name ? `0 0 15px ${color}11` : undefined }}
                    required
                  />
                </div>
              </div>

              {/* Horizontal Scroll Icon Selection */}
              <div>
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1.5 block">{t.visual_identity} ({icons.length})</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                  {icons.map(({ name: iconName, icon: Icon }) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                        icon === iconName ? 'bg-primary text-black dark:text-black scale-105 shadow-lg' : 'glass text-muted hover:text-primary'
                      }`}
                      style={icon === iconName ? { backgroundColor: 'var(--text-primary)' } : {}}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Color Grid */}
              <div>
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1.5 block">{t.aura_color} ({colors.length})</label>
                <div className="grid grid-cols-8 gap-3 max-h-24 overflow-y-auto pr-1 no-scrollbar">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-full aspect-square rounded-full transition-all ${
                        color === c ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-black dark:ring-offset-black' : 'opacity-40 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Priority Selection */}
              <div>
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1.5 block">{t.priority}</label>
                <div className="flex gap-2 p-1 glass rounded-xl">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest",
                        priority === p 
                          ? p === 'high' ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                            : p === 'medium' ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                            : "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                          : "text-muted hover:text-primary"
                      )}
                    >
                      {t[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Strict Mode Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between glass p-3 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-lg", strictMode ? "bg-red-500/20 text-red-500" : "bg-black/5 dark:bg-white/5 text-muted")}>
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-primary">{t.strict_mode}</p>
                        <button type="button" onClick={() => setShowInfo(!showInfo)} className="text-muted hover:text-primary transition-colors">
                          <Info size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStrictToggle}
                    className={`w-10 h-5 rounded-full transition-colors relative ${strictMode ? 'bg-red-500' : 'bg-black/10 dark:bg-white/10'}`}
                  >
                    <motion.div
                      animate={{ x: strictMode ? 22 : 2 }}
                      className="absolute top-1 w-3 h-3 bg-white rounded-full"
                    />
                  </button>
                </div>
                
                <AnimatePresence>
                  {showInfo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[10px] text-muted bg-black/5 dark:bg-white/5 p-2.5 rounded-lg leading-relaxed italic">
                        {t.strict_desc}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Frequency Settings */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1 block">{t.frequency}</label>
                <div className="grid grid-cols-3 gap-2 p-1 glass rounded-xl">
                  {(['daily', 'weekly', 'interval'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest",
                        frequency === f ? "bg-white text-black shadow-lg" : "text-muted hover:text-primary"
                      )}
                    >
                      {t[f]}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {frequency === 'weekly' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-between gap-1"
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                        const dayNames = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={cn(
                              "flex-1 aspect-square rounded-lg text-[9px] font-bold transition-all border",
                              selectedDays.includes(day) 
                                ? "bg-primary text-black border-primary" 
                                : "bg-white/5 text-muted border-white/5 hover:border-white/20"
                            )}
                          >
                            {dayNames[day].charAt(0)}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}

                  {frequency === 'interval' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 glass p-3 rounded-xl"
                    >
                      <span className="text-xs text-muted">{t.interval}:</span>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={interval}
                        onChange={(e) => setIntervalValue(parseInt(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs font-bold text-primary min-w-[60px]">
                        {t.every_x_days.replace('{x}', interval.toString())}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reminder Settings */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1 block">{t.reminders}</label>
                <div className="glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[9px] text-muted uppercase tracking-wider">{t.reminder_time}</span>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="bg-transparent text-primary text-sm font-bold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-primary text-black dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] mt-2"
                style={{ backgroundColor: 'var(--text-primary)' }}
              >
                {initialData ? t.update_aura : t.initialize_aura}
              </button>
            </form>

            {/* Strict Mode Confirmation Overlay */}
            <AnimatePresence>
              {showStrictConfirm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-20 bg-black/95 flex items-center justify-center p-6 text-center rounded-[2rem]"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold">{t.activate_strict}</h3>
                    <p className="text-xs text-white/40 leading-relaxed">
                      {t.strict_warning}
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowStrictConfirm(false)}
                        className="flex-1 h-10 rounded-xl glass text-xs font-bold"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={confirmStrictMode}
                        className="flex-1 h-10 rounded-xl bg-red-500 text-white text-xs font-bold"
                      >
                        {t.confirm}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

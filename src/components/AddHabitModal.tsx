import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Brain, Dumbbell, Shield, Zap, Info, Book, Droplets, Moon, Code, 
  Sword, Flame, Heart, Coffee, Music, Camera, Bike, Timer, 
  Target, Award, Sun, Wind, Cloud, Trees, Anchor, Compass, 
  Map, PenTool, Smile, Star, Trophy, Users, Laptop, Utensils,
  Wallet, Plane, GraduationCap, Activity
} from 'lucide-react';
import { type Habit } from '../db/db';
import { cn } from '../lib/utils';

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
  const [showStrictConfirm, setShowStrictConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIcon(initialData.icon);
      setColor(initialData.color);
      setStrictMode(initialData.strictMode);
    } else {
      setName('');
      setIcon('Brain');
      setColor(colors[0]);
      setStrictMode(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      icon,
      color,
      strictMode,
      startDate: initialData?.startDate || new Date(),
      createdAt: initialData?.createdAt || new Date(),
      streak: initialData?.streak || 0
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
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight">
                {initialData ? 'Edit Protocol' : 'New Protocol'}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Compact Name Input with Aura Preview */}
              <div>
                <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5 block">Protocol Name</label>
                <div className="relative">
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: `${color}22`, color: color }}
                  >
                    <SelectedIcon size={14} />
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deep Work"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-11 focus:outline-none transition-all duration-300 text-base"
                    style={{ borderColor: name ? `${color}44` : undefined, boxShadow: name ? `0 0 15px ${color}11` : undefined }}
                    required
                  />
                </div>
              </div>

              {/* Horizontal Scroll Icon Selection */}
              <div>
                <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5 block">Visual Identity ({icons.length})</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                  {icons.map(({ name: iconName, icon: Icon }) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                        icon === iconName ? 'bg-white text-black scale-105 shadow-lg' : 'glass text-white/30 hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Color Grid */}
              <div>
                <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5 block">Aura Color ({colors.length})</label>
                <div className="grid grid-cols-8 gap-2 max-h-24 overflow-y-auto pr-1 no-scrollbar">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-full aspect-square rounded-full transition-all ${
                        color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-30 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Compact Strict Mode Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between glass p-3 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-lg", strictMode ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white/20")}>
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs">Strict Mode</p>
                        <button type="button" onClick={() => setShowInfo(!showInfo)} className="text-white/20 hover:text-white transition-colors">
                          <Info size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStrictToggle}
                    className={`w-10 h-5 rounded-full transition-colors relative ${strictMode ? 'bg-red-500' : 'bg-white/10'}`}
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
                      <p className="text-[10px] text-white/40 bg-white/5 p-2.5 rounded-lg leading-relaxed italic">
                        "Strict Mode" enforces absolute discipline. If you miss a single day, your streak will be shattered and reset to 0 immediately. No exceptions.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] mt-2"
              >
                {initialData ? 'Update Aura' : 'Initialize Aura'}
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
                      <Shield size={24} />
                    </div>
                    <h3 className="text-lg font-bold">Activate Strict Protocol?</h3>
                    <p className="text-xs text-white/40 leading-relaxed">
                      You won't be able to undo your progress. If you miss a single day, your streak will be shattered. Are you sure?
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowStrictConfirm(false)}
                        className="flex-1 h-10 rounded-xl glass text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={confirmStrictMode}
                        className="flex-1 h-10 rounded-xl bg-red-500 text-white text-xs font-bold"
                      >
                        Confirm
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

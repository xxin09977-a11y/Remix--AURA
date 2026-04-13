import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Save, Trash2, Plus } from 'lucide-react';
import { db, type CustomTheme } from '../db/db';
import { triggerHaptic } from '../App';
import { cn } from '../lib/utils';

interface ThemeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeCreated: (themeId: string) => void;
}

export function ThemeCreator({ isOpen, onClose, onThemeCreated }: ThemeCreatorProps) {
  const [name, setName] = useState('');
  const [colors, setColors] = useState({
    bg: '#0D0D0D',
    primary: '#ffffff',
    accent: '#00ff9d',
    text: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.4)'
  });

  const handleSave = async () => {
    if (!name.trim()) return;

    const themeId = `custom-${Date.now()}`;
    const newTheme: CustomTheme = {
      id: themeId,
      name: name.trim(),
      colors: {
        ...colors,
        glass: `${colors.accent}15`,
        border: `${colors.accent}33`
      },
      createdAt: new Date()
    };

    await db.customThemes.add(newTheme);
    triggerHaptic('medium');
    onThemeCreated(themeId);
    onClose();
    setName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass w-full max-w-sm rounded-[2rem] p-6 relative z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-accent-neon" />
                <h2 className="text-lg font-bold tracking-tight">Custom Theme</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5 block">Theme Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Midnight Neon"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-neon transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5 block">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors.bg}
                      onChange={(e) => setColors({ ...colors, bg: e.target.value })}
                      className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono uppercase">{colors.bg}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5 block">Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                      className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono uppercase">{colors.accent}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Preview</p>
                <div 
                  className="rounded-xl p-4 space-y-2 border"
                  style={{ 
                    backgroundColor: colors.bg, 
                    borderColor: `${colors.accent}33`,
                    color: colors.text 
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                    <p className="text-xs font-bold">Protocol Active</p>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full" style={{ backgroundColor: colors.accent, width: '60%' }} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full py-4 bg-accent-neon text-black rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                Create Theme
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

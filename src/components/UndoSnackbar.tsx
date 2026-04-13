import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Lock } from 'lucide-react';

interface UndoSnackbarProps {
  isVisible: boolean;
  onUndo: () => void;
  onClose: () => void;
  isStrict: boolean;
  duration?: number;
}

export function UndoSnackbar({ isVisible, onUndo, onClose, isStrict, duration = 5000 }: UndoSnackbarProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (isVisible) {
      setTimeLeft(duration);
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-6 right-6 z-[100] flex justify-center pointer-events-none"
        >
          <div className="glass rounded-2xl p-3 flex items-center justify-between w-full max-w-md pointer-events-auto shadow-2xl border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isStrict ? 'bg-red-500/10 text-red-500' : 'bg-white/10 text-white'}`}>
                {isStrict ? <Lock size={16} /> : <RotateCcw size={16} />}
              </div>
              <div>
                <p className="text-xs font-bold">{isStrict ? 'Action is Final' : 'Action Performed'}</p>
                {!isStrict && (
                  <p className="text-[10px] text-white/40 font-mono">Undo available for {Math.ceil(timeLeft / 1000)}s</p>
                )}
              </div>
            </div>

            {!isStrict && (
              <button
                onClick={onUndo}
                className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white/90 transition-all active:scale-95"
              >
                Undo
              </button>
            )}
            
            {!isStrict && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-white/20 rounded-full overflow-hidden w-full">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                  className="h-full bg-white"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ZapOff } from 'lucide-react';

interface StrictPenaltyProps {
  isVisible: boolean;
  habitName: string;
  onClose: () => void;
}

export function StrictPenalty({ isVisible, habitName, onClose }: StrictPenaltyProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-red-950/90 backdrop-blur-xl"
        >
          <div className="text-center max-w-sm">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 bg-red-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.5)]"
            >
              <ShieldAlert size={48} className="text-white" />
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black mb-4 tracking-tighter uppercase italic"
            >
              Streak Shattered
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-red-200/60 mb-8 font-mono text-sm uppercase tracking-widest leading-relaxed"
            >
              You failed the <span className="text-white font-bold">{habitName}</span> protocol. 
              Strict mode has reset your progress to zero. 
              Discipline is the only way out.
            </motion.p>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onClose}
              className="w-full h-16 bg-white text-black rounded-2xl font-bold text-lg hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ZapOff size={20} />
              <span>I Accept the Failure</span>
            </motion.button>
          </div>

          {/* Shatter Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%', 
                  y: '50%', 
                  scale: 0,
                  rotate: 0
                }}
                animate={{ 
                  x: `${Math.random() * 100}%`, 
                  y: `${Math.random() * 100}%`,
                  scale: Math.random() * 2,
                  rotate: Math.random() * 360,
                  opacity: 0
                }}
                transition={{ duration: 1, delay: 0.1 }}
                className="absolute w-4 h-4 bg-red-500/40 blur-sm"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

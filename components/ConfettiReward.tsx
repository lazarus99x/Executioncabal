import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SECRET_KNOWLEDGE } from '../constants';

const CONFETTI_COLORS = [
  '#00a2ff', // system-blue
  '#ffd700', // system-gold
  '#22c55e', // green-400
  '#ef4444', // red-500
  '#a855f7', // purple-400
  '#f97316', // orange-400
  '#ec4899', // pink-400
  '#06b6d4', // cyan-400
];

const CONFETTI_COUNT = 80;

interface ConfettiRewardProps {
  show: boolean;
  knowledge: string;
  onClose: () => void;
}

const confettiStyle: Record<string, React.CSSProperties> = {};

// Generate confetti particles deterministically via index
function generateConfettiParticles(): React.ReactNode[] {
  const particles: React.ReactNode[] = [];
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const left = ((i * 7 + 3) % 100);
    const delay = (i % 20) * 0.12;
    const duration = 2.4 + (i % 7) * 0.3;
    const size = 6 + (i % 5) * 2;
    const rotation = (i * 27) % 360;
    const drift = (i % 11) - 5;

    particles.push(
      <div
        key={i}
        className="confetti-particle"
        style={{
          position: 'absolute',
          top: '-10px',
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * 0.6}px`,
          backgroundColor: color,
          borderRadius: '2px',
          opacity: 0.9,
          transform: `rotate(${rotation}deg)`,
          animation: `confettiFall ${duration}s ease-in ${delay}s infinite`,
          '--confetti-drift': `${drift}px`,
        } as React.CSSProperties & { '--confetti-drift': string }}
      />
    );
  }
  return particles;
}

const ConfettiReward: React.FC<ConfettiRewardProps> = ({ show, knowledge, onClose }) => {
  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(handleDismiss, 4000);
    return () => clearTimeout(timer);
  }, [show, handleDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="confetti-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={handleDismiss}
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {generateConfettiParticles()}
          </div>

          {/* Reward card */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
            className="relative z-10 w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0a0a0a] border border-system-blue/40 rounded-xl p-8 text-center shadow-[0_0_60px_rgba(0,162,255,0.2)]">
              {/* Glowing header */}
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-system-blue/30 to-purple-600/30 flex items-center justify-center border border-system-blue/50 shadow-[0_0_25px_rgba(0,162,255,0.4)] mb-4">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-system-blue"
                  >
                    <path d="M9 12l2 2 4-4" />
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                  </svg>
                </div>
                <h2
                  className="text-2xl font-black uppercase tracking-wider"
                  style={{
                    color: '#ffd700',
                    textShadow: '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3)',
                  }}
                >
                  Hidden Knowledge Unlocked
                </h2>
              </div>

              {/* Knowledge card */}
              <div className="bg-gray-900/80 border border-system-gold/30 rounded-lg p-5 mb-6 relative">
                <div className="absolute -top-2.5 left-4 bg-[#0a0a0a] px-2 text-[10px] font-mono text-system-gold border border-system-gold/30 rounded uppercase tracking-widest">
                  Secret Wisdom
                </div>
                <p className="text-gray-200 text-sm font-serif leading-relaxed italic">
                  &ldquo;{knowledge}&rdquo;
                </p>
              </div>

              {/* Dismiss hint */}
              <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                Click anywhere or wait 4s to dismiss
              </p>
            </div>
          </motion.div>

          {/* Inline keyframe styles */}
          <style>{`
            @keyframes confettiFall {
              0% {
                transform: translateY(0) translateX(0) rotate(0deg);
                opacity: 0.9;
              }
              10% {
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) translateX(var(--confetti-drift, 0px)) rotate(720deg);
                opacity: 0;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfettiReward;

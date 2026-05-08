import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { Rank } from '../types';

interface LevelUpModalProps {
  show: boolean;
  newRank: Rank;
  secretTip: string;
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ show, newRank, secretTip, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-lg bg-[#0a0a0a] border-2 border-system-blue relative overflow-hidden shadow-[0_0_50px_rgba(0,162,255,0.3)]"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-system-blue/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-8 relative z-10 text-center">
          <div className="mb-6 flex justify-center">
             <div className="w-20 h-20 rounded-full bg-system-blue/20 flex items-center justify-center border border-system-blue shadow-[0_0_20px_rgba(0,162,255,0.5)]">
               <Trophy size={40} className="text-white" />
             </div>
          </div>

          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">
            RANK UP!
          </h2>
          <div className="text-system-blue font-mono font-bold text-xl mb-8">
            PROMOTED TO {newRank}-RANK
          </div>

          <div className="bg-gray-900/80 border border-gray-700 p-6 rounded-lg text-left mb-8 relative">
            <div className="absolute -top-3 left-4 bg-black px-2 text-xs font-mono text-system-gold border border-system-gold/30 rounded">
               <Sparkles size={10} className="inline mr-1" />
               GIFT PORTION: SECRET KNOWLEDGE
            </div>
            <p className="text-gray-300 font-serif leading-relaxed italic">
              "{secretTip}"
            </p>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-gray-500 mb-8 px-4">
             <span>STAT BOOST APPLIED</span>
             <span>XP GAIN +10% [24H]</span>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-system-blue text-black font-bold uppercase py-4 hover:bg-white transition-colors flex items-center justify-center gap-2 group"
          >
            ACKNOWLEDGE <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LevelUpModal;

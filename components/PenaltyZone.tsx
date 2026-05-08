import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Timer } from 'lucide-react';

interface PenaltyZoneProps {
  isActive: boolean;
  durationSeconds: number;
  onComplete: () => void;
}

const PenaltyZone: React.FC<PenaltyZoneProps> = ({ isActive, durationSeconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(durationSeconds);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, durationSeconds, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Red Pulse Background */}
      <div className="absolute inset-0 bg-red-900/20 animate-pulse" />
      
      {/* Sand/Desert visual effect (CSS generated) */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at 50% 50%, #550000 0%, #000 70%)',
             backgroundSize: '100% 100%' 
           }} 
      />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 text-center p-8 max-w-2xl border-4 border-system-red bg-black/80 shadow-[0_0_50px_rgba(255,0,0,0.5)]"
      >
        <div className="flex justify-center mb-6">
          <AlertTriangle size={80} className="text-system-red animate-bounce" />
        </div>
        
        <h1 className="text-5xl font-black text-system-red mb-4 tracking-widest uppercase glitch-text">
          PENALTY QUEST
        </h1>
        
        <p className="text-xl text-red-200 font-mono mb-8 uppercase">
          [Survive until the timer runs out]
        </p>

        <div className="text-7xl font-mono font-bold text-white tabular-nums mb-8">
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
          {(timeLeft % 60).toString().padStart(2, '0')}
        </div>

        <div className="bg-red-950/50 border border-red-900 p-4 rounded text-left">
          <h3 className="text-system-red font-bold mb-2 uppercase text-sm">Objective:</h3>
          <p className="text-gray-300 text-sm">
            You failed to complete your daily tasks. You must now endure the Penalty Zone. 
            Focus on your failures and prepare to do better. Do not close this window.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PenaltyZone;


import React from 'react';
import { motion } from 'framer-motion';

const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.svg
        width="60"
        height="60"
        viewBox="0 0 100 100"
        className="text-system-blue drop-shadow-[0_0_15px_rgba(0,162,255,0.8)]"
        initial={{ filter: "hue-rotate(0deg)" }}
        animate={{ filter: "hue-rotate(360deg)" }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer Ring - Broken Circle */}
        <motion.path 
          d="M 50, 5 A 45,45 0 0,1 95,50" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.path 
          d="M 50, 95 A 45,45 0 0,1 5,50" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Execution Sword Symbol */}
        <path 
          d="M50 8 L55 18 L53 65 L66 65 L66 72 L54 72 L54 88 L58 92 L42 92 L46 88 L46 72 L34 72 L34 65 L47 65 L45 18 Z" 
          fill="currentColor" 
          fillOpacity="0.9"
          filter="url(#glow)"
        />
        
        {/* Fuller (Blood Groove) */}
        <path d="M50 20 L50 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      </motion.svg>
    </div>
  );
};

export default Logo;

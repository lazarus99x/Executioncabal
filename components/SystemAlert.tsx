import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { SystemNotification } from '../types';

interface SystemAlertProps {
  notifications: SystemNotification[];
  onDismiss: (id: string) => void;
}

const SystemAlert: React.FC<SystemAlertProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto mx-4"
          >
            <div className={`
              relative p-4 border-l-4 shadow-lg backdrop-blur-md bg-opacity-90
              ${notif.type === 'WARNING' ? 'bg-slate-900 border-system-red text-red-100' : 
                notif.type === 'LEVEL_UP' ? 'bg-slate-900 border-system-gold text-yellow-100' :
                'bg-slate-900 border-system-blue text-blue-100'}
            `}>
              {/* Scanline effect overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none opacity-20 bg-[length:100%_4px,3px_100%]"></div>

              <div className="relative z-10 flex items-start gap-3">
                <div className="mt-1">
                  {notif.type === 'WARNING' && <AlertTriangle className="w-6 h-6 text-system-red" />}
                  {notif.type === 'SUCCESS' && <CheckCircle className="w-6 h-6 text-system-blue" />}
                  {notif.type === 'LEVEL_UP' && <div className="w-6 h-6 rounded-full bg-yellow-500 animate-pulse" />}
                  {notif.type === 'INFO' && <Info className="w-6 h-6 text-system-blue" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-mono font-bold text-sm tracking-wider uppercase mb-1">
                    {notif.type === 'LEVEL_UP' ? 'LEVEL UP!' : 'SYSTEM NOTIFICATION'}
                  </h4>
                  <p className="font-sans text-sm opacity-90">{notif.message}</p>
                </div>
                <button 
                  onClick={() => onDismiss(notif.id)}
                  className="text-xs hover:opacity-100 opacity-50 uppercase font-mono mt-1"
                >
                  [Dismiss]
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SystemAlert;

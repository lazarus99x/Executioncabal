
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Download, AlertTriangle, Save, RefreshCw, Moon, Sun } from 'lucide-react';

interface SettingsProps {
  onResetData: () => void;
  onExportData: () => void;
  isOnline: boolean;
  lastSynced: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onResetData, onExportData, isOnline, lastSynced, theme, toggleTheme }) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">System Configuration</h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">Manage data persistence and system reset protocols.</p>
        </header>

        {/* Theme Setting */}
        <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 mb-8 rounded shadow-sm">
             <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                {theme === 'dark' ? <Moon size={20} className="text-system-blue" /> : <Sun size={20} className="text-system-gold" />}
                INTERFACE THEME
             </h3>
             <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    Current Mode: <span className="uppercase font-bold">{theme}</span>
                </p>
                <button 
                    onClick={toggleTheme}
                    className="relative w-16 h-8 bg-gray-200 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700 transition-colors p-1"
                >
                    <motion.div 
                        initial={false}
                        animate={{ x: theme === 'dark' ? 32 : 0 }}
                        className={`w-6 h-6 rounded-full shadow-md ${theme === 'dark' ? 'bg-system-blue' : 'bg-system-gold'}`}
                    />
                </button>
             </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 mb-8 rounded shadow-sm">
            <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                <RefreshCw size={20} className={isOnline ? "text-system-blue" : "text-gray-500"} />
                NETWORK STATUS
            </h3>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center font-mono text-sm gap-2">
                <span className={isOnline ? "text-green-600 dark:text-green-400 font-bold" : "text-red-600 dark:text-red-400 font-bold"}>
                    {isOnline ? "ONLINE - CONNECTED TO CABAL SERVER" : "OFFLINE - LOCAL MODE ACTIVE"}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                    LAST SYNC: {lastSynced ? new Date(lastSynced).toLocaleTimeString() : 'NEVER'}
                </span>
            </div>
        </div>

        {/* Data Management */}
        <div className="space-y-6">
             <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-6 rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h4 className="text-gray-900 dark:text-white font-bold mb-1">Export System Data</h4>
                    <p className="text-xs text-gray-500">Download full JSON report of tasks, stats, and clients.</p>
                </div>
                <button onClick={onExportData} className="w-full md:w-auto bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-white dark:hover:text-black text-gray-900 dark:text-white px-6 py-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
                    <Download size={16} /> EXPORT JSON
                </button>
             </div>

             <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 rounded relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-system-red font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle size={20} /> DANGER ZONE
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-6">
                        Initiating a full system reset will wipe all progress, rank, and inventory. 
                        This action aligns with the "Reawakening" protocol and cannot be undone.
                    </p>
                    
                    {!confirmReset ? (
                        <button 
                            onClick={() => setConfirmReset(true)}
                            className="bg-red-100 dark:bg-red-900/50 hover:bg-system-red text-red-900 dark:text-white hover:text-white border border-red-300 dark:border-system-red px-6 py-4 rounded-lg font-bold font-mono text-sm uppercase transition-colors w-full md:w-auto active:scale-95"
                        >
                            Reset All Data
                        </button>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-4 items-center animate-pulse">
                            <span className="text-system-red font-bold uppercase text-sm">Are you absolutely sure?</span>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => setConfirmReset(false)}
                                    className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg text-xs font-bold"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    onClick={onResetData}
                                    className="flex-1 bg-system-red hover:bg-red-600 text-white dark:text-black px-6 py-3 rounded-lg text-xs font-bold"
                                >
                                    CONFIRM WIPE
                                </button>
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

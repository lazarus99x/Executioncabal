
import React, { useState } from 'react';
import { Goal, Quest, Player } from '../types';
import { Target, Plus, Zap, Trash2, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoalTrackerProps {
  goals: Goal[];
  player: Player;
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onGenerateTasks: (goal: Goal) => Promise<void>;
  isGenerating: boolean;
}

const GoalTracker: React.FC<GoalTrackerProps> = ({ goals, player, onAddGoal, onDeleteGoal, onGenerateTasks, isGenerating }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  
  const ESTIMATED_COST = 30; // 3 tasks * 10 XP
  // STRICT: Must have Bought XP
  const canAffordGen = player.boughtXp >= ESTIMATED_COST;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const goal: Goal = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: '',
      notes: newNotes,
      completed: false,
      deadline: newDeadline ? new Date(newDeadline).getTime() : Date.now() + (7 * 24 * 60 * 60 * 1000) // Default 1 week if not set
    };
    onAddGoal(goal);
    setNewTitle('');
    setNewNotes('');
    setNewDeadline('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 dark:border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">
              Strategic Objectives
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
              Define high-level targets. The System will generate execution paths.
            </p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="w-full md:w-auto bg-system-blue text-white dark:text-black font-bold font-mono px-4 py-3 md:py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-white transition-colors"
          >
            <Plus size={16} /> SET OBJECTIVE
          </button>
        </header>

        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-system-panel border border-system-blue/30 p-6 mb-8 rounded shadow-lg"
          >
            <h3 className="text-system-blue font-bold font-mono mb-4">NEW DIRECTIVE</h3>
            <input 
              className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 rounded text-gray-900 dark:text-white mb-3 focus:border-system-blue outline-none"
              placeholder="Goal Title (e.g. Launch SaaS Product)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className="flex items-center gap-2 mb-3">
               <Calendar className="text-gray-500" size={16} />
               <input 
                 type="date"
                 className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 rounded text-gray-900 dark:text-white focus:border-system-blue outline-none text-sm w-full md:w-auto"
                 value={newDeadline}
                 onChange={(e) => setNewDeadline(e.target.value)}
               />
               <span className="text-gray-500 text-xs font-mono hidden md:inline">(Deadline)</span>
            </div>
            <textarea 
              className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 rounded text-gray-900 dark:text-white mb-4 h-24 focus:border-system-blue outline-none"
              placeholder="Strategic Notes / Requirements..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white px-4 py-2">CANCEL</button>
              <button onClick={handleCreate} className="bg-system-blue text-white dark:text-black font-bold px-6 py-2 rounded">CONFIRM</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {goals.map(goal => (
            <motion.div 
              key={goal.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-system-blue/50 p-4 md:p-6 transition-colors group relative overflow-hidden shadow-sm"
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="text-yellow-600 dark:text-system-gold" size={20} />
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{goal.title}</h2>
                  </div>
                  {goal.deadline && (
                    <div className="text-xs font-mono text-system-red mb-2 flex items-center gap-1 pl-8">
                      <Calendar size={12} />
                      DEADLINE: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 pl-8">{goal.notes}</p>
                </div>
                <button 
                  onClick={() => onDeleteGoal(goal.id)}
                  className="absolute top-4 right-4 md:static text-gray-400 hover:text-system-red transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="pl-0 md:pl-8 flex gap-4 mt-2">
                <button 
                  onClick={() => onGenerateTasks(goal)}
                  disabled={isGenerating || !canAffordGen}
                  className={`w-full md:w-auto border px-4 py-3 md:py-2 rounded text-xs font-bold font-mono uppercase transition-colors flex items-center justify-center gap-2
                     ${canAffordGen 
                        ? 'bg-blue-50 dark:bg-system-blue/10 text-system-blue border-blue-200 dark:border-system-blue/30 hover:bg-system-blue hover:text-white dark:hover:text-black' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed'}
                  `}
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                  {canAffordGen ? 'GENERATE PLAN (EST. 30 BOUGHT XP)' : 'INSUFFICIENT FUNDS (REQ. 30 BOUGHT XP)'}
                </button>
              </div>
            </motion.div>
          ))}

          {goals.length === 0 && !showAdd && (
            <div className="text-center py-20 opacity-30">
              <Target size={64} className="mx-auto mb-4 text-gray-900 dark:text-white" />
              <p className="font-mono text-sm text-gray-900 dark:text-white">NO STRATEGIC OBJECTIVES SET</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalTracker;


import React from 'react';
import { Quest, TaskStatus } from '../types';
import { motion } from 'framer-motion';
import { Check, X, Calendar, BarChart2 } from 'lucide-react';
import { RANK_COLORS } from '../constants';

interface ReportsProps {
  quests: Quest[];
}

const Reports: React.FC<ReportsProps> = ({ quests }) => {
  const completed = quests.filter(q => q.status === TaskStatus.COMPLETED);
  const failed = quests.filter(q => q.status === TaskStatus.FAILED);
  const total = completed.length + failed.length;
  const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
       <div className="max-w-4xl mx-auto">
         <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">Performance Report</h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">Historical analysis of completed and failed directives.</p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-4 rounded text-center shadow-sm">
                <div className="text-xs text-gray-500 font-mono mb-1">SUCCESS RATE</div>
                <div className={`text-3xl font-black ${rate >= 80 ? 'text-system-blue' : rate >= 50 ? 'text-yellow-600 dark:text-system-gold' : 'text-system-red'}`}>
                    {rate}%
                </div>
            </div>
            <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-4 rounded text-center shadow-sm">
                <div className="text-xs text-gray-500 font-mono mb-1">TASKS CLEARED</div>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{completed.length}</div>
            </div>
            <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-4 rounded text-center shadow-sm">
                <div className="text-xs text-gray-500 font-mono mb-1">FAILURES</div>
                <div className="text-3xl font-black text-system-red">{failed.length}</div>
            </div>
        </div>

        {/* History List */}
        <div className="space-y-2">
            <h3 className="text-gray-500 dark:text-gray-400 font-bold font-mono text-sm mb-4 uppercase">Mission Log</h3>
            {[...completed, ...failed].sort((a,b) => (b.startTime || 0) - (a.startTime || 0)).map((q) => (
                <div key={q.id} className={`flex items-center justify-between p-4 border-l-2 ${q.status === 'COMPLETED' ? 'border-system-blue bg-blue-50 dark:bg-blue-900/5' : 'border-system-red bg-red-50 dark:bg-red-900/5'}`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold ${RANK_COLORS[q.difficulty]}`}>{q.difficulty}-RANK</span>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{q.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                           <Calendar size={10} />
                           {q.startTime ? new Date(q.startTime).toLocaleDateString() : 'Unknown Date'}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`font-mono font-bold ${q.status === 'COMPLETED' ? 'text-system-blue' : 'text-system-red'}`}>
                            {q.status === 'COMPLETED' ? `+${q.xpReward} XP` : `-${q.penaltyXP} XP`}
                        </span>
                    </div>
                </div>
            ))}
             {total === 0 && <div className="text-center text-gray-400 dark:text-gray-600 py-10 font-mono">NO HISTORY RECORDED</div>}
        </div>
       </div>
    </div>
  );
};

export default Reports;

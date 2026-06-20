import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Crown, Check, Play, Activity } from 'lucide-react';
import { ExecutionActivity, Player } from '../types';
import { RANK_COLORS } from '../constants';

function getRelativeTime(timestamp: number): string {
  const delta = Date.now() - timestamp;
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getActionIcon(actionType: ExecutionActivity['actionType']) {
  switch (actionType) {
    case 'TASK_START': return <Play size={14} className="text-blue-400" />;
    case 'TASK_COMPLETE': return <Check size={14} className="text-green-400" />;
    case 'TASK_FAIL': return <Eye size={14} className="text-red-400" />;
    case 'TASK_PUBLISHED': return <Eye size={14} className="text-green-400" />;
    case 'RANK_UP': return <Crown size={14} className="text-yellow-400" />;
    case 'SYSTEM': return <Activity size={14} className="text-purple-400" />;
    default: return <Activity size={14} className="text-gray-400" />;
  }
}

interface ExecutionFeedProps {
  activities: ExecutionActivity[];
  currentUsername: string;
  player: Player;
}

const ExecutionFeed: React.FC<ExecutionFeedProps> = ({ activities, currentUsername, player }) => {
  if (!activities || activities.length === 0) return null;

  // Sort newest first
  const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Activity size={14} className="text-gray-400" />
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          Execution Feed
        </span>
        <span className="text-xs font-mono text-gray-600 ml-auto">
          {activities.length} activity
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {sorted.map((activity) => {
            const isCurrentUser = activity.username === currentUsername;
            const rankColorClass = RANK_COLORS[activity.rank] || 'text-gray-400';

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                  isCurrentUser
                    ? 'bg-system-blue/5 border-system-blue/20'
                    : 'bg-[#0d0d0d] border-gray-800/60 hover:border-gray-700'
                }`}
              >
                {/* Action Icon */}
                <div className="mt-0.5 w-7 h-7 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0">
                  {getActionIcon(activity.actionType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-semibold tracking-tight ${
                        isCurrentUser ? 'text-white' : 'text-gray-200'
                      }`}
                    >
                      {activity.username}
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase ${rankColorClass}`}>
                      [{activity.rank}]
                    </span>
                    <span className="text-[10px] font-mono text-gray-600 ml-auto whitespace-nowrap">
                      {getRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                    {activity.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExecutionFeed;

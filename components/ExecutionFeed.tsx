import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Crown, Check, Play, Activity, Image } from 'lucide-react';
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
  return `${days}d ago`;
}

function getActionIcon(type: string) {
  switch (type) {
    case 'TASK_START': return <Play size={14} className="text-system-blue" />;
    case 'TASK_COMPLETE': return <Check size={14} className="text-green-400" />;
    case 'TASK_PUBLISHED': return <Eye size={14} className="text-purple-400" />;
    case 'RANK_UP': return <Crown size={14} className="text-yellow-400" />;
    case 'TASK_FAIL': return <Activity size={14} className="text-red-400" />;
    case 'PROTOCOL_SHARE': return <Image size={14} className="text-green-400" />;
    default: return <Activity size={14} className="text-gray-400" />;
  }
}

interface Props {
  activities: ExecutionActivity[];
  currentUsername: string;
  player: Player;
  limit?: number;
}

const ExecutionFeed: React.FC<Props> = ({ activities, currentUsername, player, limit = 20 }) => {
  const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {sorted.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-3 p-3 rounded-xl border ${
              a.username === currentUsername
                ? 'border-system-blue/30 bg-system-blue/5'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30'
            }`}
          >
            <div className="mt-0.5 shrink-0">{getActionIcon(a.actionType)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-sm text-gray-900 dark:text-white">{a.username}</span>
                <span className="text-xs text-gray-500">{getRelativeTime(a.timestamp)}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{a.message}</p>
              {a.imageUrl && (
                <img
                  src={a.imageUrl}
                  alt="Protocol Card"
                  className="mt-2 rounded-lg border border-gray-700 w-full max-w-[300px] h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(a.imageUrl, '_blank')}
                />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ExecutionFeed;
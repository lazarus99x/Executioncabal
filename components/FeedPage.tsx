import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Crown, Check, Play, ShoppingBag, Sparkles, Swords,
  Send, Share2, MessageSquare, Users, Trash2, Image, ThumbsUp,
  ChevronUp, Zap, AlertCircle, X,
} from 'lucide-react';
import { ExecutionActivity, Player, StoreItem, Squad } from '../types';
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
    case 'TASK_COMPLETE': return <Check size={14} className="text-emerald-400" />;
    case 'TASK_FAIL': return <AlertCircle size={14} className="text-red-400" />;
    case 'RANK_UP': return <Crown size={14} className="text-yellow-400" />;
    case 'USER_POST': return <MessageSquare size={14} className="text-cyan-400" />;
    case 'PROTOCOL_SHARE': return <Share2 size={14} className="text-green-400" />;
    case 'SYSTEM': return <Zap size={14} className="text-purple-400" />;
    default: return <Activity size={14} className="text-gray-400" />;
  }
}

interface FeedPageProps {
  activities: ExecutionActivity[];
  squads: Squad[];
  storeItems: StoreItem[];
  currentUsername: string;
  player: Player;
  onViewSquad?: (squadId: string) => void;
  onAdminPost?: (message: string) => void;
  onShareProtocol?: () => void;
  onDeleteActivity?: (id: string) => void;
  onUserPost?: (message: string) => void;
  onUpvote?: (activityId: string) => void;
}

const FeedPage: React.FC<FeedPageProps> = ({
  activities, squads, storeItems, currentUsername, player, onViewSquad,
  onAdminPost, onShareProtocol, onDeleteActivity, onUserPost, onUpvote,
}) => {
  const [adminInput, setAdminInput] = useState('');
  const [userPostInput, setUserPostInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp);
  const featuredItems = storeItems.slice(0, 3);
  const activeTeams = squads.filter(s => s.members.length > 0).slice(0, 5);

  function handleAdminPost() {
    if (!adminInput.trim() || !onAdminPost) return;
    onAdminPost(adminInput.trim());
    setAdminInput('');
  }

  function handleUserPost() {
    if (!userPostInput.trim() || !onUserPost) return;
    onUserPost(userPostInput.trim());
    setUserPostInput('');
  }

  function canUpvote(activity: ExecutionActivity): boolean {
    return activity.actionType !== 'TASK_FAIL' &&
           activity.actionType !== 'TASK_START';
  }

  function getUpvoteCount(activity: ExecutionActivity): number {
    return (activity.upvotes || []).length;
  }

  function hasUpvoted(activity: ExecutionActivity): boolean {
    return (activity.upvotes || []).includes(currentUsername);
  }

  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
          <Activity size={20} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">Execution Feed</h2>
          <p className="text-[10px] font-mono text-gray-500">Accountability board &mdash; progress breeds pressure</p>
        </div>
      </div>

      {/* User Post Widget — visible to all authenticated users */}
      <div className="bg-[#0d0d0d] border border-cyan-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <MessageSquare size={12} className="text-cyan-400" />
          </div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
            Post to Feed
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Share an update, a win, or a challenge..."
            value={userPostInput}
            onChange={(e) => setUserPostInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserPost();
              }
            }}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button
            onClick={handleUserPost}
            disabled={!userPostInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Send size={13} />
            Post
          </button>
        </div>
      </div>

      {/* Admin Post Widget — only visible when player.isAdmin */}
      {player.isAdmin && (
        <div className="bg-[#0d0d0d] border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <MessageSquare size={12} className="text-purple-400" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">
              Admin Announcement
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Post a system announcement..."
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAdminPost();
                }
              }}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              onClick={handleAdminPost}
              disabled={!adminInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider"
            >
              <Send size={13} />
              Announce
            </button>
          </div>
        </div>
      )}

      {/* Share Protocol Button */}
      {onShareProtocol && (
        <div className="bg-[#0d0d0d] border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Share2 size={13} className="text-green-400" />
            </div>
            <span className="text-xs font-mono text-gray-400">
              Share your latest protocol with the cabal
            </span>
          </div>
          <button
            onClick={onShareProtocol}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 transition-colors text-[10px] font-bold uppercase tracking-wider"
          >
            <Share2 size={12} />
            Share Protocol
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main feed column */}
        <div className="lg:col-span-3 space-y-4">
          {sorted.length === 0 ? (
            <div className="text-center py-16 bg-[#0d0d0d] rounded-xl border border-gray-800">
              <Activity size={40} className="mx-auto text-gray-700 mb-3" />
              <p className="text-sm text-gray-500 mb-1">No activity yet</p>
              <p className="text-[10px] font-mono text-gray-600 max-w-xs mx-auto">
                Complete tasks, share updates, or post to the feed. Every action logged here builds the culture of execution.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest px-1 mb-2">
                <Activity size={11} /> Live Activity
                <span className="text-gray-600 ml-auto">{sorted.length} events</span>
              </div>
              <AnimatePresence initial={false}>
                {sorted.map((activity) => {
                  const isCurrentUser = activity.username === currentUsername;
                  const rankColorClass = RANK_COLORS[activity.rank] || 'text-gray-400';
                  const showUpvote = canUpvote(activity);
                  const voted = hasUpvoted(activity);
                  const upCount = getUpvoteCount(activity);
                  const isFailure = activity.actionType === 'TASK_FAIL';
                  const isUserPost = activity.actionType === 'USER_POST';

                  return (
                    <motion.div
                      key={activity.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className={`group relative flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${
                        isUserPost
                          ? 'bg-gradient-to-r from-cyan-900/10 to-blue-900/5 border-cyan-500/20 hover:border-cyan-500/40'
                          : isFailure
                          ? 'bg-gradient-to-r from-red-900/10 to-gray-900 border-red-800/20 hover:border-red-800/40'
                          : isCurrentUser
                          ? 'bg-system-blue/5 border-system-blue/20'
                          : 'bg-[#0d0d0d] border-gray-800/60 hover:border-gray-700'
                      }`}
                    >
                      <div className={`mt-0.5 w-8 h-8 rounded-full bg-gray-900 border flex items-center justify-center flex-shrink-0 ${
                        isUserPost ? 'border-cyan-500/30' :
                        isFailure ? 'border-red-500/30' : 'border-gray-800'
                      }`}>
                        {getActionIcon(activity.actionType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold tracking-tight ${
                            isCurrentUser ? 'text-white' : 'text-gray-200'
                          }`}>
                            {activity.username}
                          </span>
                          <span className={`text-[10px] font-mono font-bold uppercase ${rankColorClass}`}>
                            [{activity.rank}]
                          </span>
                          {activity.xpChange !== undefined && (
                            <span className={`text-[10px] font-mono font-bold ${
                              activity.xpChange > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {activity.xpChange > 0 ? `+${activity.xpChange}` : `${activity.xpChange}`} XP
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-gray-600 ml-auto whitespace-nowrap">
                            {getRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 leading-relaxed ${
                          isUserPost
                            ? 'text-gray-300 font-medium'
                            : isFailure
                            ? 'text-gray-400'
                            : 'text-gray-400'
                        }`}>{activity.message}</p>
                        {activity.imageUrl && (
                          <img src={activity.imageUrl} alt="Protocol Card" className="mt-2 rounded-lg border border-gray-700 w-full max-w-[240px] h-auto cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(activity.imageUrl, '_blank')} />
                        )}

                        {/* Action bar: upvote + delete */}
                        <div className="flex items-center gap-2 mt-2">
                          {showUpvote && onUpvote && (
                            <button
                              onClick={() => onUpvote(activity.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all border ${
                                voted
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-emerald-500/30 hover:text-emerald-400'
                              }`}
                            >
                              <ChevronUp size={11} />
                              <span>{upCount > 0 ? upCount : ''}</span>
                            </button>
                          )}
                          {isCurrentUser && onDeleteActivity && (
                            <button
                              onClick={() => setShowDeleteConfirm(activity.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Teams */}
          {activeTeams.length > 0 && (
            <div className="bg-[#0d0d0d] border border-cyan-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
                <Users size={12} /> Active Teams
              </div>
              <div className="space-y-2">
                {activeTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-col gap-1.5 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Swords size={14} className="text-cyan-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{team.name}</p>
                        <p className="text-[10px] font-mono text-gray-500">
                          {team.members.filter(m => !m.userId.startsWith('pending_')).length} members
                        </p>
                        <p className="text-[9px] font-mono text-gray-600 truncate">
                          Admin: {team.adminName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onViewSquad?.(team.id)}
                      className="w-full mt-0.5 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider py-1.5 rounded-md bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/40 transition-colors"
                    >
                      <Users size={10} /> View Team
                    </button>
                  </div>
                ))}
              </div>
              {squads.length > 5 && (
                <p className="text-[9px] font-mono text-gray-600 text-center mt-2">
                  +{squads.length - 5} more teams
                </p>
              )}
            </div>
          )}

          {/* Featured Store Items */}
          {featuredItems.length > 0 && (
            <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-3">
                <ShoppingBag size={12} /> Featured Items
              </div>
              <div className="space-y-2">
                {featuredItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/50">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={12} className="text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] font-mono text-purple-400">{item.cost} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Stats */}
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-3">
              <Activity size={12} /> Your Week
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Tasks Completed</span>
                <span className="text-white font-bold">{player.totalTasksCompleted || 0}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Current Rank</span>
                <span className="text-system-gold font-bold">[{player.rank}]</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">XP Balance</span>
                <span className="text-white font-bold">{player.currentXp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-4 max-w-xs w-full shadow-2xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-red-500 mb-2"><Trash2 size={28} className="mx-auto" /></div>
                <h4 className="text-sm font-bold text-white mb-1">Delete this activity?</h4>
                <p className="text-xs text-gray-400">This cannot be undone. The post will be removed from the feed.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (onDeleteActivity) onDeleteActivity(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  DELETE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedPage;

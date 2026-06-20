import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, UserPlus, LogOut, Shield, Target,
  X, Check, AlertTriangle, Crown, Swords, Activity,
  ArrowRight, UserCheck, UserX, Coins
} from 'lucide-react';
import { Squad, SquadMember, SquadGoal, Player, Rank } from '../types';
import { RANK_COLORS } from '../constants';

interface SquadHubProps {
  squads: Squad[];
  currentUser: string;
  player: Player;
  onCreateSquad: (name: string, description: string) => void;
  onRequestJoin: (squadId: string) => void;
  onApproveMember: (squadId: string, userId: string) => void;
  onRejectMember: (squadId: string, userId: string) => void;
  onLeaveSquad: (squadId: string) => void;
  onAssignGoal: (squadId: string, title: string, desc: string, assignedTo: string, xpStake: number) => void;
  onCompleteGoal: (squadId: string, goalId: string) => void;
  onFailGoal: (squadId: string, goalId: string) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const SquadHub: React.FC<SquadHubProps> = ({
  squads, currentUser, player, onCreateSquad,
  onRequestJoin, onApproveMember, onRejectMember,
  onLeaveSquad, onAssignGoal, onCompleteGoal, onFailGoal
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedSquad, setExpandedSquad] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignTarget, setAssignTarget] = useState('');
  const [assignStake, setAssignStake] = useState(50);

  const userSquads = squads.filter(s =>
    s.members.some(m => m.userId === currentUser) || s.adminId === currentUser
  );
  const openSquads = squads.filter(s =>
    s.isOpen && !s.members.some(m => m.userId === currentUser) && s.adminId !== currentUser
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateSquad(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleAssign = (squadId: string) => {
    if (!assignTitle.trim() || !assignTarget) return;
    onAssignGoal(squadId, assignTitle.trim(), assignDesc.trim(), assignTarget, assignStake);
    setAssignTitle('');
    setAssignDesc('');
    setAssignTarget('');
    setAssignStake(50);
    setShowAssign(null);
  };

  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
            <Swords size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">Squads</h2>
            <p className="text-[10px] font-mono text-gray-500">Moving XP economy teams</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0d0d] border border-cyan-500/30 rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Create Squad</h3>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Squad name"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-3 outline-none focus:border-cyan-500"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Squad mission / description"
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-4 outline-none focus:border-cyan-500 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">Cancel</button>
                <button onClick={handleCreate} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold">Create Squad</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Squads */}
      {userSquads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <Shield size={12} /> My Squads ({userSquads.length})
          </div>
          {userSquads.map((squad) => {
            const isAdmin = squad.adminId === currentUser;
            const isExpanded = expandedSquad === squad.id;
            const pendingRequests = squad.members.filter(m => m.userId.startsWith('pending_'));

            return (
              <motion.div
                key={squad.id}
                layout
                className="bg-[#0d0d0d] border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Squad header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-900/50 transition-colors"
                  onClick={() => setExpandedSquad(isExpanded ? null : squad.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                      <Swords size={16} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{squad.name}</span>
                        {isAdmin && <Crown size={12} className="text-yellow-400" />}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 mt-0.5">
                        <span>{squad.members.length} members</span>
                        <span className="flex items-center gap-1"><Coins size={10} /> {squad.xpPool} XP</span>
                        <span>{squad.goals.filter(g => g.status === 'COMPLETED').length} goals done</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-800"
                    >
                      <div className="p-4 space-y-4">
                        {/* Description */}
                        <p className="text-xs text-gray-400">{squad.description}</p>

                        {/* Members */}
                        <div>
                          <div className="text-[10px] font-mono text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                            <Users size={11} /> Members ({squad.members.length})
                          </div>
                          <div className="space-y-1">
                            {squad.members.map((member) => {
                              const isPending = member.userId.startsWith('pending_');
                              return (
                                <div key={member.userId} className="flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${RANK_COLORS[member.rank] || 'text-gray-400'}`}>
                                      [{member.rank}]
                                    </span>
                                    <span className={`text-xs ${member.userId === currentUser ? 'text-cyan-300' : 'text-gray-300'}`}>
                                      {member.username}
                                    </span>
                                    {member.userId === squad.adminId && <Crown size={10} className="text-yellow-400" />}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                                    <span>✓{member.tasksCompleted}</span>
                                    <span className={member.tasksFailed > 0 ? 'text-red-400' : ''}>✗{member.tasksFailed}</span>
                                    <span className="text-green-400/70">+{member.xpContributed}XP</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pending requests (admin only) */}
                        {isAdmin && pendingRequests.length > 0 && (
                          <div>
                            <div className="text-[10px] font-mono text-yellow-500 uppercase mb-2 flex items-center gap-1.5">
                              <UserPlus size={11} /> Join Requests ({pendingRequests.length})
                            </div>
                            <div className="space-y-1">
                              {pendingRequests.map((req) => (
                                <div key={req.userId} className="flex items-center justify-between bg-yellow-900/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                                  <span className="text-xs text-gray-300">{req.username}</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => onApproveMember(squad.id, req.userId)}
                                      className="p-1 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => onRejectMember(squad.id, req.userId)}
                                      className="p-1 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assigned Goals */}
                        {squad.goals.length > 0 && (
                          <div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                              <Target size={11} /> Active Goals
                            </div>
                            <div className="space-y-1">
                              {squad.goals.filter(g => g.status === 'PENDING').map((goal) => {
                                const isAssignedToMe = goal.assignedTo === currentUser;
                                const canComplete = isAssignedToMe || isAdmin;
                                return (
                                  <div key={goal.id} className="flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2 border-l-2 border-cyan-500/50">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{goal.title}</span>
                                        <span className="text-[10px] font-mono text-gray-500">→ {goal.assignedToName}</span>
                                      </div>
                                      {goal.description && (
                                        <p className="text-[10px] text-gray-500 truncate">{goal.description}</p>
                                      )}
                                      <span className="text-[10px] font-mono text-orange-400">{goal.xpStake} XP at stake</span>
                                    </div>
                                    {canComplete && (
                                      <div className="flex gap-1 ml-2">
                                        <button
                                          onClick={() => onCompleteGoal(squad.id, goal.id)}
                                          className="p-1.5 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400"
                                          title="Mark complete"
                                        >
                                          <Check size={12} />
                                        </button>
                                        <button
                                          onClick={() => onFailGoal(squad.id, goal.id)}
                                          className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400"
                                          title="Mark failed"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Assign Goal (admin only) */}
                        {isAdmin && (
                          <div>
                            {showAssign === squad.id ? (
                              <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3 space-y-2">
                                <input
                                  value={assignTitle}
                                  onChange={(e) => setAssignTitle(e.target.value)}
                                  placeholder="Goal title"
                                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none"
                                />
                                <input
                                  value={assignDesc}
                                  onChange={(e) => setAssignDesc(e.target.value)}
                                  placeholder="Description (optional)"
                                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none"
                                />
                                <div className="flex gap-2">
                                  <select
                                    value={assignTarget}
                                    onChange={(e) => setAssignTarget(e.target.value)}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none"
                                  >
                                    <option value="">Assign to...</option>
                                    {squad.members.filter(m => !m.userId.startsWith('pending_') && m.userId !== currentUser).map(m => (
                                      <option key={m.userId} value={m.userId}>{m.username}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    value={assignStake}
                                    onChange={(e) => setAssignStake(Number(e.target.value))}
                                    placeholder="XP stake"
                                    className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button onClick={() => setShowAssign(null)} className="text-[10px] text-gray-500 hover:text-white">Cancel</button>
                                  <button onClick={() => handleAssign(squad.id)} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold">Assign</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setShowAssign(squad.id); setAssignTarget(''); }}
                                className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                              >
                                <Target size={11} /> Assign Goal
                              </button>
                            )}
                          </div>
                        )}

                        {/* Leave Squad */}
                        {!isAdmin && (
                          <button
                            onClick={() => onLeaveSquad(squad.id)}
                            className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors"
                          >
                            <LogOut size={11} /> Leave Squad
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Open Squads to Join */}
      {openSquads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <UserPlus size={12} /> Open Squads ({openSquads.length})
          </div>
          {openSquads.map((squad) => (
            <div key={squad.id} className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                  <Swords size={16} className="text-cyan-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">{squad.name}</span>
                  <p className="text-[10px] text-gray-500">{squad.members.length} members | {squad.goals.filter(g => g.status === 'COMPLETED').length} goals</p>
                </div>
              </div>
              <button
                onClick={() => onRequestJoin(squad.id)}
                className="flex items-center gap-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
              >
                <UserPlus size={12} /> Join
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {squads.length === 0 && (
        <div className="text-center py-12">
          <Swords size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-sm text-gray-500 mb-1">No squads yet</p>
          <p className="text-[10px] font-mono text-gray-600">Create or join a squad to start the moving XP economy</p>
        </div>
      )}
    </div>
  );
};

export default SquadHub;
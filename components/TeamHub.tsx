import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, UserPlus, LogOut, Shield, Target,
  X, Check, Crown, ArrowRight, Coins,
  BarChart3, MessageSquare, Columns, Send, Trophy, Search, XCircle,
} from 'lucide-react';
import { Squad, SquadMember, SquadGoal, Player, Rank } from '../types';
import { RANK_COLORS } from '../constants';

// --- Types ---
type KanbanStatus = 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED';
type TeamTab = 'members' | 'kanban' | 'feed' | 'analytics';
interface FeedEntry {
  id: string;
  message: string;
  author: string;
  timestamp: number;
}

interface TeamHubProps {
  teams: Squad[];
  currentUser: string;
  player: Player;
  onCreateTeam: (name: string, desc: string) => void;
  onRequestJoin: (teamId: string) => void;
  onApproveMember: (teamId: string, userId: string) => void;
  onRejectMember: (teamId: string, userId: string) => void;
  onLeaveTeam: (teamId: string) => void;
  onAssignGoal: (teamId: string, title: string, desc: string, assignedTo: string, xpStake: number) => void;
  onCompleteGoal: (teamId: string, goalId: string) => void;
  onFailGoal: (teamId: string, goalId: string) => void;
  onUpdateGoalStatus: (teamId: string, goalId: string, status: KanbanStatus) => void;
  onPostToTeamFeed: (teamId: string, message: string) => void;
  onSetPlayer: (player: Player) => void;
  // New props for search & invite
  availableUsers?: string[];
  onInviteUser?: (teamId: string, username: string) => void;
  onRemoveInvite?: (teamId: string, username: string) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// --- Helpers ---
function goalToKanban(g: SquadGoal, overrides: Record<string, KanbanStatus>): KanbanStatus {
  if (overrides[g.id]) return overrides[g.id];
  if (g.status === 'COMPLETED') return 'COMPLETED';
  if (g.status === 'FAILED') return 'COMPLETED'; // hide from kanban
  return 'ACTIVE';
}

const KANBAN_COLUMNS: { key: KanbanStatus; label: string; color: string }[] = [
  { key: 'ACTIVE', label: 'Active', color: 'border-l-cyan-500/50' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-l-yellow-500/50' },
  { key: 'COMPLETED', label: 'Completed', color: 'border-l-green-500/50' },
];

const COLORS: Record<KanbanStatus, string> = {
  ACTIVE: 'cyan',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
};

const TeamHub: React.FC<TeamHubProps> = ({
  teams, currentUser, player, onCreateTeam,
  onRequestJoin, onApproveMember, onRejectMember,
  onLeaveTeam, onAssignGoal, onCompleteGoal, onFailGoal,
  onUpdateGoalStatus, onPostToTeamFeed, onSetPlayer,
  availableUsers = [], onInviteUser, onRemoveInvite,
}) => {
  // --- UI State ---
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, TeamTab>>({});
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignTarget, setAssignTarget] = useState('');
  const [assignStake, setAssignStake] = useState(50);
  const [feedMessage, setFeedMessage] = useState('');
  const [teamFeeds, setTeamFeeds] = useState<Record<string, FeedEntry[]>>({});
  const [kanbanStatuses, setKanbanStatuses] = useState<Record<string, KanbanStatus>>({});
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  // State for search & invite
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});
  const [showSearch, setShowSearch] = useState<Record<string, boolean>>({});
  const [invitedUsers, setInvitedUsers] = useState<Record<string, string[]>>({});
  const searchRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      Object.entries(searchRefs.current).forEach(([teamId, ref]) => {
        if (ref && !ref.contains(e.target as Node)) {
          setShowSearch(prev => ({ ...prev, [teamId]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // --- Derived ---
  const userTeams = teams.filter(t =>
    t.members.some(m => m.userId === currentUser) || t.adminId === currentUser
  );
  const openTeams = teams.filter(t =>
    t.isOpen && !t.members.some(m => m.userId === currentUser) && t.adminId !== currentUser
  );

  const getTab = (teamId: string): TeamTab => activeTab[teamId] || 'members';

  // --- Handlers ---
  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateTeam(newName.trim(), newDesc.trim());
    setNewName(''); setNewDesc(''); setShowCreate(false);
  };

  const handleAssign = (teamId: string) => {
    if (!assignTitle.trim() || !assignTarget) return;
    onAssignGoal(teamId, assignTitle.trim(), assignDesc.trim(), assignTarget, assignStake);
    setAssignTitle(''); setAssignDesc(''); setAssignTarget(''); setAssignStake(50);
    setShowAssign(null);
  };

  const handleFailGoal = (teamId: string, goal: SquadGoal) => {
    // Failed task XP goes to admin's action XP (boughtXp) instead of pool
    const updatedPlayer = { ...player, boughtXp: (player.boughtXp || 0) + goal.xpStake };
    onSetPlayer(updatedPlayer);
    onFailGoal(teamId, goal.id);
  };

  const handlePostFeed = (teamId: string) => {
    if (!feedMessage.trim()) return;
    const entry: FeedEntry = { id: generateId(), message: feedMessage.trim(), author: player.name, timestamp: Date.now() };
    setTeamFeeds(prev => ({ ...prev, [teamId]: [...(prev[teamId] || []), entry] }));
    onPostToTeamFeed(teamId, feedMessage.trim());
    setFeedMessage('');
  };

  // Invite handlers
  const handleInviteUser = (teamId: string, username: string) => {
    setInvitedUsers(prev => ({
      ...prev,
      [teamId]: [...(prev[teamId] || []), username],
    }));
    onInviteUser?.(teamId, username);
    setSearchQuery(prev => ({ ...prev, [teamId]: '' }));
    setShowSearch(prev => ({ ...prev, [teamId]: false }));
  };

  const handleRemoveInvite = (teamId: string, username: string) => {
    setInvitedUsers(prev => ({
      ...prev,
      [teamId]: (prev[teamId] || []).filter(u => u !== username),
    }));
    onRemoveInvite?.(teamId, username);
  };

  // Get available users for a team (not already member, not already invited)
  const getFilteredAvailable = (team: Squad): string[] => {
    const memberUsernames = team.members.map(m => m.username);
    const teamInvited = invitedUsers[team.id] || [];
    return availableUsers.filter(
      u => !memberUsernames.includes(u) && !teamInvited.includes(u) && u !== currentUser
    );
  };

  // --- Drag-and-Drop ---
  const handleDragStart = (e: React.DragEvent, goalId: string) => {
    setDragItemId(goalId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', goalId);
  };

  const handleDragOver = (e: React.DragEvent, col: KanbanStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = (e: React.DragEvent, teamId: string, col: KanbanStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const goalId = e.dataTransfer.getData('text/plain');
    if (!goalId) return;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const goal = team.goals.find(g => g.id === goalId);
    if (!goal) return;
    const isAdmin = team.adminId === currentUser;
    const isAssigned = goal.assignedTo === currentUser;
    if (!isAdmin && !isAssigned) return;
    setKanbanStatuses(prev => ({ ...prev, [goalId]: col }));
    onUpdateGoalStatus(teamId, goalId, col);
    setDragItemId(null);
  };

  const handleDragEnd = () => {
    setDragOverCol(null);
    setDragItemId(null);
  };

  // --- Render ---
  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
            <Users size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">Teams</h2>
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
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Create Team</h3>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Team name"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-3 outline-none focus:border-cyan-500"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Team mission / description"
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-4 outline-none focus:border-cyan-500 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">Cancel</button>
                <button onClick={handleCreate} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold">Create Team</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Teams */}
      {userTeams.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <Shield size={12} /> My Teams ({userTeams.length})
          </div>
          {userTeams.map((team) => {
            const isAdmin = team.adminId === currentUser;
            const isExpanded = expandedTeam === team.id;
            const tab = getTab(team.id);
            const pendingRequests = team.members.filter(m => m.userId.startsWith('pending_'));
            const teamFeed = teamFeeds[team.id] || [];
            const teamInvited = invitedUsers[team.id] || [];
            const filteredAvailable = getFilteredAvailable(team);
            const teamSearchQuery = searchQuery[team.id] || '';

            const kanbanGoals = team.goals
              .filter(g => g.status !== 'FAILED')
              .map(g => ({ ...g, _kanbanStatus: goalToKanban(g, kanbanStatuses) }));

            return (
              <motion.div key={team.id} layout className="bg-[#0d0d0d] border border-gray-800 rounded-xl overflow-hidden">
                {/* Team header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-900/50 transition-colors"
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                      <Users size={16} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{team.name}</span>
                        {isAdmin && <Crown size={12} className="text-yellow-400" />}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 mt-0.5">
                        <span>{team.members.filter(m => !m.userId.startsWith('pending_')).length} members</span>
                        <span className="flex items-center gap-1"><Coins size={10} /> {team.xpPool} XP</span>
                        <span>{team.goals.filter(g => g.status === 'COMPLETED').length} goals done</span>
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
                      {/* Tab bar */}
                      <div className="flex border-b border-gray-800 px-4 pt-3 pb-0 gap-1">
                        {([
                          { key: 'members' as TeamTab, label: 'Members', icon: <Users size={12} /> },
                          { key: 'kanban' as TeamTab, label: 'Kanban', icon: <Columns size={12} /> },
                          { key: 'feed' as TeamTab, label: 'Feed', icon: <MessageSquare size={12} /> },
                          { key: 'analytics' as TeamTab, label: 'Analytics', icon: <BarChart3 size={12} /> },
                        ]).map(({ key, label, icon }) => (
                          <button
                            key={key}
                            onClick={() => setActiveTab(prev => ({ ...prev, [team.id]: key }))}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider border-b-2 transition-colors ${
                              tab === key
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {icon} {label}
                          </button>
                        ))}
                      </div>

                      <div className="p-4">
                        {/* Description */}
                        <p className="text-xs text-gray-400 mb-4">{team.description}</p>

                        {/* === MEMBERS TAB === */}
                        {tab === 'members' && (
                          <div className="space-y-3">
                            <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1.5">
                              <Users size={11} /> Roster ({team.members.filter(m => !m.userId.startsWith('pending_')).length})
                            </div>
                            <div className="space-y-1">
                              {team.members.filter(m => !m.userId.startsWith('pending_')).map((member) => {
                                return (
                                  <div key={member.userId} className="flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2 flex-wrap gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold ${RANK_COLORS[member.rank] || 'text-gray-400'}`}>
                                        [{member.rank}]
                                      </span>
                                      <span className={`text-xs ${member.userId === currentUser ? 'text-cyan-300' : 'text-gray-300'}`}>
                                        {member.username}
                                      </span>
                                      {member.userId === team.adminId && <Crown size={10} className="text-yellow-400" />}
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

                            {/* === INVITED USERS SECTION === */}
                            {isAdmin && teamInvited.length > 0 && (
                              <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-lg p-3">
                                <div className="text-[10px] font-mono text-indigo-400 uppercase mb-2 flex items-center gap-1.5">
                                  <UserPlus size={11} /> Invited ({teamInvited.length})
                                </div>
                                {teamInvited.map(username => (
                                  <div key={username} className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-300">{username}</span>
                                      <span className="text-[9px] uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono">pending</span>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveInvite(team.id, username)}
                                      className="p-1 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400 transition-colors"
                                      title="Cancel invite"
                                    >
                                      <XCircle size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* === SEARCH & INVITE (admin only) === */}
                            {isAdmin && filteredAvailable.length > 0 && (
                              <div ref={el => { searchRefs.current[team.id] = el; }}>
                                <div className="relative">
                                  <div className="flex items-center gap-2 bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-2">
                                    <Search size={12} className="text-gray-500 shrink-0" />
                                    <input
                                      type="text"
                                      value={teamSearchQuery}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchQuery(prev => ({ ...prev, [team.id]: val }));
                                        setShowSearch(prev => ({ ...prev, [team.id]: val.length > 0 }));
                                      }}
                                      onFocus={() => {
                                        if (teamSearchQuery.length > 0) {
                                          setShowSearch(prev => ({ ...prev, [team.id]: true }));
                                        }
                                      }}
                                      placeholder="Search & invite members..."
                                      className="flex-1 bg-transparent text-xs text-white outline-none placeholder-gray-600"
                                    />
                                    {teamSearchQuery && (
                                      <button
                                        onClick={() => {
                                          setSearchQuery(prev => ({ ...prev, [team.id]: '' }));
                                          setShowSearch(prev => ({ ...prev, [team.id]: false }));
                                        }}
                                        className="text-gray-500 hover:text-gray-300"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                  {/* Dropdown */}
                                  <AnimatePresence>
                                    {showSearch[team.id] && teamSearchQuery.length > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                                      >
                                        {filteredAvailable
                                          .filter(u => u.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                                          .slice(0, 10)
                                          .map(username => (
                                            <button
                                              key={username}
                                              onClick={() => handleInviteUser(team.id, username)}
                                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-cyan-600/20 hover:text-cyan-300 transition-colors text-left"
                                            >
                                              <UserPlus size={12} className="text-cyan-500 shrink-0" />
                                              {username}
                                            </button>
                                          ))}
                                        {filteredAvailable.filter(u =>
                                          u.toLowerCase().includes(teamSearchQuery.toLowerCase())
                                        ).length === 0 && (
                                          <div className="px-3 py-2 text-xs text-gray-500">No users found</div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            )}

                            {/* Pending requests inline */}
                            {isAdmin && pendingRequests.length > 0 && (
                              <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-3">
                                <div className="text-[10px] font-mono text-yellow-500 uppercase mb-2 flex items-center gap-1.5">
                                  <UserPlus size={11} /> Join Requests ({pendingRequests.length})
                                </div>
                                {pendingRequests.map(req => (
                                  <div key={req.userId} className="flex items-center justify-between py-1">
                                    <span className="text-xs text-gray-300">{req.username}</span>
                                    <div className="flex gap-1">
                                      <button onClick={() => onApproveMember(team.id, req.userId)} className="p-1 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400"><Check size={12} /></button>
                                      <button onClick={() => onRejectMember(team.id, req.userId)} className="p-1 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400"><X size={12} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Assign Goal */}
                            {isAdmin && (
                              <div>
                                {showAssign === team.id ? (
                                  <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3 space-y-2">
                                    <input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder="Goal title" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none" />
                                    <input value={assignDesc} onChange={e => setAssignDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none" />
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <select value={assignTarget} onChange={e => setAssignTarget(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none">
                                        <option value="">Assign to...</option>
                                        {team.members.filter(m => !m.userId.startsWith('pending_') && m.userId !== currentUser).map(m => (
                                          <option key={m.userId} value={m.userId}>{m.username}</option>
                                        ))}
                                      </select>
                                      <input type="number" value={assignStake} onChange={e => setAssignStake(Number(e.target.value))} placeholder="XP stake" className="w-full sm:w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none" />
                                    </div>
                                    <div className="flex gap-2 justify-end pt-1">
                                      <button onClick={() => setShowAssign(null)} className="text-[10px] text-gray-500 hover:text-white">Cancel</button>
                                      <button onClick={() => handleAssign(team.id)} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold">Assign</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => { setShowAssign(team.id); setAssignTarget(''); }} className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors">
                                    <Target size={11} /> Assign Goal
                                  </button>
                                )}
                              </div>
                            )}

                            {!isAdmin && (
                              <button onClick={() => onLeaveTeam(team.id)} className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors">
                                <LogOut size={11} /> Leave Team
                              </button>
                            )}
                          </div>
                        )}

                        {/* === KANBAN TAB === */}
                        {tab === 'kanban' && (
                          <div className="space-y-3">
                            <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1.5">
                              <Columns size={11} /> Kanban Board
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {KANBAN_COLUMNS.map(col => {
                                const colGoals = kanbanGoals.filter(g => g._kanbanStatus === col.key);
                                const isDragOver = dragOverCol === col.key;
                                return (
                                  <div
                                    key={col.key}
                                    className={`bg-gray-900/40 border rounded-lg p-2 min-h-[120px] transition-colors ${
                                      isDragOver ? 'border-cyan-500/60 bg-gray-900/80' : 'border-gray-800'
                                    }`}
                                    onDragOver={(e) => handleDragOver(e, col.key)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, team.id, col.key)}
                                  >
                                    <div className="flex items-center justify-between mb-2 px-1">
                                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">{col.label}</span>
                                      <span className="text-[10px] font-mono text-gray-600">{colGoals.length}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {colGoals.map(goal => {
                                        const isAssigned = goal.assignedTo === currentUser;
                                        const isAdminUser = team.adminId === currentUser;
                                        const canDrag = isAdminUser || isAssigned;
                                        const isComplete = goal.status === 'COMPLETED' || goal._kanbanStatus === 'COMPLETED';
                                        return (
                                          <div
                                            key={goal.id}
                                            draggable={canDrag}
                                            onDragStart={(e) => handleDragStart(e, goal.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`bg-gray-900/70 border-l-2 ${col.color} rounded px-2 py-1.5 text-xs cursor-${
                                              canDrag ? 'grab' : 'default'
                                            } hover:bg-gray-800/70 transition-colors ${dragItemId === goal.id ? 'opacity-50' : ''}`}
                                          >
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="font-bold text-white truncate">{goal.title}</span>
                                              {isComplete && <Check size={10} className="text-green-400 shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 mt-0.5">
                                              <span>→ {goal.assignedToName}</span>
                                              <span className="text-orange-400/80">{goal.xpStake}XP</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {colGoals.length === 0 && (
                                        <p className="text-[10px] text-gray-600 text-center py-4">No goals</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* === FEED TAB === */}
                        {tab === 'feed' && (
                          <div className="space-y-3">
                            <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1.5">
                              <MessageSquare size={11} /> Team Feed
                            </div>
                            {/* Admin post input */}
                            {isAdmin && (
                              <div className="flex gap-2">
                                <input
                                  value={feedMessage}
                                  onChange={e => setFeedMessage(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handlePostFeed(team.id); }}
                                  placeholder="Post to team feed..."
                                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                                />
                                <button
                                  onClick={() => handlePostFeed(team.id)}
                                  className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white"
                                >
                                  <Send size={14} />
                                </button>
                              </div>
                            )}
                            {/* Feed entries */}
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {teamFeed.length === 0 && (
                                <p className="text-[10px] text-gray-600 text-center py-4">No feed posts yet</p>
                              )}
                              {[...teamFeed].reverse().map(entry => (
                                <div key={entry.id} className="bg-gray-900/50 rounded-lg px-3 py-2">
                                  <p className="text-xs text-gray-200">{entry.message}</p>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-gray-500">
                                    <span>{entry.author}</span>
                                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* === ANALYTICS TAB === */}
                        {tab === 'analytics' && (
                          <div className="space-y-3">
                            <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1.5">
                              <BarChart3 size={11} /> Performance Leaderboard
                            </div>
                            <div className="space-y-1">
                              {[...team.members]
                                .filter(m => !m.userId.startsWith('pending_'))
                                .sort((a, b) => b.tasksCompleted - a.tasksCompleted || b.xpContributed - a.xpContributed)
                                .map((member, idx) => (
                                  <div
                                    key={member.userId}
                                    className={`flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2 flex-wrap gap-1 ${
                                      member.userId === currentUser ? 'ring-1 ring-cyan-500/30' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-gray-600 w-4">#{idx + 1}</span>
                                      {idx === 0 && <Trophy size={12} className="text-yellow-400" />}
                                      <span className={`text-xs font-bold ${RANK_COLORS[member.rank] || 'text-gray-400'}`}>
                                        [{member.rank}]
                                      </span>
                                      <span className={`text-xs ${member.userId === currentUser ? 'text-cyan-300' : 'text-gray-300'}`}>
                                        {member.username}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-mono">
                                      <span className="text-green-400">✓{member.tasksCompleted}</span>
                                      <span className={member.tasksFailed > 0 ? 'text-red-400' : 'text-gray-500'}>✗{member.tasksFailed}</span>
                                      <span className="text-green-400/70">+{member.xpContributed}XP</span>
                                      <span className={member.xpLost > 0 ? 'text-red-400' : 'text-gray-500'}>-{member.xpLost}XP</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
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

      {/* Open Teams to Join */}
      {openTeams.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <UserPlus size={12} /> Open Teams ({openTeams.length})
          </div>
          {openTeams.map((team) => (
            <div key={team.id} className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                  <Users size={16} className="text-cyan-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">{team.name}</span>
                  <p className="text-[10px] text-gray-500">{team.members.length} members | {team.goals.filter(g => g.status === 'COMPLETED').length} goals</p>
                </div>
              </div>
              <button
                onClick={() => onRequestJoin(team.id)}
                className="flex items-center gap-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
              >
                <UserPlus size={12} /> Join
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {teams.length === 0 && (
        <div className="text-center py-12">
          <Users size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-sm text-gray-500 mb-1">No teams yet</p>
          <p className="text-[10px] font-mono text-gray-600">Create or join a team to start the moving XP economy</p>
        </div>
      )}
    </div>
  );
};

export default TeamHub;
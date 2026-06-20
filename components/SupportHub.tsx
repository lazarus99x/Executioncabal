import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Shield,
  X,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface SupportTicketMessage {
  sender: string;
  text: string;
  timestamp: number;
  isAdmin: boolean;
}

interface SupportTicket {
  id: string;
  subject: string;
  userId: string;
  username: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: number;
  lastAdminReply?: number;
  messages: SupportTicketMessage[];
}

interface SupportHubProps {
  currentUser: string;
  isAdmin: boolean;
  openTicketCount: number;
  onSendMessage: (ticketId: string, message: string) => void;
  onCreateTicket: (subject: string, message: string) => void;
  onUpdateTicketStatus: (ticketId: string, status: string) => void;
  onMarkRead: (ticketId: string) => void;
  tickets: SupportTicket[];
}

/* ─── Status helpers ────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  OPEN: {
    label: 'OPEN',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    icon: <AlertCircle size={12} className="text-yellow-400" />,
  },
  IN_PROGRESS: {
    label: 'IN PROGRESS',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: <Clock size={12} className="text-blue-400" />,
  },
  RESOLVED: {
    label: 'RESOLVED',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
    icon: <CheckCircle size={12} className="text-green-400" />,
  },
};

function getRelativeTime(ts: number): string {
  const delta = Date.now() - ts;
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function hasUnread(ticket: SupportTicket, currentUser: string, isAdmin: boolean): boolean {
  if (!ticket.lastAdminReply) return false;
  const lastReply = ticket.messages[ticket.messages.length - 1];
  if (!lastReply) return false;
  // If current user is admin, unread means user replied after admin last saw
  // If current user is regular, unread means admin replied after user last saw
  if (isAdmin) return lastReply.sender !== currentUser && lastReply.timestamp > (ticket.lastAdminReply || 0);
  return lastReply.isAdmin && lastReply.timestamp > (ticket.lastAdminReply || 0);
}

/* ─── Component ─────────────────────────────────────────────────────────── */

const SupportHub: React.FC<SupportHubProps> = ({
  currentUser,
  isAdmin,
  openTicketCount,
  onSendMessage,
  onCreateTicket,
  onUpdateTicketStatus,
  onMarkRead,
  tickets,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Mark ticket as read when expanded
  useEffect(() => {
    if (expandedId) {
      onMarkRead(expandedId);
    }
  }, [expandedId]);

  const visibleTickets = isAdmin ? tickets : tickets.filter((t) => t.userId === currentUser);

  function handleSendReply(ticketId: string) {
    if (!replyText.trim()) return;
    onSendMessage(ticketId, replyText.trim());
    setReplyText('');
  }

  function handleCreateTicket() {
    if (!newSubject.trim() || !newMessage.trim()) return;
    onCreateTicket(newSubject.trim(), newMessage.trim());
    setNewSubject('');
    setNewMessage('');
    setShowNewTicket(false);
  }

  function handleStatusChange(ticketId: string, status: string) {
    onUpdateTicketStatus(ticketId, status);
  }

  /* ─── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center relative">
          <MessageSquare size={20} className="text-emerald-400" />
          {openTicketCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0a0a0a] flex items-center justify-center text-[9px] font-black text-white">
              {openTicketCount > 9 ? '9+' : openTicketCount}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">
            {isAdmin ? 'Support Queue' : 'Support Tickets'}
          </h2>
          <p className="text-[10px] font-mono text-gray-500">
            {isAdmin
              ? `${tickets.filter((t) => t.status !== 'RESOLVED').length} unresolved`
              : `${tickets.filter((t) => t.userId === currentUser).length} tickets`}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowNewTicket(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <Plus size={13} />
            New Ticket
          </button>
        )}
      </div>

      {/* New Ticket Form */}
      <AnimatePresence>
        {showNewTicket && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Create Ticket</span>
                <button onClick={() => setShowNewTicket(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <textarea
                placeholder="Describe your issue..."
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              />
              <button
                onClick={handleCreateTicket}
                disabled={!newSubject.trim() || !newMessage.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider"
              >
                <Send size={13} />
                Submit Ticket
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tickets List */}
      {visibleTickets.length === 0 ? (
        <div className="text-center py-16 bg-[#0d0d0d] rounded-xl border border-gray-800">
          <MessageSquare size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-sm text-gray-500 mb-1">No tickets yet</p>
          <p className="text-[10px] font-mono text-gray-600 max-w-xs mx-auto">
            {isAdmin
              ? 'Waiting for users to submit support tickets.'
              : 'Create a ticket to get help from the admin team.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTickets.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status];
            const unread = hasUnread(ticket, currentUser, isAdmin);

            return (
              <motion.div
                key={ticket.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0d0d0d] border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Ticket header (collapsed) */}
                <button
                  onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center ${sc.bg}`}
                    >
                      {sc.icon}
                    </div>
                    {unread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{ticket.subject}</span>
                      <span className={`text-[10px] font-mono font-bold uppercase ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 mt-0.5">
                      {isAdmin && (
                        <>
                          <User size={10} />
                          <span>{ticket.username}</span>
                          <span className="text-gray-700">·</span>
                        </>
                      )}
                      <span>{getRelativeTime(ticket.createdAt)}</span>
                      <span className="text-gray-700">·</span>
                      <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {expandedId === ticket.id ? (
                    <ChevronUp size={14} className="text-gray-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-600 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {expandedId === ticket.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-gray-800/60"
                    >
                      <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
                        {ticket.messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-2 ${msg.isAdmin ? 'flex-row' : 'flex-row-reverse'}`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                msg.isAdmin
                                  ? 'bg-purple-500/20 border border-purple-500/30'
                                  : 'bg-emerald-500/20 border border-emerald-500/30'
                              }`}
                            >
                              {msg.isAdmin ? (
                                <Shield size={10} className="text-purple-400" />
                              ) : (
                                <User size={10} className="text-emerald-400" />
                              )}
                            </div>
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                                msg.isAdmin
                                  ? 'bg-purple-500/10 border border-purple-500/20 text-purple-200'
                                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                  {msg.sender}
                                </span>
                                <span className="text-[9px] font-mono text-gray-600">
                                  {getRelativeTime(msg.timestamp)}
                                </span>
                              </div>
                              <p className="text-gray-300">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply box */}
                      <div className="px-4 py-3 border-t border-gray-800/60">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={isAdmin ? 'Reply as admin...' : 'Reply...'}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply(ticket.id);
                              }
                            }}
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          />
                          <button
                            onClick={() => handleSendReply(ticket.id)}
                            disabled={!replyText.trim()}
                            className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send size={14} />
                          </button>
                        </div>

                        {/* Admin actions */}
                        {isAdmin && ticket.status !== 'RESOLVED' && (
                          <div className="flex gap-2 mt-2">
                            {ticket.status === 'OPEN' && (
                              <button
                                onClick={() => handleStatusChange(ticket.id, 'IN_PROGRESS')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors text-[10px] font-mono font-bold uppercase"
                              >
                                <Clock size={10} />
                                In Progress
                              </button>
                            )}
                            {ticket.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleStatusChange(ticket.id, 'RESOLVED')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors text-[10px] font-mono font-bold uppercase"
                              >
                                <CheckCircle size={10} />
                                Resolve
                              </button>
                            )}
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
    </div>
  );
};

export default SupportHub;
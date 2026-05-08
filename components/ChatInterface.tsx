import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  PanInfo,
} from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Check,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Zap,
  Cpu,
  Terminal,
} from "lucide-react";
import { ChatMessage, Quest, Goal, ProposedTaskPlan, Player } from "../types";
import { chatWithSystem } from "../services/aiService";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onAcceptQuest: (quest: Quest) => void;
  onApprovePlan: (plan: ProposedTaskPlan) => void;
  onRejectPlan: (planId: string) => void;
  goals: Goal[];
  quests?: Quest[];
  player?: Player; // Add player prop
  openTrigger?: number; // increment this to open the chat
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onAddMessage,
  onAcceptQuest,
  onApprovePlan,
  onRejectPlan,
  goals,
  quests = [],
  player,
  openTrigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Open when header icon taps (mobile)
  useEffect(() => {
    if (openTrigger && openTrigger > 0) setIsOpen(true);
  }, [openTrigger]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading, error]);

  // Click Outside to Close (Desktop mainly, Mobile uses backdrop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isOpen &&
        window.innerWidth >= 768
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;

    if (!textOverride) {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "USER",
        text: textToSend,
        timestamp: Date.now(),
      };
      onAddMessage(userMsg);
      setInput("");
    }

    setLoading(true);
    setError(null);

    // Prepare history for API
    const history = messages.map((m) => ({
      role: m.sender === "USER" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // Pass filtered active quests as context - STRICT FILTERING
    const activeQuests = quests.filter(
      (q) => q.status === "IDLE" || q.status === "RUNNING"
    );
    const activeGoals = goals.filter((g) => !g.completed);

    try {
      const response = await chatWithSystem(
        history,
        textToSend,
        activeGoals,
        activeQuests,
        player
      );

      if (response.text.includes("[SYSTEM ERROR]")) {
        throw new Error(response.text);
      }

      const systemMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "SYSTEM",
        text: response.text,
        timestamp: Date.now(),
        proposedQuest: response.quest,
        proposedPlan: response.proposedPlan,
      };
      onAddMessage(systemMsg);
    } catch (err: any) {
      console.error("Chat failure:", err);
      setError("System busy. Connection interrupted.");
      // Auto-retry logic could go here, but manual retry is safer for UX to prevent loops
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    // Retry the last user message
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.sender === "USER");
    if (lastUserMsg) {
      handleSend(lastUserMsg.text);
    }
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 100) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              ref={containerRef}
              drag="y"
              dragControls={dragControls}
              dragListener={false} // Only drag via handle on mobile
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={handleDragEnd}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed z-50 flex flex-col bg-white dark:bg-system-dark border-t border-x border-gray-200 dark:border-system-blue/30 shadow-2xl backdrop-blur-xl 
                         bottom-0 left-0 right-0 w-full h-[85vh] rounded-t-2xl 
                         md:bottom-10 md:left-20 md:w-96 md:h-[60vh] md:rounded-lg md:border md:drag-none"
            >
              {/* Mobile Drag Handle Zone */}
              <div
                className="w-full flex justify-center pt-3 pb-2 md:hidden cursor-grab active:cursor-grabbing touch-none bg-white dark:bg-system-dark rounded-t-2xl z-20"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
              </div>

              {/* Hidden Close Button (Desktop Top Right) */}
              <button
                onClick={() => setIsOpen(false)}
                className="hidden md:flex absolute -top-3 -right-3 w-8 h-8 bg-system-red text-white rounded-full items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 z-[60] hover:scale-110 shadow-lg"
                title="Close Comms"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="bg-black p-4 flex justify-between items-center border-b border-system-blue/30 md:rounded-t-lg shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-system-blue to-transparent opacity-50" />

                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-system-blue/10 border border-system-blue/30 rounded-lg">
                    <Cpu size={20} className="text-system-blue animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-system-blue tracking-[0.2em] text-[10px]">
                        SYST-ADMIN
                      </span>
                      <div className="px-1.5 py-0.5 bg-system-blue/10 border border-system-blue/20 rounded text-[8px] text-system-blue font-bold uppercase tracking-tighter">
                        v4.0.2
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Chaos Organizer Active
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden text-gray-400 p-2 hover:text-white"
                >
                  <ChevronDown size={24} />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/50"
              >
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 dark:text-gray-600 text-xs font-mono mt-10">
                    SYSTEM ONLINE.
                    <br />
                    AWAITING QUERY.
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded text-sm ${
                        msg.sender === "USER"
                          ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700"
                          : "bg-blue-100 dark:bg-system-blue/10 text-system-blue border border-blue-200 dark:border-system-blue/20 shadow-[0_0_10px_rgba(0,162,255,0.1)]"
                      }`}
                    >
                      <div className="text-[10px] font-mono opacity-50 mb-1">
                        {msg.sender === "SYSTEM" ? "ADMIN" : "AGENT"}
                      </div>
                      {msg.text}
                    </div>

                    {/* Single Quest Proposed Card */}
                    {msg.proposedQuest && (
                      <div className="mt-2 w-[90%] bg-white dark:bg-black border border-yellow-600 dark:border-system-gold p-3 rounded relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 p-1 bg-yellow-600 dark:bg-system-gold text-white dark:text-black text-[9px] font-bold font-mono">
                          NEW DIRECTIVE
                        </div>
                        <h4 className="text-yellow-600 dark:text-system-gold font-bold text-sm">
                          {msg.proposedQuest.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-xs my-1 line-clamp-2">
                          {msg.proposedQuest.description}
                        </p>
                        <div className="flex justify-between text-xs font-mono text-gray-500 mb-2">
                          <span>{msg.proposedQuest.difficulty}-RANK</span>
                          <span>{msg.proposedQuest.xpReward} XP</span>
                        </div>
                        <button
                          onClick={() => {
                            if (msg.proposedQuest) {
                              onAcceptQuest(msg.proposedQuest);
                              msg.proposedQuest = undefined;
                            }
                          }}
                          className="w-full bg-yellow-600 dark:bg-system-gold text-white dark:text-black font-bold text-xs py-2 rounded hover:bg-yellow-700 dark:hover:bg-white flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                          <Check size={14} /> ACCEPT TASK
                        </button>
                      </div>
                    )}

                    {/* Multi-Task Proposed Plan Card */}
                    {msg.proposedPlan && (
                      <div className="mt-2 w-full bg-white dark:bg-black border border-system-blue dark:border-system-blue/50 p-4 rounded-lg relative shadow-lg overflow-hidden">
                        <div className="absolute top-0 right-0 p-1.5 bg-system-blue text-white text-[10px] font-bold font-mono tracking-tighter uppercase">
                          PROPOSED OPERATION PLAN
                        </div>

                        <div className="space-y-4 mb-4 mt-2">
                          {msg.proposedPlan.projects.map((project, pIdx) => (
                            <div
                              key={pIdx}
                              className="border-l-2 border-system-blue/30 pl-3"
                            >
                              <h5 className="text-system-blue font-bold text-sm uppercase tracking-tight flex items-center gap-2">
                                <Bot size={14} /> {project.name}
                              </h5>
                              <div className="mt-2 space-y-2">
                                {project.tasks.map((task, tIdx) => (
                                  <div
                                    key={task.id}
                                    className="text-xs group relative"
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="font-bold text-gray-800 dark:text-gray-200">
                                        {pIdx + 1}.{tIdx + 1} {task.title}
                                      </span>
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                          task.priority === "Urgent"
                                            ? "bg-red-500/10 text-red-500"
                                            : task.priority === "High"
                                              ? "bg-orange-500/10 text-orange-500"
                                              : "bg-blue-500/10 text-blue-500"
                                        }`}
                                      >
                                        {task.priority}
                                      </span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 italic">
                                      {task.description}
                                    </p>
                                    <div className="flex gap-2 mt-1 text-[9px] font-mono text-gray-400">
                                      <span>{task.xpCost} XP</span>
                                      <span>•</span>
                                      <span>{task.difficulty}-RANK</span>
                                      {task.deadline && (
                                        <>
                                          <span>•</span>
                                          <span className="text-system-blue">
                                            DUE: {task.deadline}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-mono">
                              Total System Cost
                            </span>
                            <span className="text-sm font-bold text-system-blue">
                              {msg.proposedPlan.totalXpCost} XP
                            </span>
                          </div>

                          {msg.proposedPlan.status === "PENDING" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  onRejectPlan(msg.proposedPlan!.id)
                                }
                                className="px-3 py-2 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
                              >
                                SCRAP
                              </button>
                              <button
                                onClick={() => onApprovePlan(msg.proposedPlan!)}
                                className="px-4 py-2 bg-system-blue text-white text-[10px] font-bold rounded hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(0,162,255,0.4)]"
                              >
                                <Check size={14} /> AUTHORIZE ALL
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`text-[10px] font-bold font-mono px-2 py-1 rounded ${
                                msg.proposedPlan.status === "APPROVED"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}
                            >
                              {msg.proposedPlan.status === "APPROVED"
                                ? "OPERATIONS ACTIVE"
                                : "PLAN SCRAPPED"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-blue-50 dark:bg-system-blue/5 text-system-blue/50 p-2 rounded text-xs font-mono animate-pulse">
                      Typing...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={handleRetry}
                      className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-full text-xs flex items-center gap-2 hover:bg-red-500/20 transition-colors"
                    >
                      <AlertCircle size={14} /> {error}{" "}
                      <span className="underline font-bold">RETRY</span>{" "}
                      <RefreshCw size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Input - Sticky Bottom */}
              <div className="p-3 border-t border-gray-200 dark:border-system-blue/20 bg-white dark:bg-gray-900/90 flex flex-col gap-2 md:rounded-b-lg pb-safe-bottom md:pb-3 shrink-0 z-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Message System..."
                    disabled={loading}
                    className="flex-1 bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 rounded px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-system-blue focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={loading}
                    className="bg-system-blue text-white p-3 rounded hover:bg-blue-600 disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[9px] font-mono text-gray-500 text-center uppercase tracking-wider">
                  Tip: Dump your messy tasks here—I'll organize the chaos.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatInterface;

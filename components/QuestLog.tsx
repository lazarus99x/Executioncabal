import React, { useState, useEffect, useRef } from "react";
import { Quest, Rank, TaskStatus, TaskType, Player, ProposedTaskPlan } from "../types";
import {
  Check,
  X,
  Skull,
  Loader2,
  Play,
  AlertCircle,
  Upload,
  Trash2,
  Pin,
  Wallet,
  Camera,
  Plus,
  Zap,
  Timer,
  Filter,
  ArrowDownUp,
  ArrowUp,
  History,
  ListFilter,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Target,
  SortAsc,
  SortDesc,
  Image as ImageIcon,
  User,
  Crown,
  Edit,
  Eye,
  BrainCircuit,
  CalendarClock,
  CalendarCheck,
  SendHorizonal,
  Activity,
  Flame,
  BarChart3,
} from "lucide-react";
import { RANK_COLORS, RANK_TASK_THRESHOLDS, RANK_ORDER } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import { savePlayerData } from "../lib/supabase";
import { searchArchiveWithAI } from "../services/aiService";

// ... existing QuestLogProps and types ...
interface QuestLogProps {
  player: Player;
  quests: Quest[];
  onStartQuest: (id: string) => void;
  onFailQuest: (id: string) => void;
  onVerifyProof: (
    id: string,
    proof: string,
    image?: string | null
  ) => Promise<void>;
  onAddQuest: (
    input: string,
    startTime?: string,
    deadline?: string
  ) => Promise<void>;
  onChaosSubmit?: (input: string) => Promise<ProposedTaskPlan | null>;
  onAcceptChaosPlan?: (plan: ProposedTaskPlan) => void;
  onReviveQuest?: (
    id: string,
    startTime: number,
    deadline: number
  ) => Promise<void>;
  onEditQuest: (id: string, newTitle: string, newDesc: string) => Promise<void>;
  onTogglePin: (id: string) => void;
  onDeleteQuest: (id: string) => void;
  onPublishQuest?: (id: string, isPublic: boolean) => void;
  onUpdatePlayer: (updates: Partial<Player>) => void;
  loading: boolean;
}

type SortOption = "SMART" | "NEWEST" | "OLDEST" | "URGENT" | "HARDEST";
type ArchiveSortOption =
  | "RECENT"
  | "OLDEST"
  | "FAILED"
  | "COMPLETED"
  | "HARDEST";

// ... existing helper functions (compressImage, getTimerColor, formatCountdown) ...
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const getTimerColor = (diff: number) => {
  const hours = diff / (1000 * 60 * 60);
  if (hours < 4) return "text-red-500 animate-pulse";
  if (hours < 24) return "text-yellow-500";
  return "text-system-blue";
};

const formatCountdown = (deadline?: number) => {
  if (!deadline) return "NO DEADLINE";
  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) return "EXPIRED";

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  if (d > 0) {
    return `${d}d ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const REVIVE_XP_COST = 20;

const toDateTimeLocalValue = (timestamp: number) => {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const roundUpToNextFiveMinutes = (timestamp: number) => {
  const interval = 5 * 60 * 1000;
  return Math.ceil(timestamp / interval) * interval;
};

// ... QuestCard component ...
const QuestCard: React.FC<{
  quest: Quest;
  onStart: () => void;
  onFail: () => void;
  onVerify: (proof: string, image?: string | null) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onRevive?: () => void;
  onPublish?: () => void;
}> = ({ quest, onStart, onFail, onVerify, onTogglePin, onDelete, onEdit, onRevive, onPublish }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [timeColor, setTimeColor] = useState("text-gray-500");
  const [showProofInput, setShowProofInput] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      (quest.status === TaskStatus.RUNNING ||
        quest.status === TaskStatus.IDLE) &&
      quest.deadline
    ) {
      const updateTimer = () => {
        const diff = quest.deadline! - Date.now();
        const str = formatCountdown(quest.deadline);
        setTimeLeft(str);
        setTimeColor(getTimerColor(diff));

        if (str === "EXPIRED" && quest.status !== TaskStatus.FAILED) {
          onFail();
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [quest.status, quest.deadline, onFail]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      try {
        const compressedBase64 = await compressImage(file);
        setProofImage(compressedBase64);
      } catch (err) {
        console.error("Image processing failed", err);
        alert("Failed to process image. Try a smaller file.");
      } finally {
        setProcessingImage(false);
      }
    }
  };

  const handleSubmitProof = async () => {
    if (!proofImage) return;
    setVerifying(true);
    await onVerify(proofText, proofImage);
    setVerifying(false);
    setShowProofInput(false);
    setProofText("");
    setProofImage(null);
  };

  const isInteractive =
    quest.status === TaskStatus.IDLE || quest.status === TaskStatus.RUNNING;
  const isDaily = quest.type === TaskType.DAILY;
  const isArchived =
    quest.status === TaskStatus.COMPLETED || quest.status === TaskStatus.FAILED;

  const statusStyles = {
    [TaskStatus.IDLE]: "border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#0B0E14]",
    [TaskStatus.RUNNING]: "border-system-blue/60 dark:border-system-blue/40 bg-blue-50/30 dark:bg-system-blue/[0.02] shadow-[0_0_15px_rgba(0,162,255,0.05)]",
    [TaskStatus.COMPLETED]: "border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-black opacity-60 grayscale",
    [TaskStatus.FAILED]: "border-red-200 dark:border-red-900/30 bg-red-50/20 dark:bg-red-900/5 opacity-80",
    [TaskStatus.REVIEW]: "border-system-blue/60 dark:border-system-blue/40 bg-blue-50/30 dark:bg-system-blue/[0.02]",
  };

  return (
    <motion.div
      id={`quest-card-${quest.id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        flex flex-col h-full
        snap-center shrink-0 w-[90vw] md:w-full
        relative p-3 md:p-5 rounded-xl border transition-all duration-200
        ${statusStyles[quest.status]}
        ${quest.isPinned ? "ring-1 ring-system-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.05)]" : ""}
      `}
    >
      {/* ... (Quest Card Content - Title, Description, Buttons) ... */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${RANK_COLORS[quest.difficulty]} border-current bg-current/10`}
            >
              {quest.difficulty}
            </span>
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${isDaily ? "text-purple-600 dark:text-purple-400 font-bold" : "text-gray-500"}`}
            >
              {quest.type}
            </span>
            {isDaily && (
              <Zap size={10} className="text-purple-500 fill-current" />
            )}
          </div>

          <div className="flex items-center gap-3">
            {isInteractive && !isDaily && (
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1.5 rounded-lg transition-colors touch-manipulation text-gray-400 dark:text-gray-600 hover:text-system-blue hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Edit Directive"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin();
                  }}
                  className={`p-1.5 rounded-lg transition-colors touch-manipulation ${
                    quest.isPinned
                      ? "text-system-gold bg-yellow-50 dark:bg-yellow-900/20 opacity-100"
                      : "text-gray-400 dark:text-gray-600 hover:text-system-blue hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  title={quest.isPinned ? "Unpin Directive" : "Pin Directive"}
                >
                  <Pin
                    size={16}
                    className={quest.isPinned ? "fill-current" : ""}
                  />
                </button>
                {onPublish && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublish();
                    }}
                    className={`p-1.5 rounded-lg transition-colors touch-manipulation ${
                      quest.isPublic
                        ? "text-green-400 bg-green-50 dark:bg-green-900/20"
                        : "text-gray-400 dark:text-gray-600 hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    title={quest.isPublic ? "Public - Others can see" : "Make Public"}
                  >
                    <Eye size={16} className={quest.isPublic ? "fill-current" : ""} />
                  </button>
                )}
              </div>
            )}

            <div
              className={`px-2 py-1 rounded text-xs font-black font-mono shadow-sm
                    ${quest.status === TaskStatus.FAILED ? "bg-red-100 text-red-600" : "bg-blue-100 text-system-blue dark:bg-blue-900/30 dark:text-blue-200"}`}
            >
              {quest.status === TaskStatus.FAILED
                ? `-${quest.penaltyXP}`
                : `+${quest.xpReward}`}{" "}
              XP
            </div>
          </div>
        </div>

        <h3
          className={`text-base md:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight ${quest.status === TaskStatus.COMPLETED ? "line-through" : ""}`}
        >
          {quest.title}
        </h3>
      </div>

      {isInteractive && (quest.startTime || quest.deadline) && (
        <div className="mb-4 bg-gray-100 dark:bg-black/40 rounded-lg p-3 flex flex-col gap-2 border border-gray-200 dark:border-gray-800/50">
          {quest.startTime && (
            <div className="flex items-center justify-between gap-4 mb-2 md:mb-1">
              <div className="flex items-center gap-2 text-gray-500 shrink-0">
                <Clock size={14} />
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest">
                  Scheduled Start
                </span>
              </div>
              <div className="text-right text-[11px] sm:text-sm font-mono font-bold tracking-tight text-gray-600 dark:text-gray-300 truncate">
                {new Date(quest.startTime).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-400 shrink-0">
              <Timer size={14} />
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest">
                Time Remaining
              </span>
            </div>
            <div
              className={`text-right text-base sm:text-lg md:text-xl font-mono font-bold tracking-tight truncate ${timeLeft === "EXPIRED" ? "text-red-500" : timeColor}`}
            >
              {timeLeft}
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] md:text-sm text-gray-500 dark:text-gray-400 mb-2 font-sans leading-relaxed">
        {quest.description}
      </p>

      {quest.requirements && quest.requirements.length > 0 && isInteractive && (
        <div className="mb-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
            Proof Requirements
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quest.requirements.map((req, i) => (
              <span
                key={i}
                className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700"
              >
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {quest.lastVerificationMessage &&
        quest.verificationAttempts > 0 &&
        quest.status !== TaskStatus.COMPLETED && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded p-3 text-xs text-red-700 dark:text-red-300">
            <div className="font-bold uppercase flex items-center gap-2 mb-1">
              <AlertCircle size={12} /> Verification Failed
            </div>
            <p>{quest.lastVerificationMessage}</p>
          </div>
        )}

      <div className="flex items-center justify-between text-xs font-mono text-gray-500 pt-3 mt-auto">
        {quest.verificationAttempts > 0 &&
          quest.status !== TaskStatus.FAILED && (
            <span className="text-orange-500 flex items-center gap-1">
              <AlertCircle size={10} /> {quest.verificationAttempts}/3 Attempts
              Used
            </span>
          )}
        {isInteractive && quest.deadline && (
          <span
            className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 uppercase tracking-tight bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded"
            title={`Deadline: ${new Date(quest.deadline).toLocaleString()}`}
          >
            <Timer size={10} />
            {new Date(quest.deadline).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            •{" "}
            {new Date(quest.deadline).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {isArchived && quest.completedAt && (
          <span className="flex items-center gap-1 text-gray-400 uppercase tracking-tight">
            <Timer size={10} />
            {new Date(quest.completedAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            •{" "}
            {new Date(quest.completedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {isInteractive && (
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          {quest.status === TaskStatus.IDLE ? (
            <>
              <button
                onClick={onStart}
                className="flex-1 bg-system-blue text-white font-bold text-sm py-3 md:py-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20"
              >
                <Play size={16} className="fill-current" /> INITIATE
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 md:px-6 py-3 md:py-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors active:scale-95 flex items-center justify-center"
                title="Forfeit Directive (-100 Action XP)"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : !showProofInput ? (
            <>
              <button
                onClick={() => setShowProofInput(true)}
                className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm py-3 md:py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-95 shadow-lg"
              >
                <Upload size={16} /> VERIFY
              </button>
              <button
                onClick={onFail}
                className="px-4 md:px-6 py-3 md:py-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors active:scale-95 flex items-center justify-center"
                title="Fail Task (-100 Action XP)"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <div className="w-full bg-gray-50 dark:bg-black/40 rounded-xl p-3 border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2">
              <textarea
                rows={2}
                placeholder="Description (Optional)..."
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 text-sm p-2 outline-none focus:border-system-blue transition-colors mb-2 resize-none"
              />

              {proofImage ? (
                <div className="relative w-full max-h-[200px] mb-3 bg-black/5 dark:bg-white/5 rounded-md overflow-hidden flex items-center justify-center group">
                  <img
                    src={proofImage}
                    alt="Proof"
                    className="h-full w-full object-contain"
                  />
                  <button
                    onClick={() => setProofImage(null)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm hover:bg-red-500 transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mb-3 p-4 border border-dashed border-system-red/30 bg-red-50/10 rounded-lg text-center">
                  <p className="text-[10px] font-bold text-system-red uppercase">
                    Screenshot Proof Mandatory
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processingImage}
                  className={`flex-1 py-3 rounded-md border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-colors ${proofImage ? "border-system-blue/50 text-system-blue" : "border-system-red text-system-red bg-red-50 dark:bg-red-900/10"}`}
                >
                  {processingImage ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Camera size={14} />
                  )}
                  {processingImage
                    ? "OPTIMIZING..."
                    : proofImage
                      ? "RETAKE"
                      : "UPLOAD PROOF"}
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={verifying || !proofImage || processingImage}
                  className="flex-[2] bg-system-blue text-white py-3 rounded-md text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                  {proofImage ? "VERIFY PROOF" : "REQ: IMAGE"}
                </button>
              </div>
              <button
                onClick={() => setShowProofInput(false)}
                className="w-full mt-2 text-[10px] text-gray-400 hover:text-gray-600 py-1"
              >
                CANCEL SUBMISSION
              </button>
            </div>
          )}
        </div>
      )}

      {isArchived && (
        <div className="mt-2 text-right">
          <div className="flex items-center justify-end gap-2">
            {quest.status === TaskStatus.FAILED && onRevive && (
              <button
                onClick={onRevive}
                className="text-xs text-system-blue hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <Zap size={12} /> REVIVE (-20 XP)
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1"
            >
              <Trash2 size={12} /> DELETE RECORD
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl"
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 mx-3 max-w-xs w-full shadow-2xl border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-red-500 text-lg mb-2">
                  <AlertCircle size={32} className="mx-auto" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Forfeit this Directive?
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Are you sure you want to forfeit this directive? You will lose{' '}
                  <span className="font-bold text-red-500">{quest.xpReward || 50} XP</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  NO, KEEP IT
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete();
                  }}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  YES, FORFEIT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const QuestLog: React.FC<QuestLogProps> = ({
  player,
  quests,
  onStartQuest,
  onFailQuest,
  onVerifyProof,
  onAddQuest,
  onChaosSubmit,
  onAcceptChaosPlan,
  onReviveQuest,
  onEditQuest,
  onTogglePin,
  onDeleteQuest,
  onPublishQuest,
  onUpdatePlayer,
  loading,
}) => {
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("SMART");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showJumpMenu, setShowJumpMenu] = useState(false);

  const jumpOptions = [
    { id: "ALL", label: "All Tasks" },
    { id: "URGENT", label: "Urgent (Due Soon)" },
    { id: "MEDIUM", label: "Medium (B/C/A Rank)" },
    { id: "EPIC", label: "Epic (Hardest)" },
    { id: "DAILY", label: "Daily Tasks" }
  ];

  const jumpToTask = (filter: string) => {
    if (!activeQuestsContainerRef.current) return;
    
    if (filter === "ALL") {
       activeQuestsContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
       return;
    }

    const index = activeQuests.findIndex((q) => {
       if (filter === "URGENT") return q.deadline && (q.deadline - Date.now() < 24 * 60 * 60 * 1000);
       if (filter === "MEDIUM") return ['C', 'B', 'A'].includes(q.difficulty);
       if (filter === "EPIC") return ['S', 'X'].includes(q.difficulty);
       if (filter === "DAILY") return q.type === TaskType.DAILY;
       return false;
    });

    if (index !== -1) {
       const targetElement = document.getElementById(`quest-card-${activeQuests[index].id}`);
       const container = activeQuestsContainerRef.current;
       if (targetElement && container) {
           const scrollAmount = targetElement.getBoundingClientRect().left - container.getBoundingClientRect().left;
           container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
       }
    }
  };

  // Archive AI Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);
  const [archiveInsights, setArchiveInsights] = useState("");
  const [filteredArchiveIds, setFilteredArchiveIds] = useState<string[] | null>(null);

  // Edit State
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [revivingQuest, setRevivingQuest] = useState<Quest | null>(null);
  const [reviveStartTime, setReviveStartTime] = useState("");
  const [reviveDeadline, setReviveDeadline] = useState("");
  const [isReviving, setIsReviving] = useState(false);

  // Chaos Mode State
  const [isChaosMode, setIsChaosMode] = useState(true);
  const [proposedPlan, setProposedPlan] = useState<ProposedTaskPlan | null>(null);
  const [isProcessingChaos, setIsProcessingChaos] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(150, Math.max(48, textareaRef.current.scrollHeight))}px`;
    }
  }, [input]);

  const handleSaveEdit = async () => {
    if (!editingQuest) return;
    setIsSavingEdit(true);
    await onEditQuest(editingQuest.id, editTitle, editDesc);
    setIsSavingEdit(false);
    setEditingQuest(null);
  };

  const openReviveModal = (quest: Quest) => {
    const start = roundUpToNextFiveMinutes(Date.now());
    const durationMs = Math.max(30, quest.durationMinutes || 60) * 60 * 1000;
    setRevivingQuest(quest);
    setReviveStartTime(toDateTimeLocalValue(start));
    setReviveDeadline(toDateTimeLocalValue(start + durationMs));
  };

  const handleConfirmRevive = async () => {
    if (!revivingQuest || !onReviveQuest) return;

    const start = new Date(reviveStartTime).getTime();
    const end = new Date(reviveDeadline).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      alert("Please set a valid start time and deadline.");
      return;
    }

    setIsReviving(true);
    try {
      await onReviveQuest(revivingQuest.id, start, end);
      setRevivingQuest(null);
      setReviveStartTime("");
      setReviveDeadline("");
    } finally {
      setIsReviving(false);
    }
  };

  // Archive Sorting
  const [archiveSort, setArchiveSort] = useState<ArchiveSortOption>("RECENT");
  const [showArchiveSort, setShowArchiveSort] = useState(false);
  const [archivePage, setArchivePage] = useState(1);
  const ARCHIVE_PAGE_SIZE = 5;

  // Helper to parse AI insights with simple markdown logic
  const renderFormattedInsights = (text: string) => {
    if (!text || typeof text !== "string") return null;
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />;
      
      // Header 3 (###) Parsing
      if (trimmed.startsWith("###")) {
        const title = trimmed.replace("###", "").trim();
        let Icon = Zap;
        if (title.includes("SUMMARY")) Icon = Activity;
        if (title.includes("PATTERNS")) Icon = Flame;
        if (title.includes("TIMELINE")) Icon = CalendarClock;

        return (
          <div key={i} className="flex items-center gap-2 mt-4 mb-2 first:mt-1">
            <Icon size={14} className="text-system-blue" />
            <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white/50">
              {title}
            </h4>
          </div>
        );
      }
      
      // List Item (-) Parsing
      if (trimmed.startsWith("-")) {
        return (
          <div key={i} className="group flex gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors border-l border-transparent hover:border-system-blue/30 mb-1">
            <span className="text-system-blue opacity-50 font-black mt-0.5">•</span>
            <span className="text-xs sm:text-sm text-gray-300/90 leading-relaxed">
              {trimmed.substring(1).trim()}
            </span>
          </div>
        );
      }
      
      // Standard Text
      return (
        <p key={i} className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-2 px-2 italic border-l-2 border-system-blue/20 ml-1">
          {trimmed}
        </p>
      );
    });
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const deadlineRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Updated Cost
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const XP_COST = 50;
  const canAfford = player.boughtXp >= XP_COST;

  const earnedXp = Math.max(0, player.currentXp - player.boughtXp);

  // Rank Calculation for Counter
  const nextRank = RANK_ORDER[RANK_ORDER.indexOf(player.rank) + 1] || Rank.X;
  const nextThreshold = Number(RANK_TASK_THRESHOLDS[nextRank]) || 100;
  const tasksCompleted = Number(player.totalTasksCompleted) || 0;

  // Active Directives Count
  const activeCount = quests.filter(
    (q) => q.status === TaskStatus.IDLE || q.status === TaskStatus.RUNNING
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !canAfford) return;
    
    if (isChaosMode && onChaosSubmit) {
      setIsProcessingChaos(true);
      const plan = await onChaosSubmit(input);
      if (plan) {
        setProposedPlan(plan);
      }
      setIsProcessingChaos(false);
    } else {
      await onAddQuest(input, startTime || undefined, deadline || undefined);
      setInput("");
      setStartTime("");
      setDeadline("");
      if (textareaRef.current) {
          textareaRef.current.style.height = "48px";
      }
    }
  };

  const handleAvatarUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large. Please use an image under 5MB.");
      return;
    }
    setAvatarLoading(true);
    compressImage(file)
      .then((base64) => {
        try {
          onUpdatePlayer({ avatar: base64 });
        } catch (e) {
          console.error("Failed to update avatar", e);
        }
        setAvatarLoading(false);
      })
      .catch((err) => {
        console.error("Avatar compression failed", err);
        setAvatarLoading(false);
      });
  };

  const getRankValue = (rank: Rank): number => {
    const ranks = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6, X: 7 };
    return ranks[rank] || 0;
  };

  const activeQuests = quests
    .filter(
      (q) => q.status === TaskStatus.IDLE || q.status === TaskStatus.RUNNING
    )
    .sort((a, b) => {
      if (sortBy === "SMART") {
        if (a.type === TaskType.DAILY && b.type !== TaskType.DAILY) return -1;
        if (b.type === TaskType.DAILY && a.type !== TaskType.DAILY) return 1;
        if (a.isPinned === b.isPinned) return 0;
        return a.isPinned ? -1 : 1;
      }
      if (sortBy === "NEWEST") return 0;
      if (sortBy === "URGENT") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline - b.deadline;
      }
      if (sortBy === "HARDEST") {
        return getRankValue(b.difficulty) - getRankValue(a.difficulty);
      }
      return 0;
    });

  if (sortBy === "OLDEST") {
    activeQuests.reverse();
  }

  let historyQuests = quests
    .filter(
      (q) =>
        (q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED) &&
        (filteredArchiveIds ? true : q.isVisibleInLog !== false)
    );

  if (filteredArchiveIds) {
    historyQuests = historyQuests.filter(q => filteredArchiveIds.includes(q.id));
  }

  historyQuests.sort((a, b) => {
      // Use completedAt if available, fallback to startTime
      const timeA = a.completedAt || a.startTime || 0;
      const timeB = b.completedAt || b.startTime || 0;

      if (archiveSort === "RECENT") return timeB - timeA;
      if (archiveSort === "OLDEST") return timeA - timeB;
      if (archiveSort === "FAILED")
        return a.status === TaskStatus.FAILED ? -1 : 1;
      if (archiveSort === "COMPLETED")
        return a.status === TaskStatus.COMPLETED ? -1 : 1;
      if (archiveSort === "HARDEST")
        return getRankValue(b.difficulty) - getRankValue(a.difficulty);
      return 0;
    });

  const sortOptions = [
    { id: "SMART", label: "Smart Sort", icon: Zap },
    { id: "NEWEST", label: "Newest First", icon: ArrowDownUp },
    { id: "OLDEST", label: "Oldest First", icon: History },
    { id: "URGENT", label: "Priority", icon: Timer },
    { id: "HARDEST", label: "Hardest", icon: ArrowUp },
  ];

  // Auto-scroll new tasks
  const activeQuestsContainerRef = useRef<HTMLDivElement>(null);
  const prevQuestsLengthRef = useRef(quests.length);

  useEffect(() => {
    if (quests.length > prevQuestsLengthRef.current) {
      const newestQuestId = quests[0]?.id;
      if (newestQuestId && activeQuestsContainerRef.current) {
        setTimeout(() => {
          const targetElement = document.getElementById(`quest-card-${newestQuestId}`);
          const container = activeQuestsContainerRef.current;
          if (targetElement && container) {
            const scrollAmount = targetElement.getBoundingClientRect().left - container.getBoundingClientRect().left;
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
          }
        }, 150);
      }
    }
    prevQuestsLengthRef.current = quests.length;
  }, [quests]);

  return (
    <div
      className="flex-1 h-full min-h-0 flex flex-col bg-gray-50/50 dark:bg-black"
      onClick={() => {
        setShowSortMenu(false);
        setShowJumpMenu(false);
        setShowArchiveSort(false);
      }}
    >
      {/* ── Scrollable body ───────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 scroll-smooth pb-4">
        <div className="max-w-2xl mx-auto">
        <header className="mb-5 md:mb-8 flex flex-col gap-3 md:gap-4">
          <div className="flex items-start sm:items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Avatar */}
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => avatarInputRef.current?.click()}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm overflow-hidden flex items-center justify-center relative">
                  {avatarLoading ? (
                    <Loader2
                      className="animate-spin text-system-blue"
                      size={20}
                    />
                  ) : player.avatar ? (
                    <img
                      src={player.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-50"
                    />
                  ) : (
                    <User size={24} className="text-gray-400" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white dark:border-black ${RANK_COLORS[player.rank].replace("text-", "bg-")}`}
                ></div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpdate}
                />
              </div>

              {/* Title & Rank */}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2 truncate">
                  {player.name}
                  {/* New Styled Rank Badge */}
                  <div
                    className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded border ${RANK_COLORS[player.rank]} border-current bg-current/10 flex items-center gap-1 uppercase tracking-wider shrink-0`}
                  >
                    <Crown size={10} /> {player.rank}
                  </div>
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                  {player.title}{" "}
                  <span className="text-system-blue ml-1 sm:ml-2">
                    // {activeCount} ACTIVE DIRECTIVES
                  </span>
                </p>
              </div>
            </div>

            {/* Task Counter (NEW) & Sort Menu */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Simple Progress Counter */}
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-gray-500 font-mono uppercase font-bold tracking-wider">
                  Tasks Verified
                </div>
                <div className="text-lg font-mono font-bold text-system-blue">
                  {tasksCompleted}{" "}
                  <span className="text-gray-400 text-sm">
                    / {nextThreshold}
                  </span>
                </div>
              </div>
              
              {/* Jump Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setShowJumpMenu(!showJumpMenu);
                    setShowSortMenu(false);
                  }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-system-blue/30 dark:border-system-blue/20 px-3 py-2 rounded-full text-system-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-[0_0_15px_rgba(0,162,255,0.1)]"
                >
                  <Target size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Jump Filter</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showJumpMenu ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showJumpMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                    >
                      {jumpOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            jumpToTask(opt.id);
                            setShowJumpMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase transition-colors text-left text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400 dark:hover:text-white"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


            </div>
          </div>

          <div className="sm:hidden rounded-2xl border border-black/5 dark:border-white/5 bg-white/80 dark:bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                  Action XP
                </div>
                <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {player.boughtXp} XP
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                  Reward Pool
                </div>
                <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {earnedXp} XP
                </div>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-row items-center gap-2 md:gap-3">
            <div className="flex-1 bg-black/5 dark:bg-white/5 py-1.5 px-2 md:px-3 rounded flex items-center justify-between border border-black/5 dark:border-white/5">
              <span className="text-[8px] md:text-[9px] text-gray-500 uppercase font-mono tracking-wider truncate mr-1">
                Action XP
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${player.boughtXp < 100 ? "bg-red-500 animate-pulse" : "bg-system-blue"}`}
                ></div>
                <span className="font-bold font-mono text-[10px] md:text-xs text-gray-900 dark:text-white">
                  {player.boughtXp} XP
                </span>
              </div>
            </div>
            <div className="flex-1 bg-black/5 dark:bg-white/5 py-1.5 px-2 md:px-3 rounded flex items-center justify-between border border-black/5 dark:border-white/5 opacity-80">
              <span className="text-[8px] md:text-[9px] text-gray-500 uppercase font-mono tracking-wider truncate mr-1">
                Reward Pool
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                <span className="font-bold font-mono text-[10px] md:text-xs text-gray-900 dark:text-white">
                  {earnedXp} XP
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Active Directives List ─────────────────────────────── */}
        <div className="relative group">
          {activeQuests.length > 1 && (
            <button
              onClick={() => {
                const width = activeQuestsContainerRef.current?.offsetWidth || 0;
                activeQuestsContainerRef.current?.scrollBy({ left: -width, behavior: 'smooth' });
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-6 z-10 hidden sm:flex bg-white/90 dark:bg-black/90 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-system-blue p-2 md:p-3 rounded-full shadow-lg backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          
          <div 
            ref={activeQuestsContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800/40 [&::-webkit-scrollbar-thumb]:bg-system-blue/80 [&::-webkit-scrollbar-thumb]:rounded-full transition-all items-stretch"
            style={{ scrollBehavior: "smooth", scrollSnapType: "x mandatory" }}
          >
            <AnimatePresence mode="popLayout">
            {activeQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onStart={() => onStartQuest(quest.id)}
                onFail={() => onFailQuest(quest.id)}
                onVerify={(proof, image) =>
                  onVerifyProof(quest.id, proof, image)
                }
                onTogglePin={() => onTogglePin(quest.id)}
                onDelete={() => onDeleteQuest(quest.id)}
                onEdit={() => {
                  setEditingQuest(quest);
                  setEditTitle(quest.title);
                  setEditDesc(quest.description);
                }}
                onPublish={onPublishQuest ? () => onPublishQuest(quest.id, !quest.isPublic) : undefined}
              />
            ))}
          </AnimatePresence>
          {activeQuests.length === 0 && (
            <div className="w-full text-center py-12 opacity-40 flex flex-col items-center justify-center">
              <Skull size={48} className="mx-auto mb-2" />
              <p className="font-mono text-xs">NO PENDING DIRECTIVES</p>
            </div>
          )}
          </div>

          {activeQuests.length > 1 && (
            <button
              onClick={() => {
                const width = activeQuestsContainerRef.current?.offsetWidth || 0;
                activeQuestsContainerRef.current?.scrollBy({ left: width, behavior: 'smooth' });
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-6 z-10 hidden sm:flex bg-white/90 dark:bg-black/90 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-system-blue p-2 md:p-3 rounded-full shadow-lg backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>



        {/* ... Archive Section ... */}
        {historyQuests.length > 0 && (
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-wider"
              >
                {showHistory ? "Close Archive" : "View Archive"}
                <History size={14} />
              </button>

              {showHistory && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowArchiveSort(!showArchiveSort)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 hover:text-system-blue bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                  >
                    <ListFilter size={12} />
                    SORT: {archiveSort}
                  </button>
                  <AnimatePresence>
                    {showArchiveSort && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 bottom-full mb-2 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden py-1"
                      >
                        {[
                          "RECENT",
                          "OLDEST",
                          "FAILED",
                          "COMPLETED",
                          "HARDEST",
                        ].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setArchiveSort(opt as ArchiveSortOption);
                              setShowArchiveSort(false);
                              setArchivePage(1);
                            }}
                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase hover:bg-gray-100 dark:hover:bg-white/5 ${archiveSort === opt ? "text-system-blue" : "text-gray-500"}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3"
                >
                  {/* AI ARCHIVE SEARCH */}
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-3 mb-4">
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!searchQuery.trim()) { setFilteredArchiveIds(null); setArchiveInsights(""); return; }
                        setIsSearchingArchive(true);
                        try {
                           const archived = quests.filter(q => q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED);
                           const { insights, taskIds } = await searchArchiveWithAI(searchQuery, archived);
                           setArchiveInsights(insights);
                           setFilteredArchiveIds(taskIds);
                           setArchivePage(1);
                        } catch (e) {
                           console.error(e);
                        } finally {
                           setIsSearchingArchive(false);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input 
                         type="text" 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="Ask AI to search past directives (e.g. 'Failed tasks yesterday')"
                         className="flex-1 bg-gray-50 dark:bg-black px-4 py-3 text-sm rounded-lg outline-none border border-gray-200 dark:border-gray-800 focus:border-system-blue transition-colors text-gray-900 dark:text-white placeholder-gray-400"
                      />
                      <button 
                         type="submit" 
                         disabled={isSearchingArchive}
                         className="bg-system-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         {isSearchingArchive ? <Loader2 className="animate-spin" size={16}/> : <Zap size={16}/>}
                         <span className="hidden sm:inline">Search</span>
                      </button>
                      {filteredArchiveIds && (
                        <button 
                          type="button" 
                          onClick={() => { setSearchQuery(""); setFilteredArchiveIds(null); setArchiveInsights(""); setArchivePage(1); }}
                          className="px-3 py-2 bg-red-50 dark:bg-red-900/10 text-system-red border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-bold transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <X size={16}/>
                        </button>
                      )}
                    </form>
                    
                    {archiveInsights && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl group"
                      >
                        {/* Subtle background glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-system-blue/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-system-blue/20 transition-all duration-700" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-system-blue/20 flex items-center justify-center border border-system-blue/30 shadow-[0_0_15px_rgba(0,122,255,0.2)]">
                                <BrainCircuit size={18} className="text-system-blue" />
                              </div>
                              <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-system-blue">Intelligence Report</h3>
                                <p className="text-[9px] text-gray-500 font-mono">ENCRYPTED DATA STREAM_0414</p>
                              </div>
                            </div>
                            <div className="text-[9px] font-mono text-system-blue/40 hidden sm:block">STATUS: ANALYZING</div>
                          </div>

                          <div className="space-y-1">
                            {renderFormattedInsights(archiveInsights)}
                          </div>
                          
                          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex gap-4">
                              <div className="flex items-center gap-1.5 opacity-50">
                                <Activity size={10} className="text-gray-400" />
                                <span className="text-[9px] uppercase font-bold tracking-tighter text-gray-400">Realtime Scan</span>
                              </div>
                              <div className="flex items-center gap-1.5 opacity-50">
                                <BarChart3 size={10} className="text-gray-400" />
                                <span className="text-[9px] uppercase font-bold tracking-tighter text-gray-400">Deep Insights</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded uppercase">VER: 4.5.12</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {historyQuests.length === 0 && archiveInsights ? (
                    <div className="text-center py-8 text-gray-500 font-mono text-sm border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">NO DIRECTIVES MATCHED SYSTEM QUERY.</div>
                  ) : (
                    <>
                      {historyQuests
                        .slice((archivePage - 1) * ARCHIVE_PAGE_SIZE, archivePage * ARCHIVE_PAGE_SIZE)
                        .map((quest) => (
                          <div key={quest.id} className="block mb-3">
                            <QuestCard
                              quest={quest}
                              onStart={() => {}}
                              onFail={() => {}}
                              onVerify={() => {}}
                              onTogglePin={() => {}}
                              onDelete={() => onDeleteQuest(quest.id)}
                              onEdit={() => {}}
                              onRevive={
                                quest.status === TaskStatus.FAILED
                                  ? () => openReviveModal(quest)
                                  : undefined
                              }
                            />
                          </div>
                      ))}
                      
                      {historyQuests.length > ARCHIVE_PAGE_SIZE && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800 mt-4">
                          <button
                            onClick={() => setArchivePage(Math.max(1, archivePage - 1))}
                            disabled={archivePage === 1}
                            className="p-2 text-gray-500 hover:text-system-blue disabled:opacity-30 transition-colors"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          
                          <span className="text-xs font-mono text-gray-500">
                            PAGE {archivePage} OF {Math.ceil(historyQuests.length / ARCHIVE_PAGE_SIZE)}
                          </span>
                          
                          <button
                            onClick={() => setArchivePage(Math.min(Math.ceil(historyQuests.length / ARCHIVE_PAGE_SIZE), archivePage + 1))}
                            disabled={archivePage === Math.ceil(historyQuests.length / ARCHIVE_PAGE_SIZE)}
                            className="p-2 text-gray-500 hover:text-system-blue disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        </div>{/* max-w-2xl */}
      </div>{/* scrollable body */}

      {/* ── AI Processing Overlay (Chaos Mode) ──────────────────── */}
      <AnimatePresence>
        {isProcessingChaos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
          >
            {/* Pulsing ring animations */}
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-32 h-32 rounded-full border border-system-blue/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-24 h-24 rounded-full border border-system-blue/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
              <div className="absolute w-16 h-16 rounded-full border border-system-blue/50 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.6s' }} />
              {/* Core icon */}
              <div className="relative w-14 h-14 rounded-full bg-system-blue/10 border border-system-blue/40 flex items-center justify-center shadow-[0_0_40px_rgba(0,162,255,0.3)]">
                <BrainCircuit size={28} className="text-system-blue animate-pulse" />
              </div>
            </div>

            {/* Scanning bar */}
            <div className="w-64 h-[2px] bg-gray-800 rounded-full overflow-hidden mb-6">
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-system-blue to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              />
            </div>

            <p className="text-white font-black text-base uppercase tracking-[0.3em] mb-2">
              System is structuring task
            </p>
            <p className="text-system-blue/60 text-xs font-mono tracking-widest uppercase animate-pulse">
              AI Processing · Please wait
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Input Bar ──────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 shadow-[0_-2px_20px_rgba(0,0,0,0.12)] px-3 pt-3 pb-8 md:px-6 md:pt-5">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-2"
        >
          {/* Date pills (shown when set) */}
          {(startTime || deadline) && (
            <div className="flex gap-2 flex-wrap">
              {startTime && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-system-blue/10 text-system-blue border border-system-blue/20 px-2 py-0.5 rounded-full">
                  <CalendarClock size={10} />
                  START: {new Date(startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  <button type="button" onClick={() => setStartTime("")} className="ml-1 opacity-60 hover:opacity-100">×</button>
                </span>
              )}
              {deadline && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                  <CalendarCheck size={10} />
                  DUE: {new Date(deadline).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  <button type="button" onClick={() => setDeadline("")} className="ml-1 opacity-60 hover:opacity-100">×</button>
                </span>
              )}
            </div>
          )}

          {/* XP warning */}
          {!canAfford && (
            <div className="text-[10px] text-red-500 font-mono text-center bg-red-900/10 px-3 py-1 rounded-lg border border-red-900/20">
              INSUFFICIENT ACTION XP — STORE RECHARGE REQUIRED
            </div>
          )}

          {/* Main input row — always 2 cols: [input+icons] [send] */}
          <div className="flex items-center gap-2">
            {/* Hidden date inputs */}
            <input ref={startTimeRef} type="datetime-local" value={startTime}
              onChange={(e) => setStartTime(e.target.value)} className="sr-only" tabIndex={-1} />
            <input ref={deadlineRef} type="datetime-local" value={deadline}
              onChange={(e) => setDeadline(e.target.value)} className="sr-only" tabIndex={-1} />

            {/* Input with embedded calendar icon buttons and mode toggle */}
            <div className="relative flex-1 flex flex-col justify-end bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus-within:border-system-blue rounded-2xl transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if(input.trim() && canAfford && !loading) {
                        e.currentTarget.form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                  }
                }}
                placeholder={isChaosMode ? "Describe task in natural language..." : "Assign a new directive…"}
                disabled={loading}
                rows={1}
                className="w-full bg-transparent resize-none pl-12 pr-20 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none leading-relaxed custom-scrollbar"
                style={{ minHeight: "48px" }}
              />

              {/* Mode Toggle — Left Side */}
              <div className="absolute left-2 bottom-1.5 flex items-center">
                <button
                  type="button"
                  onClick={() => setIsChaosMode(!isChaosMode)}
                  title={isChaosMode ? "Switch to Manual Mode" : "Switch to Chaos AI Mode"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isChaosMode
                      ? "bg-system-blue text-white shadow-[0_0_10px_#00A2FF]"
                      : "text-gray-400 hover:text-system-blue hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <BrainCircuit size={16} className={isChaosMode ? "animate-pulse" : ""} />
                </button>
              </div>
              {/* Calendar icon pair — inside right edge of input */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startTimeRef.current?.showPicker?.() ?? startTimeRef.current?.click()}
                  title="Set start time"
                  disabled={isChaosMode}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    startTime
                      ? "text-system-blue bg-system-blue/10"
                      : "text-gray-400 hover:text-system-blue hover:bg-gray-200 dark:hover:bg-gray-800"
                  } ${isChaosMode ? "opacity-30 cursor-not-allowed hover:bg-transparent" : ""}`}
                >
                  <CalendarClock size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => deadlineRef.current?.showPicker?.() ?? deadlineRef.current?.click()}
                  title="Set deadline"
                  disabled={isChaosMode}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    deadline
                      ? "text-red-400 bg-red-500/10"
                      : "text-gray-400 hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                  } ${isChaosMode ? "opacity-30 cursor-not-allowed hover:bg-transparent" : ""}`}
                >
                  <CalendarCheck size={15} />
                </button>
              </div>
            </div>

            {/* Send button — always visible */}
            <button
              type="submit"
              disabled={loading || isProcessingChaos || !input.trim() || !canAfford}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-system-blue hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors shadow-[0_0_12px_rgba(0,162,255,0.4)]"
            >
              {loading || isProcessingChaos ? <Loader2 className="animate-spin" size={16} /> : <SendHorizonal size={16} />}
            </button>
          </div>
          {/* Desktop hint line */}
          <p className="text-center font-black text-xs md:text-sm text-gray-500 dark:text-gray-400 font-mono tracking-wider mt-3 mb-1 uppercase opacity-90 py-2">
            AI auto-generates task details · 50 XP per directive · Review before initiating
          </p>
        </form>
      </div>

      <AnimatePresence>
        {editingQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditingQuest(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Edit size={24} className="text-system-blue" />
                Edit Directive
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-system-blue"
                  placeholder="Task Title"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-system-blue min-h-[100px] resize-none"
                  placeholder="Additional Details (Optional)"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingQuest(null)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim() || isSavingEdit}
                  className="bg-system-blue hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSavingEdit ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revivingQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => !isReviving && setRevivingQuest(null)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-system-blue mb-2">
                  Revive Failed Task
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {revivingQuest.title}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Reschedule this directive with a fresh start time and deadline. Revival costs {REVIVE_XP_COST} Action XP.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <div className="mb-2 text-xs font-mono uppercase tracking-widest text-gray-500">
                    New Start Time
                  </div>
                  <input
                    type="datetime-local"
                    value={reviveStartTime}
                    onChange={(e) => setReviveStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-system-blue"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-xs font-mono uppercase tracking-widest text-gray-500">
                    New Deadline
                  </div>
                  <input
                    type="datetime-local"
                    value={reviveDeadline}
                    onChange={(e) => setReviveDeadline(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-system-blue"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setRevivingQuest(null)}
                  disabled={isReviving}
                  className="px-4 py-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRevive}
                  disabled={isReviving || player.boughtXp < REVIVE_XP_COST}
                  className="rounded-xl bg-system-blue px-5 py-3 font-bold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isReviving ? "Reviving..." : `Revive for ${REVIVE_XP_COST} XP`}
                </button>
              </div>

              {player.boughtXp < REVIVE_XP_COST && (
                <div className="mt-3 text-xs text-red-500 font-mono uppercase tracking-wide">
                  Insufficient Action XP to revive this directive.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Plan Modal */}
      <AnimatePresence>
        {proposedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-system-panel rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Check className="text-system-blue" />
                  Review Execution Plan
                </h2>
                <span className="text-xs font-mono font-bold text-system-blue bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  TOTAL COST:{" "}
                  {proposedPlan.projects.reduce((acc, p) => acc + p.tasks.length, 0) * 80} XP
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {proposedPlan.projects.map((proj, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-[#111620] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
                      {proj.name}
                    </h3>
                    <div className="space-y-2">
                      {proj.tasks.map((task, j) => (
                        <div key={j} className="flex flex-col gap-1 p-3 bg-white dark:bg-black rounded-lg border border-gray-100 dark:border-gray-900">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{task.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                              {task.priority || "NORMAL"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{task.description}</span>
                          <span className="text-[10px] text-gray-400 font-mono mt-1">
                            {task.startTime && <>Start: {new Date(task.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} • </>}
                            Due: {task.deadline ? new Date(task.deadline).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "None"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                     setProposedPlan(null);
                     if(onAcceptChaosPlan) onAcceptChaosPlan(proposedPlan);
                     setInput("");
                  }}
                  disabled={player.boughtXp < proposedPlan.projects.reduce((acc, p) => acc + p.tasks.length, 0) * 80}
                  className="w-full flex-1 bg-system-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-lg active:scale-95 flex items-center justify-center"
                >
                  EXECUTE PLAN
                </button>
                <button
                  onClick={() => setProposedPlan(null)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <X /> CANCEL & REFINE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestLog;

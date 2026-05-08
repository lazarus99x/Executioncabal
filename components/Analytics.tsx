import React from "react";
import {
  Player,
  StatType,
  Rank,
  Quest,
  TaskStatus,
  Currency,
  Transaction,
} from "../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  TrendingUp,
  Target,
  Clock,
  Package,
  Zap,
  ExternalLink,
  Shield,
  Brain,
  Eye,
  Lock,
  Hexagon,
  DollarSign,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  User,
  Crown,
  Loader2,
  Sword,
} from "lucide-react";
import { RANK_COLORS, RANK_ORDER, RANK_TASK_THRESHOLDS } from "../constants";
import { toPng } from "html-to-image";

const StatBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, max, color, icon }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 items-center">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-bold text-white">{value}</span>
    </div>
    <div className="h-2 bg-gray-200 dark:bg-gray-800 w-full overflow-hidden rounded-full">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color} shadow-[0_0_10px_currentColor]`}
      />
    </div>
  </div>
);

// Hexagon Radar Chart for Attributes
const AttributeRadar: React.FC<{
  discipline: number;
  consistency: number;
  focus: number;
}> = ({ discipline, consistency, focus }) => {
  // Simple SVG calculation for a triangle/radar
  const max = 100;
  // Points: Top (Discipline), Bottom Right (Consistency), Bottom Left (Focus)
  // Center: 50, 50
  const d = (discipline / max) * 40;
  const c = (consistency / max) * 40;
  const f = (focus / max) * 40;

  const p1 = `50,${50 - d}`;
  const p2 = `${50 + c * 0.866},${50 + c * 0.5}`;
  const p3 = `${50 - f * 0.866},${50 + f * 0.5}`;

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Background Grid */}
        <polygon
          points="50,10 85,30 85,70 50,90 15,70 15,30"
          fill="none"
          stroke="#333"
          strokeWidth="1"
        />
        <polygon
          points="50,30 67,40 67,60 50,70 33,60 33,40"
          fill="none"
          stroke="#333"
          strokeWidth="1"
        />

        {/* Axis Labels */}
        <text
          x="50"
          y="5"
          textAnchor="middle"
          className="fill-system-blue text-[8px] font-mono font-bold"
        >
          DISCIPLINE
        </text>
        <text
          x="90"
          y="80"
          textAnchor="middle"
          className="fill-green-500 text-[8px] font-mono font-bold"
        >
          CONSISTENCY
        </text>
        <text
          x="10"
          y="80"
          textAnchor="middle"
          className="fill-purple-500 text-[8px] font-mono font-bold"
        >
          FOCUS
        </text>

        {/* Data Shape */}
        <motion.polygon
          initial={{ points: "50,50 50,50 50,50" }}
          animate={{ points: `${p1} ${p2} ${p3}` }}
          transition={{ duration: 1, ease: "easeOut" }}
          fill="rgba(0, 162, 255, 0.3)"
          stroke="#00A2FF"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1 h-1 bg-white rounded-full" />
      </div>
    </div>
  );
};

interface AnalyticsProps {
  player: Player;
  quests?: Quest[];
  transactions?: Transaction[];
  onUseItem?: (instanceId: string, itemId: string) => void;
  currency?: Currency;
}

const Analytics: React.FC<AnalyticsProps> = ({
  player,
  quests = [],
  transactions = [],
  onUseItem,
  currency = "USD",
}) => {
  const maxStat = Math.max(...(Object.values(player.stats) as number[]), 50);
  const inventoryCount = player.inventory?.length || 0;

  const [selectedDay, setSelectedDay] = React.useState<{
    date: string;
    completed: number;
    failed: number;
  } | null>(null);

  const [txPage, setTxPage] = React.useState(1);
  const [logPage, setLogPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;

  // Share Stats Protocol
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = React.useState(false);
  const shareCardRef = React.useRef<HTMLDivElement>(null);

  const generateGraphicInfo = async () => {
    if (!shareCardRef.current) return null;
    setIsGeneratingShare(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
        style: { transform: 'scale(1)' }
      });
      const blob = await (await fetch(dataUrl)).blob();
      return {
        dataUrl,
        file: new File([blob], 'execution-cabal-stats.png', { type: blob.type })
      };
    } catch (e) {
        console.error("Failed to generate image", e);
        alert("Failed to generate stats card.");
        return null;
    } finally {
        setIsGeneratingShare(false);
    }
  };

  const handleShare = async () => {
    const info = await generateGraphicInfo();
    if (!info) return;

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [info.file] })) {
      try {
        await navigator.share({
          title: 'Execution Cabal Stats',
          text: `Level ${player.level} ${player.rank}-Rank on Execution Cabal.`,
          url: 'https://executioncabal.com',
          files: [info.file]
        });
      } catch (e) {
        console.log("Share cancelled or failed");
      }
    } else {
       handleDownloadExplicit(info.dataUrl);
    }
  };

  const handleDownloadExplicit = async (optionalDataUrl?: string) => {
     let url = optionalDataUrl;
     if (!url) {
        const info = await generateGraphicInfo();
        if (info) url = info.dataUrl;
     }

     if (url) {
        const link = document.createElement("a");
        link.download = "execution-cabal-stats.png";
        link.href = url;
        link.click();
     }
  };

  // Calculate Progress based on Tasks
  const nextRank = RANK_ORDER[RANK_ORDER.indexOf(player.rank) + 1] || Rank.X;
  const currentThreshold = RANK_TASK_THRESHOLDS[player.rank];
  const nextThreshold = RANK_TASK_THRESHOLDS[nextRank];

  const tasksNeeded = nextThreshold - player.totalTasksCompleted;

  // Scroll to end of chart on load
  const calendarRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (calendarRef.current) {
      setTimeout(() => {
        if (calendarRef.current) {
          calendarRef.current.scrollLeft = calendarRef.current.scrollWidth;
        }
      }, 100);
    }
  }, []);

  // All-Time Execution Data
  const getDailyStats = () => {
    // Utility to strictly get local YYYY-MM-DD
    const getLocalYYYYMMDD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!quests || quests.length === 0) {
      return [{ date: getLocalYYYYMMDD(today), completed: 0, failed: 0 }];
    }

    // Find earliest completed/created date
    let earliest = today.getTime();
    quests.forEach(q => {
      if (q.completedAt && q.completedAt < earliest) earliest = q.completedAt;
      else if (q.startTime && q.startTime < earliest) earliest = q.startTime;
    });

    const startDate = new Date(earliest);
    startDate.setHours(0, 0, 0, 0);

    // Calculate difference in days strictly avoiding DST issues
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays < 14) diffDays = 14; 

    const daysList = Array.from({ length: diffDays + 1 }, (_, i) => {
      const d = new Date(startDate.getTime());
      d.setDate(startDate.getDate() + i);
      return getLocalYYYYMMDD(d);
    });

    return daysList.map((dateString) => {
      const dayQuests = quests.filter((q) => {
        if (!q.completedAt) return false;
        return getLocalYYYYMMDD(new Date(q.completedAt)) === dateString;
      });

      return {
        date: dateString,
        completed: dayQuests.filter((q) => q.status === TaskStatus.COMPLETED).length,
        failed: dayQuests.filter((q) => q.status === TaskStatus.FAILED).length,
      };
    });
  };

  const dailyStats = getDailyStats();

  // Calculate Net Worth Estimate based on Earned XP
  const earnedXp = Math.max(0, player.currentXp - player.boughtXp);
  const rate = currency === "NGN" ? 2 : 0.003; // Rate per XP
  const netWorth = (earnedXp * rate).toFixed(2);
  const currencySymbol = currency === "NGN" ? "₦" : "$";

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-6xl mx-auto pb-20">
        {/* --- LEVEL PROGRESS SECTION (REMOVED PROGRESS BAR) --- */}
        <section className="mb-12 relative">
          <div className="absolute inset-0 bg-system-blue/5 blur-3xl -z-10" />
          <div className="bg-white/50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 p-6 md:p-8 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                  <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                    System Evaluation
                  </h2>
                  <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-system-blue/10 text-system-blue border border-system-blue/20 hover:bg-system-blue/20 px-2 py-1 rounded transition-colors uppercase">
                    <Share2 size={12} /> Share Protocol
                  </button>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                    LEVEL {player.level}
                  </span>
                  <span
                    className={`text-2xl md:text-3xl font-bold font-mono ${RANK_COLORS[player.rank]} uppercase`}
                  >
                    {player.rank}-RANK
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-xs font-mono text-system-blue font-bold uppercase mb-1">
                  Task Progression
                </div>
                <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white tabular-nums">
                  {player.totalTasksCompleted}{" "}
                  <span className="text-gray-500 text-lg">
                    / {nextThreshold} TASKS
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {tasksNeeded > 0
                    ? `${tasksNeeded} verified completions for promotion`
                    : "MAX RANK ACHIEVED"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* ... Behavioral Matrix and Execution Chart (unchanged) ... */}
          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wide border-b border-gray-800 pb-4">
              <Hexagon size={18} className="text-purple-500" />
              Behavioral Matrix
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <AttributeRadar
                discipline={player.behaviorStats?.discipline || 50}
                consistency={player.behaviorStats?.consistency || 50}
                focus={player.behaviorStats?.focus || 50}
              />
              <div className="space-y-4 flex-1 w-full">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    Discipline
                  </span>
                  <span className="font-bold text-system-blue">
                    {player.behaviorStats?.discipline || 50}/100
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    Consistency
                  </span>
                  <span className="font-bold text-green-500">
                    {player.behaviorStats?.consistency || 50}/100
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    Focus
                  </span>
                  <span className="font-bold text-purple-500">
                    {player.behaviorStats?.focus || 50}/100
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    Est. Net Worth
                  </span>
                  <span className="font-bold text-system-gold">
                    {currencySymbol}
                    {Number(netWorth).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* --- EXECUTION OUTPUT CHART (3D ISOMETRIC) --- */}
          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <TrendingUp size={120} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 uppercase tracking-wide border-b border-gray-800 pb-4 z-10 justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-system-gold" />
                Execution Output (All Time)
              </div>
              <span className="text-[9px] font-mono text-gray-500 font-normal normal-case animate-pulse">
                (Tap bars for details)
              </span>
            </h3>

            {/* 3D Chart Container - Scrollable on Mobile */}
            <div
              ref={calendarRef}
              className="flex-1 w-full overflow-x-auto pb-4 custom-scrollbar z-10 scroll-smooth"
            >
              <div
                className="min-w-fit h-64 flex items-end justify-start gap-4 px-4 pt-10"
              >
                {dailyStats.map((day, i) => {
                  const total = day.completed + day.failed;
                  const maxHeight = 160;
                  const scaleFactor = Math.min(1, total / 5);
                  const barHeight = Math.max(10, scaleFactor * maxHeight);

                  const successRatio = total > 0 ? day.completed / total : 0;
                  const failRatio = total > 0 ? day.failed / total : 0;

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      className="relative flex flex-col items-center group cursor-pointer"
                    >
                      {/* Interaction Indicator (Replaces Tooltip) */}
                      <div className="absolute -top-8 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 z-20">
                        <div className="bg-white dark:bg-system-gold text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <Eye size={10} /> VIEW
                        </div>
                      </div>

                      {/* 2D Minimalist Bar Stack */}
                      <div
                        className="relative w-8 sm:w-10 transition-transform duration-300 group-hover:-translate-y-2 flex flex-col-reverse justify-start rounded-t-md overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                        style={{ height: `${maxHeight}px` }}
                      >
                        {total > 0 && (
                          <motion.div 
                            className="w-full flex-col-reverse flex" 
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight}px` }}
                            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                          >
                            {/* Success Block (Bottom) */}
                            {day.completed > 0 && (
                              <motion.div
                                className="w-full bg-gradient-to-t from-[#0A2E5C] via-system-blue to-cyan-400 shadow-[0_0_20px_rgba(0,162,255,0.7)]"
                                style={{ height: `${successRatio * 100}%`, backgroundSize: "100% 200%" }}
                                animate={{ backgroundPosition: ["50% 0%", "50% 100%", "50% 0%"] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                              ></motion.div>
                            )}

                            {/* Failure Block (Top) */}
                            {day.failed > 0 && (
                              <motion.div
                                className="w-full bg-gradient-to-t from-[#5a0000] via-[#dc2626] to-[#ff2a2a] shadow-[0_0_25px_rgba(255,0,0,0.8)] border-b border-black/50"
                                style={{ height: `${failRatio * 100}%`, backgroundSize: "100% 200%" }}
                                animate={{ backgroundPosition: ["50% 0%", "50% 100%", "50% 0%"] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                              ></motion.div>
                            )}
                          </motion.div>
                        )}
                      </div>

                      <div className="mt-4 text-[9px] md:text-[10px] font-mono font-bold text-gray-500 uppercase flex flex-col items-center leading-tight">
                        <span>
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </span>
                        <span className="text-gray-400 dark:text-gray-600">
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-2 text-[10px] uppercase font-mono font-bold text-gray-500 z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-t from-system-blue to-cyan-400 rounded-sm shadow-[0_0_8px_rgba(0,162,255,0.6)]"></div>
                Verified
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-t from-red-600 to-red-400 rounded-sm shadow-[0_0_8px_rgba(255,59,48,0.6)]"></div>
                Failed
              </div>
            </div>
          </div>

          {/* DAILY ANALYSIS MODAL */}
          <AnimatePresence>
            {selectedDay && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedDay(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <TrendingUp size={100} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-xs font-mono font-bold text-gray-500 uppercase mb-2">
                        Daily Analysis Protocol
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic leading-none">
                            {new Date(selectedDay.date).toLocaleDateString(
                              "en-US",
                              { weekday: "long" }
                            )}
                          </h3>
                          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {new Date(selectedDay.date).toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric", year: "numeric" }
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs font-mono font-bold">
                          <div className="flex items-center gap-2 text-system-blue bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                            <CheckCircle2 size={12} />
                            {selectedDay.completed} COMPLETED
                          </div>
                          <div className="flex items-center gap-2 text-system-red bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                            <XCircle size={12} />
                            {selectedDay.failed} FAILED
                          </div>
                        </div>
                      </div>
                      {/* Insight Badge */}
                      {(() => {
                        const total =
                          selectedDay.completed + selectedDay.failed;
                        let insight = {
                          label: "NO ACTIVITY // STAGNANT",
                          color: "text-gray-500",
                          border: "border-gray-500",
                        };

                        if (total > 0) {
                          const ratio = selectedDay.completed / total;
                          if (ratio >= 0.8)
                            insight = {
                              label: "PROGRESSIVE FLOW // HIGH EFFICIENCY",
                              color: "text-system-blue",
                              border: "border-system-blue",
                            };
                          else if (ratio >= 0.5)
                            insight = {
                              label: "STEADY STATE // MAINTAINING MOMENTUM",
                              color: "text-system-gold",
                              border: "border-system-gold",
                            };
                          else
                            insight = {
                              label: "STALLING // IMMEDIATE ACTION REQUIRED",
                              color: "text-system-red",
                              border: "border-system-red",
                            };
                        }

                        return (
                          <div
                            className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-100 dark:bg-gray-900 border ${insight.border} ${insight.color} text-[10px] font-mono font-bold uppercase`}
                          >
                            <Activity size={12} />
                            {insight.label}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Detailed Task List */}
                  <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                    {/* Get precise tasks for this day */}
                    {(() => {
                      const dayQuests = quests.filter(
                        (q) =>
                          q.completedAt &&
                          new Date(q.completedAt)
                            .toISOString()
                            .split("T")[0] === selectedDay.date
                      );
                      if (dayQuests.length === 0)
                        return (
                          <div className="p-12 text-center text-gray-500 text-sm font-mono flex flex-col items-center gap-2">
                            <Clock size={32} className="opacity-50" />
                            NO ACTIVITY RECORDED
                          </div>
                        );
                      return (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {dayQuests.map((q) => (
                            <div
                              key={q.id}
                              className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                            >
                              <div
                                className={`mt-1 ${q.status === TaskStatus.COMPLETED ? "text-system-blue" : "text-system-red"}`}
                              >
                                {q.status === TaskStatus.COMPLETED ? "✓" : "✗"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-sm font-bold ${q.status === TaskStatus.COMPLETED ? "text-gray-900 dark:text-gray-200" : "text-gray-500 line-through"}`}
                                >
                                  {q.title}
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 mt-1 uppercase flex gap-3 items-center">
                                  <span>Rank: {q.difficulty}</span>
                                  <span>Reward: {q.xpReward} XP</span>
                                  {q.completedAt && (
                                    <span className="flex items-center gap-1 text-gray-500">
                                      <Clock size={10} />
                                      {new Date(
                                        q.completedAt
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-gray-50 dark:bg-black/40 border-t border-gray-200 dark:border-gray-800 text-center">
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-xs font-mono font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase transition-colors"
                    >
                      Dismiss Analysis
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* SHARE STATS MODAL */}
          <AnimatePresence>
             {showShareModal && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowShareModal(false)}>
                     <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-[400px] flex flex-col gap-4 items-center max-h-[90vh] overflow-y-auto custom-scrollbar">
                         
                         {/* Card taking the screenshot */}
                         <div ref={shareCardRef} className="w-full bg-[#0a0a0a] text-white p-4 sm:p-6 relative overflow-hidden border border-gray-800 font-mono shadow-2xl rounded-2xl shrink-0">
                             {/* Background effects */}
                             <div className="absolute inset-0 bg-system-blue/5 blur-3xl pointer-events-none" />
                             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                             
                             {/* Execution Cabal Branding */}
                             <div className="flex justify-between items-center mb-4 sm:mb-6 relative z-10 border-b border-gray-800 pb-3 sm:pb-4">
                                <div className="flex items-center gap-2">
                                   <div className="relative w-8 h-8 flex items-center justify-center drop-shadow-[0_0_8px_rgba(0,162,255,0.4)]">
                                      {/* Arc styling matching the screenshot logo */}
                                      <div className="absolute inset-0 border-[2px] border-system-blue rounded-full border-t-transparent border-b-transparent -rotate-45 opacity-90"></div>
                                      <Sword className="text-system-blue fill-system-blue/20" size={18} />
                                   </div>
                                   <span className="font-bold text-xs sm:text-sm tracking-widest uppercase">Execution Cabal</span>
                                </div>
                                <div className="text-[8px] sm:text-[10px] text-gray-500 font-bold">executioncabal.com</div>
                             </div>

                             {/* User Info */}
                             <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6 relative z-10">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full overflow-hidden border-2 border-system-gold shadow-[0_0_15px_rgba(255,215,0,0.2)] bg-gray-900 flex items-center justify-center">
                                    {player.avatar ? <img src={player.avatar} crossOrigin="anonymous" className="w-full h-full object-cover" /> : <User size={24} className="text-gray-600" />}
                                </div>
                                <div className="min-w-0">
                                   <h2 className="text-lg sm:text-xl font-bold uppercase truncate">{player.name}</h2>
                                   <p className="text-[9px] sm:text-[10px] text-system-blue uppercase truncate tracking-wider">{player.title}</p>
                                   <div className="mt-1 sm:mt-1.5 flex gap-2 w-full overflow-hidden">
                                      <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 bg-gray-900 border border-gray-700 rounded text-gray-300 whitespace-nowrap">LVL {player.level}</span>
                                      <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis"><Crown size={8} className="shrink-0"/> {player.rank} RANK</span>
                                   </div>
                                </div>
                             </div>

                             {/* Quest & Behavior Stats */}
                             <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                 <div className="bg-white/5 p-3 rounded border border-white/10 text-center">
                                     <div className="text-[8px] text-gray-500 uppercase tracking-widest">Tasks Verified</div>
                                     <div className="text-2xl font-bold text-system-blue">{player.totalTasksCompleted}</div>
                                 </div>
                                 <div className="bg-white/5 p-3 rounded border border-white/10 text-center">
                                     <div className="text-[8px] text-gray-500 uppercase tracking-widest">System Focus</div>
                                     <div className="text-2xl font-bold text-purple-400">{player.behaviorStats?.focus || 50}</div>
                                 </div>
                             </div>

                             {/* RPG Stats Mini-bars */}
                             <div className="space-y-2.5 mb-6 relative z-10 bg-black/40 p-3 rounded border border-gray-800">
                                <div className="text-[8px] uppercase text-gray-500 mb-2 font-bold tracking-wider text-center">Attributes Profile</div>
                                {[ 
                                  {l: "STR", v: player.stats.strength, c: "bg-red-500"},
                                  {l: "AGI", v: player.stats.agility, c: "bg-green-500"},
                                  {l: "INT", v: player.stats.intelligence, c: "bg-blue-500"},
                                  {l: "VIT", v: player.stats.vitality, c: "bg-yellow-500"},
                                  {l: "PER", v: player.stats.perception, c: "bg-purple-500"},
                                ].map(s => (
                                   <div key={s.l} className="flex items-center gap-2 text-[9px] font-bold">
                                       <span className="w-8 text-gray-400">{s.l}</span>
                                       <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                          <div className={`h-full ${s.c} rounded-full`} style={{ width: `${Math.min(100, (s.v / maxStat) * 100)}%` }}></div>
                                       </div>
                                       <span className="w-6 text-right text-white">{s.v}</span>
                                   </div>
                                ))}
                             </div>

                             {/* Mini Daily Chart (Last 7 days) */}
                             <div className="relative z-10 border border-gray-800 bg-black/40 p-3 sm:p-4 rounded">
                                 <div className="text-[8px] uppercase text-gray-400 mb-3 sm:mb-4 text-center tracking-widest font-bold">Last 7-days Execution Flow</div>
                                 <div className="flex items-end justify-between h-14 sm:h-16 gap-1 sm:gap-1.5">
                                     {dailyStats.slice(-7).map((day, i) => {
                                         const total = day.completed + day.failed;
                                         const cH = total ? (day.completed / total) * 100 : 0;
                                         const fH = total ? (day.failed / total) * 100 : 0;
                                         const scale = total > 0 ? Math.min(1, total / 5) : 0;
                                         const heightPct = scale > 0 ? scale * 100 : 5;
                                         return (
                                            <div key={day.date + i} className={`flex-1 relative flex flex-col-reverse rounded-t-sm overflow-hidden ${total === 0 ? 'bg-gray-900 border border-gray-800/50' : 'bg-gray-800'}`} style={{ height: `${heightPct}%` }}>
                                                {total > 0 && (
                                                   <>
                                                     <div className="w-full bg-system-blue" style={{ height: `${cH}%` }}></div>
                                                     <div className="w-full bg-red-600 border-b border-black/50" style={{ height: `${fH}%` }}></div>
                                                   </>
                                                )}
                                            </div>
                                         )
                                     })}
                                 </div>
                                 <div className="flex justify-between mt-2 pt-2 border-t border-gray-800 text-[8px] font-bold text-gray-500">
                                     <span>Verified: <span className="text-system-blue">{dailyStats.slice(-7).reduce((acc, obj) => acc + obj.completed, 0)}</span></span>
                                     <span>Failed: <span className="text-red-500">{dailyStats.slice(-7).reduce((acc, obj) => acc + obj.failed, 0)}</span></span>
                                 </div>
                             </div>
                         </div>

                         {/* Action Buttons */}
                         <div className="flex items-center gap-2 w-full shrink-0 mt-1">
                             <button onClick={() => setShowShareModal(false)} className="flex-[0.8] py-3 text-[10px] font-mono font-bold text-gray-400 hover:text-white uppercase transition border border-gray-800 rounded-lg bg-white/5">
                                 X
                             </button>
                             <button onClick={() => handleDownloadExplicit()} disabled={isGeneratingShare} className="flex-1 py-3 text-[11px] font-mono font-bold text-white uppercase transition border border-gray-700 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-1.5 shadow-sm">
                                 <Download size={13} /> Save Image
                             </button>
                             <button onClick={handleShare} disabled={isGeneratingShare} className="flex-[1.5] bg-system-blue hover:bg-blue-600 text-white py-3 rounded-lg text-[11px] font-mono font-bold uppercase transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,162,255,0.4)] hover:shadow-[0_0_25px_rgba(0,162,255,0.6)]">
                                 {isGeneratingShare ? <Loader2 className="animate-spin" size={13} /> : <Share2 size={13} />} 
                                 Export & Share
                             </button>
                         </div>
                     </motion.div>
                 </div>
             )}
          </AnimatePresence>
        </div>

        {/* ... Rest of components (Stat Distribution, Inventory) ... */}
        {/* --- STAT DISTRIBUTION --- */}
        <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 md:p-8 relative overflow-hidden shadow-sm rounded-2xl mb-12">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
            <Activity size={18} className="text-system-blue" />
            RPG Stats
          </h3>

          <div className="relative z-10 space-y-2">
            <StatBar
              label="Strength"
              value={player.stats.strength}
              max={maxStat}
              color="bg-red-500"
              icon={<Shield size={12} className="text-red-500" />}
            />
            <StatBar
              label="Agility"
              value={player.stats.agility}
              max={maxStat}
              color="bg-green-500"
              icon={<Activity size={12} className="text-green-500" />}
            />
            <StatBar
              label="Intelligence"
              value={player.stats.intelligence}
              max={maxStat}
              color="bg-blue-500"
              icon={<Brain size={12} className="text-blue-500" />}
            />
            <StatBar
              label="Vitality"
              value={player.stats.vitality}
              max={maxStat}
              color="bg-yellow-500"
              icon={<Zap size={12} className="text-yellow-500" />}
            />
            <StatBar
              label="Perception"
              value={player.stats.perception}
              max={maxStat}
              color="bg-purple-500"
              icon={<Eye size={12} className="text-purple-500" />}
            />
          </div>
        </div>

        {/* --- INVENTORY SECTION --- */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
              <Package className="text-system-gold" size={24} />
              Artifact Storage
            </h3>
            <div className="bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded text-xs font-mono font-bold text-gray-500">
              COUNT: <span className="text-white">{inventoryCount}</span>
            </div>
          </div>

          {inventoryCount === 0 ? (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center opacity-50">
              <Package size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-sm font-mono text-gray-500">
                STORAGE EMPTY // ACQUIRE ARTIFACTS IN SHOP
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {player.inventory?.map((item) => (
                  <motion.div
                    key={item.instanceId}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden group hover:border-system-gold transition-all relative shadow-sm"
                  >
                    <div className="h-32 bg-black/20 relative overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          {item.content_link ? (
                            <ExternalLink
                              size={32}
                              className="text-system-blue"
                            />
                          ) : (
                            <Zap size={32} className="text-system-gold" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-mono text-white rounded border border-white/10 uppercase">
                        {item.type}
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 h-8 mb-4">
                        {item.description}
                      </p>

                      <button
                        onClick={() =>
                          onUseItem && onUseItem(item.instanceId, item.itemId)
                        }
                        className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-system-blue dark:hover:bg-system-gold hover:text-white dark:hover:text-black text-gray-600 dark:text-gray-300 font-bold text-xs uppercase rounded transition-colors flex items-center justify-center gap-2 active:scale-95"
                      >
                        {item.content_link ? (
                          <>
                            ACCESS <ExternalLink size={12} />
                          </>
                        ) : (
                          <>
                            ACTIVATE <Zap size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* --- FINANCIAL AUDIT TRAIL --- */}
        <section className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-3 mb-6">
            <DollarSign className="text-system-green" size={24} />
            Financial Audit Trail
          </h3>

          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-mono text-xs">
                NO TRANSACTION HISTORY FOUND
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase">
                    <tr>
                      <th className="p-4">Type / Reference</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {transactions
                     .slice((txPage - 1) * ITEMS_PER_PAGE, txPage * ITEMS_PER_PAGE)
                     .map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {tx.type.replace(/_/g, " ")}
                          </div>
                          <div
                            className="text-[10px] text-gray-500 truncate max-w-[150px]"
                            title={tx.reference_id}
                          >
                            REF: {tx.reference_id || "N/A"}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">
                          <div>
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] opacity-70">
                            {new Date(tx.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td
                          className={`p-4 text-right font-bold ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount} XP
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                                ${
                                                  tx.status === "APPROVED"
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                    : tx.status === "PENDING"
                                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                                      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination Controls */}
                {transactions.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-800 font-mono text-[10px]">
                      <button 
                        disabled={txPage === 1}
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        className="flex items-center gap-1 disabled:opacity-30 hover:text-system-blue transition-colors uppercase font-bold"
                      >
                        <ChevronLeft size={14} /> Prev
                      </button>
                      <span className="text-gray-500">
                        PAGE {txPage} OF {Math.ceil(transactions.length / ITEMS_PER_PAGE)}
                      </span>
                      <button 
                        disabled={txPage >= Math.ceil(transactions.length / ITEMS_PER_PAGE)}
                        onClick={() => setTxPage(p => p + 1)}
                        className="flex items-center gap-1 disabled:opacity-30 hover:text-system-blue transition-colors uppercase font-bold"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* --- PERFORMANCE REPORT (ARCHIVED MISSIONS) --- */}
        <section className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-3 mb-6">
            <CheckCircle2 className="text-system-blue" size={24} />
            Performance Report Log
          </h3>

          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm p-4">
             <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 border border-gray-100 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900/50">
                      <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase text-center">Success Rate</div>
                      <div className={`text-2xl font-black ${(quests.filter(q => q.status === TaskStatus.COMPLETED).length / (quests.filter(q => q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED).length || 1)) * 100 >= 80 ? 'text-system-blue' : 'text-system-gold'}`}>
                          {Math.round((quests.filter(q => q.status === TaskStatus.COMPLETED).length / (quests.filter(q => q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED).length || 1)) * 100)}%
                      </div>
                  </div>
                  <div className="text-center p-4 border border-gray-100 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900/50">
                      <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase text-center">Cleared</div>
                      <div className="text-2xl font-black text-gray-900 dark:text-white">{quests.filter(q => q.status === TaskStatus.COMPLETED).length}</div>
                  </div>
                  <div className="text-center p-4 border border-gray-100 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900/50">
                      <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase text-center">Failures</div>
                      <div className="text-2xl font-black text-system-red">{quests.filter(q => q.status === TaskStatus.FAILED).length}</div>
                  </div>
              </div>

              <div className="space-y-2">
                  <h3 className="text-gray-500 dark:text-gray-400 font-bold font-mono text-[10px] mb-4 uppercase">Mission Log</h3>
                  {quests.filter(q => q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED)
                    .sort((a,b) => (b.startTime || 0) - (a.startTime || 0))
                    .slice((logPage - 1) * ITEMS_PER_PAGE, logPage * ITEMS_PER_PAGE)
                    .map((q) => (
                      <div key={q.id} className={`flex items-center justify-between p-3 border-l-2 rounded-r bg-gray-50 dark:bg-gray-900/40 ${q.status === 'COMPLETED' ? 'border-system-blue' : 'border-system-red'}`}>
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded border border-current ${RANK_COLORS[q.difficulty]}`}>{q.difficulty}-RANK</span>
                                  <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{q.title}</h4>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                 <Calendar size={10} />
                                 {q.startTime ? new Date(q.startTime).toLocaleDateString() : 'Unknown Date'}
                              </div>
                          </div>
                          <div className="text-right">
                              <span className={`font-mono font-bold text-[10px] ${q.status === 'COMPLETED' ? 'text-system-blue' : 'text-system-red'}`}>
                                  {q.status === 'COMPLETED' ? `+${q.xpReward} XP` : `-${q.penaltyXP} XP`}
                              </span>
                          </div>
                      </div>
                  ))}
                  
                  {/* Mission Log Pagination Controls */}
                  {quests.filter(q => q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED).length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded font-mono text-[10px] mt-4">
                        <button 
                          disabled={logPage === 1}
                          onClick={() => setLogPage(p => Math.max(1, p - 1))}
                          className="flex items-center gap-1 disabled:opacity-30 hover:text-system-blue transition-colors uppercase font-bold"
                        >
                          <ChevronLeft size={14} /> Prev
                        </button>
                        <span className="text-gray-500">
                          PAGE {logPage} OF {Math.ceil(quests.filter(q => q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED).length / ITEMS_PER_PAGE)}
                        </span>
                        <button 
                          disabled={logPage >= Math.ceil(quests.filter(q => q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED).length / ITEMS_PER_PAGE)}
                          onClick={() => setLogPage(p => p + 1)}
                          className="flex items-center gap-1 disabled:opacity-30 hover:text-system-blue transition-colors uppercase font-bold"
                        >
                          Next <ChevronRight size={14} />
                        </button>
                    </div>
                  )}

                  {quests.filter(q => q.status === TaskStatus.COMPLETED || q.status === TaskStatus.FAILED).length === 0 && (
                      <div className="text-center text-gray-400 dark:text-gray-600 py-6 font-mono text-xs">NO HISTORY RECORDED</div>
                  )}
              </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;

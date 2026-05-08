import React from "react";
import { Player, StatType, Rank } from "../types";
import { RANK_COLORS, RANK_TASK_THRESHOLDS, RANK_ORDER } from "../constants";
import {
  Plus,
  Shield,
  Zap,
  Brain,
  Eye,
  Activity,
  Ban,
  Timer,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import Logo from "./Logo";

interface StatusWindowProps {
  player: Player;
  onUpgradeStat: (stat: StatType) => void;
  className?: string; // Allow custom styling from parent
  collapsed?: boolean;
  onToggle?: () => void;
}

const StatRow: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  canUpgrade: boolean;
  onUpgrade: () => void;
}> = ({ label, value, icon, canUpgrade, onUpgrade }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 hover:bg-black/5 dark:hover:bg-white/5 transition-colors px-2">
    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
      {icon}
      <span className="font-mono text-sm uppercase tracking-wide">{label}</span>
    </div>
    <div className="flex items-center gap-4">
      <span className="font-mono text-gray-900 dark:text-white font-bold text-lg">
        {value}
      </span>
      <button
        onClick={onUpgrade}
        disabled={!canUpgrade}
        className={`w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded 
          ${canUpgrade ? "hover:border-system-blue hover:text-system-blue hover:bg-system-blue/10 cursor-pointer text-gray-400 dark:text-gray-400" : "opacity-20 cursor-not-allowed"}`}
      >
        <Plus size={16} />
      </button>
    </div>
  </div>
);

const StatusWindow: React.FC<StatusWindowProps> = ({
  player,
  onUpgradeStat,
  className = "",
  collapsed = false,
  onToggle,
}) => {
  // Collapsed View
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className={`h-full w-full bg-white dark:bg-system-panel flex flex-col items-center py-4 border-r border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors outline-none ${className}`}
      >
        <div
          className={`text-xl font-bold font-mono ${RANK_COLORS[player.rank]}`}
        >
          {player.rank}
        </div>

        <div className="mt-8 flex-1 flex flex-col items-center justify-center gap-8">
          <div className="[writing-mode:vertical-rl] text-xs font-mono font-bold tracking-[0.3em] text-gray-400 dark:text-gray-500 uppercase rotate-180 flex items-center gap-2">
            <span className="text-system-blue/50">SYSTEM</span> STATUS
          </div>
          {player.availablePoints > 0 && (
            <div
              className="w-2 h-2 rounded-full bg-system-gold animate-pulse"
              title="Points Available"
            />
          )}
        </div>

        <div className="mt-auto mb-4 text-gray-400 dark:text-gray-600">
          <ChevronLeft size={20} />
        </div>
      </button>
    );
  }

  // Banned Overlay
  if (player.isBanned) {
    return (
      <div
        className={`h-full bg-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-red-900/10 animate-pulse" />
        <Ban size={64} className="text-system-red mb-4 relative z-10" />
        <h2 className="text-2xl font-black text-system-red mb-2 relative z-10">
          ACCESS DENIED
        </h2>
        <p className="text-gray-500 font-mono text-sm relative z-10">
          Agent has insufficient XP. <br />
          Account suspended until reset cycle.
        </p>
        <div className="mt-8 p-4 border border-red-900/50 bg-black/50 relative z-10">
          <span className="text-xs text-red-400">
            XP BALANCE: {player.currentXp}
          </span>
        </div>
      </div>
    );
  }

  // Calculate Thresholds for Display Only
  const rankIndex = RANK_ORDER.indexOf(player.rank);
  const nextRank = RANK_ORDER[rankIndex + 1] || Rank.X;
  const nextThreshold = Number(RANK_TASK_THRESHOLDS[nextRank]) || 100;
  const tasksCompleted = Number(player.totalTasksCompleted) || 0;

  // Active Effects Calculation
  const now = Date.now();
  const activeEffects = (player.activeEffects || []).filter(
    (e) => now < e.startTime + e.duration
  );

  return (
    <div
      className={`h-full flex flex-col bg-white dark:bg-system-panel overflow-hidden relative ${className}`}
    >
      {/* Collapse Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute top-2 right-2 z-20 p-1.5 text-gray-400 hover:text-white hover:bg-black/20 rounded transition-colors"
          title="Collapse Status"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Profile Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-system-panel relative overflow-hidden shrink-0">
        <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none">
          <Logo />
        </div>

        <div className="flex justify-between items-start mb-4 relative z-10 pr-6">
          <div className="flex gap-4">
            {/* Small Avatar */}
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0 border-2 border-white dark:border-gray-700 shadow-sm">
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User size={20} />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                {player.name}
                {player.isAdmin && (
                  <span title="Admin Access">
                    <ShieldAlert size={16} className="text-system-red" />
                  </span>
                )}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-mono mt-1">
                {player.title} |{" "}
                <span className="text-system-blue">{player.job}</span>
              </p>
            </div>
          </div>
          <div
            className={`text-4xl font-bold font-mono ${RANK_COLORS[player.rank]}`}
          >
            {player.rank}
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            LEVEL
          </span>
          <span className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
            {player.level}
          </span>
        </div>

        {/* Simplified Task Count (No Bar) */}
        <div className="mt-2 bg-gray-100 dark:bg-black/40 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center font-mono">
            <span className="text-xs text-gray-500 uppercase font-bold">
              Promotion Req.
            </span>
            <div className="text-lg font-bold text-system-blue">
              {player.rank === Rank.X ? (
                <span>MAX RANK</span>
              ) : (
                <span>
                  {tasksCompleted}{" "}
                  <span className="text-gray-500 text-xs">
                    / {nextThreshold}
                  </span>
                </span>
              )}
            </div>
          </div>
          {player.rank !== Rank.X && (
            <div className="text-[10px] text-gray-400 text-right mt-1">
              {Math.max(0, nextThreshold - tasksCompleted)} VERIFIED TASKS
              REMAINING
            </div>
          )}
        </div>
      </div>

      {/* Active Buffs Section */}
      {activeEffects.length > 0 && (
        <div className="px-6 pt-6 pb-2 shrink-0">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Timer size={12} className="text-system-blue" />
            Active System Buffs
          </h3>
          <div className="space-y-2">
            {activeEffects.map((effect) => {
              const timeLeft = Math.max(
                0,
                effect.startTime + effect.duration - now
              );
              const hours = Math.floor(timeLeft / (1000 * 60 * 60));
              const mins = Math.floor(
                (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
              );

              return (
                <div
                  key={effect.id}
                  className="bg-blue-50 dark:bg-system-blue/10 border border-blue-100 dark:border-system-blue/30 rounded p-2 flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${effect.type === "XP_BOOST" ? "bg-system-gold" : "bg-system-blue"} animate-pulse`}
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        {effect.name}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {effect.type === "XP_BOOST"
                          ? `+${effect.value * 100}% XP Gain`
                          : `-${effect.value * 100}% Penalty`}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-system-blue">
                    {hours}h {mins}m
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Stats
          </h3>
          {player.availablePoints > 0 && (
            <span className="text-xs font-mono text-system-gold animate-pulse">
              POINTS: {player.availablePoints}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <StatRow
            label="Strength"
            value={player.stats.strength}
            icon={<Shield size={16} />}
            canUpgrade={player.availablePoints > 0}
            onUpgrade={() => onUpgradeStat(StatType.STR)}
          />
          <StatRow
            label="Agility"
            value={player.stats.agility}
            icon={<Activity size={16} />}
            canUpgrade={player.availablePoints > 0}
            onUpgrade={() => onUpgradeStat(StatType.AGI)}
          />
          <StatRow
            label="Intelligence"
            value={player.stats.intelligence}
            icon={<Brain size={16} />}
            canUpgrade={player.availablePoints > 0}
            onUpgrade={() => onUpgradeStat(StatType.INT)}
          />
          <StatRow
            label="Vitality"
            value={player.stats.vitality}
            icon={<Zap size={16} />}
            canUpgrade={player.availablePoints > 0}
            onUpgrade={() => onUpgradeStat(StatType.VIT)}
          />
          <StatRow
            label="Perception"
            value={player.stats.perception}
            icon={<Eye size={16} />}
            canUpgrade={player.availablePoints > 0}
            onUpgrade={() => onUpgradeStat(StatType.PER)}
          />
        </div>
      </div>
    </div>
  );
};

export default StatusWindow;

import {
  Player,
  Rank,
  StoreItem,
  TaskType,
  TaskStatus,
  ActiveEffect,
  Quest,
} from "./types";

export const RANK_ORDER = [
  Rank.E,
  Rank.D,
  Rank.C,
  Rank.B,
  Rank.A,
  Rank.S,
  Rank.X,
  Rank.SS,
  Rank.SSS,
  Rank.ULTIMA,
];

// Legacy XP Thresholds (still used for reference/Shop)
export const RANK_THRESHOLDS = {
  [Rank.E]: 500,
  [Rank.D]: 1500,
  [Rank.C]: 3500,
  [Rank.B]: 7500,
  [Rank.A]: 15500,
  [Rank.S]: 31500,
  [Rank.X]: Infinity,
};

// NEW: Task Count Thresholds for Ranking Up
export const RANK_TASK_THRESHOLDS = {
  [Rank.E]: 0,
  [Rank.D]: 20,
  [Rank.C]: 30,
  [Rank.B]: 40,
  [Rank.A]: 50,
  [Rank.S]: 75,
  [Rank.X]: 100,
  [Rank.SS]: 150,
  [Rank.SSS]: 250,
  [Rank.ULTIMA]: 500,
};

// RANK TITLES (Solo Leveling Inspired)
export const RANK_TITLES = {
  [Rank.E]: "Novice",
  [Rank.D]: "Scout",
  [Rank.C]: "Vanguard",
  [Rank.B]: "Assassin",
  [Rank.A]: "Ruler",
  [Rank.S]: "Monarch",
  [Rank.X]: "The Executioner",
  [Rank.SS]: "Grandmaster",
  [Rank.SSS]: "Transcendent",
  [Rank.ULTIMA]: "The Singularity",
};

export const INITIAL_PLAYER: Player = {
  name: "Lazarus99X",
  avatar: "",
  level: 1,
  currentXp: 0,
  boughtXp: 0,
  requiredXp: 500,
  rank: Rank.E,
  stats: {
    strength: 5,
    agility: 5,
    intelligence: 5,
    vitality: 5,
    perception: 5,
  },
  behaviorStats: {
    discipline: 50,
    consistency: 50,
    focus: 50,
  },
  availablePoints: 0,
  title: "Novice",
  job: "None",
  isBanned: false,
  isAdmin: false,
  tasksCompletedCurrentRank: 0,
  totalTasksCompleted: 0, // Lifetime count
  totalEarnings: 0,
  activeEffects: [],
  inventory: [],
  lastActiveTimestamp: Date.now(),
};

export const RANK_COLORS = {
  [Rank.E]: "text-gray-400",
  [Rank.D]: "text-green-400",
  [Rank.C]: "text-blue-400",
  [Rank.B]: "text-purple-400",
  [Rank.A]: "text-red-500",
  [Rank.S]: "text-yellow-400",
  [Rank.X]: "text-system-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]",
  [Rank.SS]: "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]",
  [Rank.SSS]: "text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.6)]",
  [Rank.ULTIMA]: "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]",
};

export const SHOP_ITEMS: StoreItem[] = [
  // --- BUFFS ---
  {
    id: "xp_booster_24h",
    name: "System Overclock",
    description: "+10% XP Gain for 24 hours. Stacks duration.",
    cost: 300,
    type: "CONSUMABLE",
    effect: (p) => {
      const currentEffects = p.activeEffects || [];
      const existing = currentEffects.find((e) => e.id === "buff_xp_10");
      const now = Date.now();
      let newEffects = [...currentEffects];

      if (existing) {
        const timeLeft = Math.max(
          0,
          existing.startTime + existing.duration - now
        );
        newEffects = newEffects.map((e) =>
          e.id === "buff_xp_10"
            ? { ...e, startTime: now, duration: timeLeft + 86400000 }
            : e
        );
      } else {
        newEffects.push({
          id: "buff_xp_10",
          name: "System Overclock",
          type: "XP_BOOST",
          value: 0.1,
          startTime: now,
          duration: 86400000,
        });
      }
      return { ...p, activeEffects: newEffects };
    },
  },
  {
    id: "penalty_shield_24h",
    name: "Karma Dampener",
    description: "-50% XP Penalty on failure for 24 hours.",
    cost: 400,
    type: "CONSUMABLE",
    effect: (p) => {
      const now = Date.now();
      const currentEffects = p.activeEffects || [];
      const newEffects = [...currentEffects];
      const existingIndex = newEffects.findIndex(
        (e) => e.id === "buff_penalty_50"
      );
      if (existingIndex >= 0) {
        newEffects[existingIndex] = {
          ...newEffects[existingIndex],
          startTime: now,
          duration: 86400000,
        };
      } else {
        newEffects.push({
          id: "buff_penalty_50",
          name: "Karma Dampener",
          type: "PENALTY_REDUCTION",
          value: 0.5,
          startTime: now,
          duration: 86400000,
        });
      }
      return { ...p, activeEffects: newEffects };
    },
  },

  // --- STATS ---
  {
    id: "str_elixir",
    name: "Elixir of Might",
    description: "Permanently increases Strength by 1.",
    cost: 500,
    type: "CONSUMABLE",
    effect: (p) => ({
      ...p,
      stats: { ...p.stats, strength: p.stats.strength + 1 },
    }),
  },
  {
    id: "int_serum",
    name: "Serum of Insight",
    description: "Permanently increases Intelligence by 1.",
    cost: 500,
    type: "CONSUMABLE",
    effect: (p) => ({
      ...p,
      stats: { ...p.stats, intelligence: p.stats.intelligence + 1 },
    }),
  },
  {
    id: "awakening_potion",
    name: "Awakening Potion",
    description:
      "Forces a partial awakening. Grants 3 unassigned Ability Points.",
    cost: 1500,
    type: "SPECIAL",
    effect: (p) => ({ ...p, availablePoints: p.availablePoints + 3 }),
  },

  // --- UTILITY ---
  {
    id: "freeze",
    name: "Chronos Stasis",
    description: "Extends a task deadline by 1 hour (Passive).",
    cost: 200,
    type: "SPECIAL",
  },
  {
    id: "shadow-extract",
    name: "Shadow Extraction",
    description: "Automate one side-task instantly (One-time use).",
    cost: 1000,
    type: "CONSUMABLE",
  },
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: "protocol-initiation-funding",
    title: "Protocol Initiation: Access Grant",
    description:
      "The system requires skin in the game. Purchase 1,000 Action XP ($5 minimum) to prove commitment and unlock full directive capabilities.",
    type: TaskType.MAIN,
    difficulty: Rank.E,
    xpReward: 500, // High reward to incentivize
    penaltyXP: 0,
    status: TaskStatus.IDLE,
    requirements: ["Purchase 1,000 XP Pack (Starter)"],
    durationMinutes: 60, // Urgent
    verificationAttempts: 0,
    deadline: Date.now() + 86400000, // 24h
    isPinned: true,
  }
];

export const INITIAL_FUNDING_QUEST: Quest = INITIAL_QUESTS[0];

export const SECRET_KNOWLEDGE = [
  "Batch your outreach tasks at 9 AM WAT for 3x engagement.",
  "Deep work sessions of 90 minutes yield 2x results compared to fragmented work.",
  "Automate the repetitive. If you do it 3 times, write a script.",
  "Your energy is currency. Spend it on high-leverage decisions, not micro-management.",
  "Silence is a weapon. In negotiations, speak less to hear more.",
  "Physical strength correlates to mental resilience. Train the body to forge the mind.",
];

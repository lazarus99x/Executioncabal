export enum Rank {
  E = "E",
  D = "D",
  C = "C",
  B = "B",
  A = "A",
  S = "S",
  X = "X", // Zen
}

export type Currency = "USD" | "NGN";

export enum TaskType {
  MAIN = "MAIN",
  SIDE = "SIDE",
  DAILY = "DAILY",
}

export enum TaskStatus {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  REVIEW = "REVIEW",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum StatType {
  STR = "STR",
  AGI = "AGI",
  INT = "INT",
  VIT = "VIT",
  PER = "PER",
}

export type EffectType = "XP_BOOST" | "PENALTY_REDUCTION";

export interface ActiveEffect {
  id: string;
  name: string;
  type: EffectType;
  value: number; // e.g. 0.10 for 10%
  startTime: number;
  duration: number; // in ms
}

export interface InventoryItem {
  instanceId: string;
  itemId: string; // Refers to StoreItem.id
  name: string;
  type: string;
  description: string;
  acquiredAt: number;
  image_url?: string;
  content_link?: string;
}

export interface PlayerStats {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  perception: number;
}

export interface BehaviorStats {
  discipline: number; // 0-100
  consistency: number; // 0-100
  focus: number; // 0-100
}

export interface Player {
  name: string;
  email?: string;
  avatar?: string;
  level: number;
  currentXp: number; // Total Balance (Bought + Earned)
  boughtXp: number; // "Action Credits" - Required for Tasks
  requiredXp: number;
  rank: Rank;
  stats: PlayerStats;
  behaviorStats: BehaviorStats; // New: Behavioral Matrix
  availablePoints: number;
  title: string;
  job: string;
  isBanned: boolean;
  isAdmin?: boolean;
  tasksCompletedCurrentRank: number;
  totalTasksCompleted: number; // New: Lifetime tasks for Ranking
  totalEarnings: number;
  activeEffects: ActiveEffect[];
  inventory: InventoryItem[];
  lastActiveTimestamp: number; // New: For 24h Suspension Logic
  inactivityReminderSent?: boolean; // New: To prevent spamming
  recovery_hash?: string; // New: Passkey (Hashed)
  recovery_generated_at?: number;
  onboarding?: OnboardingData; // New: Onboarding Answers
}

export interface OnboardingData {
  primaryDirective: string; // "What do you do?"
  topObstacle: string; // "What stops you?"
  hourlyRate: string; // "What is your time worth?"
  completedAt: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  difficulty: Rank;
  xpReward: number;
  penaltyXP: number;
  status: TaskStatus;
  requirements: string[];
  durationMinutes: number;
  startTime?: number;
  deadline?: number;
  completedAt?: number; // New: For accurate Analytics
  verificationAttempts: number;
  lastVerificationMessage?: string;
  isPinned?: boolean;
  linkedClientId?: string;
  isVisibleInLog?: boolean;
  oneHourReminderSent?: boolean; // Tracking for Resend Reminders
  thirtyMinReminderSent?: boolean; // Tracking for Resend Reminders
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline?: number;
  completed: boolean;
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  projectDetails: string;
  status: "PROSPECT" | "ACTIVE" | "COMPLETED" | "PAID";
  value: number;
  deadline?: number;
}

export interface ProposedTask {
  id: string;
  title: string;
  description: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  difficulty: Rank;
  xpCost: number;
  startTime?: string;
  deadline?: string;
  requirements: string[];
  durationMinutes: number;
  projectName?: string;
  dependencies?: string[];
}

export interface ProposedTaskPlan {
  id: string;
  projects: {
    name: string;
    tasks: ProposedTask[];
  }[];
  totalXpCost: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface ChatMessage {
  id: string;
  sender: "USER" | "SYSTEM";
  text: string;
  timestamp: number;
  proposedQuest?: Quest;
  proposedPlan?: ProposedTaskPlan;
}

export interface SystemNotification {
  id: string;
  message: string;
  type:
    | "INFO"
    | "WARNING"
    | "SUCCESS"
    | "LEVEL_UP"
    | "ITEM_OBTAINED"
    | "FAILURE"
    | "PAYMENT";
  timestamp: number;
}

export interface StoreCategory {
  id: string;
  name: string;
  description?: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: string;
  image_url?: string;
  content_link?: string;
  effect?: (player: Player) => Player;
}

export interface Transaction {
  id: string;
  username: string;
  type:
    | "PURCHASE_XP"
    | "WITHDRAWAL"
    | "STORE_BUY"
    | "SYSTEM_BONUS"
    | "SYSTEM_FEE"
    | "PENALTY_DEDUCTION"
    | "TASK_REWARD";
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reference_id?: string;
  created_at: string;
  metadata?: any; // New: For session logs/details
}

export interface SystemLog {
  id: string;
  username: string;
  event_type:
    | "LOGIN"
    | "LOGOUT"
    | "PURCHASE"
    | "WITHDRAWAL"
    | "BAN"
    | "ADMIN_ACTION"
    | "TASK_EXECUTION"
    | "SUSPENSION";
  ip_address: string;
  country: string;
  details: string;
  created_at: string;
  session_duration?: number; // New
}

export type ViewType =
  | "QUESTS"
  | "STORE"
  | "CHECKOUT"
  | "ANALYTICS"
  | "GOALS"
  | "CLIENTS"
  | "REPORTS"
  | "SETTINGS"
  | "PROFILE"
  | "ADMIN"
  | "FRAMEWORK"
  | "ORGANIZER";

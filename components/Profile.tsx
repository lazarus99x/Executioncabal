import React, { useState, useRef } from "react";
import { Player, Quest, TaskStatus } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  Key,
  Award,
  TrendingUp,
  TrendingDown,
  Activity,
  Save,
  Loader2,
  User,
  Mail,
  CheckCircle,
  Camera,
  Upload,
  Wallet,
  DollarSign,
  Edit2,
  X,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Download,
  Moon,
  Sun,
} from "lucide-react";
import { RANK_COLORS } from "../constants";
import { updateUserEmail, savePlayerData, renameUser } from "../lib/supabase";

interface ProfileProps {
  player: Player;
  quests: Quest[];
  onUpdatePassword: (password: string) => Promise<void>;
  onUpdatePlayer?: (u: Partial<Player>) => void;
  onResetData?: () => void;
  onExportData?: () => void;
  isOnline?: boolean;
  lastSynced?: number;
  theme?: "light" | "dark";
  toggleTheme?: () => void;
}

const Profile: React.FC<ProfileProps> = ({
  player,
  quests,
  onUpdatePassword,
  onUpdatePlayer,
  onResetData,
  onExportData,
  isOnline = false,
  lastSynced = 0,
  theme = "dark",
  toggleTheme,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailInput, setEmailInput] = useState(player.email || "");
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [msg, setMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // EDIT NAME & MIGRATION STATE
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<
    "IDLE" | "PROCESSING" | "COMPLETE" | "ERROR"
  >("IDLE");
  const [migrationLog, setMigrationLog] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const completed = quests.filter((q) => q.status === TaskStatus.COMPLETED);
  const failed = quests.filter((q) => q.status === TaskStatus.FAILED);
  const activeCount = quests.filter(
    (q) => q.status === TaskStatus.IDLE || q.status === TaskStatus.RUNNING
  ).length;
  const total = completed.length + failed.length;
  const winRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
  const earnedXp = Math.max(0, player.currentXp - player.boughtXp);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword.length < 6) {
      setMsg({
        text: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await onUpdatePassword(newPassword);
      setMsg({
        text: "Security credentials updated successfully.",
        type: "success",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMsg({ text: "Update failed. Check connection.", type: "error" });
    }
    setLoading(false);
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    if (!emailInput || !emailInput.includes("@")) {
      setEmailMsg({ text: "Invalid email format.", type: "error" });
      return;
    }

    setEmailLoading(true);
    try {
      await updateUserEmail(player.name, emailInput);
      setEmailMsg({ text: "Communication channel verified.", type: "success" });
    } catch (e: any) {
      setEmailMsg({ text: "Update failed. " + e.message, type: "error" });
    }
    setEmailLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Max 2MB.");
      return;
    }

    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const updatedPlayer = { ...player, avatar: base64 };
        await savePlayerData(player.name, updatedPlayer);
        if (onUpdatePlayer) onUpdatePlayer({ avatar: base64 });
      } catch (e) {
        console.error("Avatar upload failed", e);
      }
      setAvatarLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleNameEditClick = () => {
    setIsEditingName(true);
    setNameInput(player.name);
  };

  const validateNameChange = () => {
    const newName = nameInput.trim();

    if (!newName) {
      alert("Codename cannot be empty.");
      return;
    }

    if (newName === player.name) {
      // Visual feedback that nothing changed
      setIsEditingName(false);
      // Optional toast or small notification could go here
      return;
    }

    // Open the Confirmation Modal instead of browser confirm
    setShowMigrationModal(true);
    setMigrationStatus("IDLE");
    setMigrationLog([]);
  };

  const executeMigration = async () => {
    const newName = nameInput.trim();
    setMigrationStatus("PROCESSING");
    setMigrationLog(["Initializing Protocol..."]);

    try {
      await renameUser(player.name, newName, (step) => {
        setMigrationLog((prev) => [...prev, step]);
      });

      setMigrationLog((prev) => [...prev, "Updating Local Session..."]);
      localStorage.setItem("cabal_current_user", newName);

      setMigrationStatus("COMPLETE");
      // Wait a moment for the user to see the success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setMigrationStatus("ERROR");
      setMigrationLog((prev) => [...prev, `CRITICAL FAILURE: ${e.message}`]);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden flex items-center justify-center">
                {avatarLoading ? (
                  <Loader2 className="animate-spin text-system-blue" />
                ) : player.avatar ? (
                  <img
                    src={player.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-system-blue text-white rounded-full shadow-md hover:scale-110 transition-transform"
                title="Change Avatar"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-3">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="bg-white dark:bg-black border border-system-blue rounded px-2 py-1 text-2xl font-black uppercase italic tracking-tighter outline-none w-full max-w-[300px]"
                      autoFocus
                      onKeyDown={(e) =>
                        e.key === "Enter" && validateNameChange()
                      }
                    />
                    <button
                      onClick={validateNameChange}
                      className="text-green-500 hover:text-green-400 p-1 bg-green-500/10 rounded"
                    >
                      <CheckCircle size={24} />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setNameInput(player.name);
                      }}
                      className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded"
                    >
                      <X size={24} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-none mb-1">
                      {player.name}
                    </h1>
                    <button
                      onClick={handleNameEditClick}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-system-blue p-1"
                      title="Rename Code Name (Full Migration)"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-mono text-sm uppercase">
                {player.title} //{" "}
                <span className="text-system-blue">
                  {activeCount} ACTIVE DIRECTIVES
                </span>
              </p>
            </div>
          </div>

          <div
            className={`text-4xl font-bold font-mono ${RANK_COLORS[player.rank]}`}
          >
            RANK {player.rank}
          </div>
        </header>

        {/* --- IDENTITY MIGRATION MODAL --- */}
        <AnimatePresence>
          {showMigrationModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-[#0F1115] border border-system-red rounded-xl overflow-hidden shadow-2xl relative"
              >
                <div className="p-6 border-b border-gray-800 flex items-center gap-3 bg-red-900/10">
                  <AlertTriangle
                    size={24}
                    className="text-system-red animate-pulse"
                  />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                    Identity Migration Protocol
                  </h2>
                </div>

                <div className="p-6">
                  {migrationStatus === "IDLE" && (
                    <>
                      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                        You are about to rename your Agent Codename from{" "}
                        <strong className="text-white">{player.name}</strong> to{" "}
                        <strong className="text-system-blue">
                          {nameInput}
                        </strong>
                        .
                      </p>
                      <div className="bg-red-950/30 border border-red-900/50 p-3 rounded mb-6 text-xs text-red-200 font-mono">
                        WARNING: This will migrate your Login ID, Quests, Goals,
                        and Financial History to a new database record. Your old
                        identity will be burned.
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowMigrationModal(false)}
                          className="flex-1 py-3 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase"
                        >
                          Abort
                        </button>
                        <button
                          onClick={executeMigration}
                          className="flex-1 py-3 rounded bg-system-red hover:bg-red-600 text-white font-bold text-xs uppercase flex items-center justify-center gap-2"
                        >
                          Execute Migration <ArrowRight size={14} />
                        </button>
                      </div>
                    </>
                  )}

                  {(migrationStatus === "PROCESSING" ||
                    migrationStatus === "COMPLETE" ||
                    migrationStatus === "ERROR") && (
                    <div className="space-y-4">
                      <div className="h-48 bg-black border border-gray-800 rounded p-4 overflow-y-auto font-mono text-[10px] text-green-500 custom-scrollbar">
                        {migrationLog.map((log, i) => (
                          <div key={i} className="mb-1">
                            <span className="opacity-50">
                              [{new Date().toLocaleTimeString()}]
                            </span>{" "}
                            {log}
                          </div>
                        ))}
                        {migrationStatus === "PROCESSING" && (
                          <div className="animate-pulse">_</div>
                        )}
                      </div>

                      {migrationStatus === "COMPLETE" ? (
                        <div className="text-center text-green-500 font-bold text-sm uppercase animate-pulse">
                          Migration Successful. Rebooting System...
                        </div>
                      ) : migrationStatus === "ERROR" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowMigrationModal(false)}
                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-xs uppercase"
                          >
                            Close
                          </button>
                          <button
                            onClick={executeMigration}
                            className="flex-1 py-3 bg-system-red hover:bg-red-600 text-white rounded font-bold text-xs uppercase"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <Loader2
                            size={24}
                            className="animate-spin text-system-blue"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-4 rounded relative overflow-hidden group shadow-sm">
                <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors" />
                <div className="relative z-10">
                  <div className="text-gray-500 dark:text-gray-500 text-[10px] font-mono uppercase mb-1">
                    Total Completions
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award size={18} className="text-system-blue" />
                    {completed.length}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-4 rounded relative overflow-hidden group shadow-sm">
                <div className="absolute inset-0 bg-red-50 dark:bg-red-900/10 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors" />
                <div className="relative z-10">
                  <div className="text-gray-500 dark:text-gray-500 text-[10px] font-mono uppercase mb-1">
                    Failed Missions
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingDown size={18} className="text-system-red" />
                    {failed.length}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-4 rounded relative overflow-hidden group shadow-sm">
                <div className="absolute inset-0 bg-yellow-50 dark:bg-yellow-900/10 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/20 transition-colors" />
                <div className="relative z-10">
                  <div className="text-gray-500 dark:text-gray-500 text-[10px] font-mono uppercase mb-1">
                    Win Rate
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity
                      size={18}
                      className="text-yellow-600 dark:text-system-gold"
                    />
                    {winRate}%
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-4 rounded relative overflow-hidden group shadow-sm">
                <div className="absolute inset-0 bg-green-50 dark:bg-green-900/10 group-hover:bg-green-100 dark:group-hover:bg-green-900/20 transition-colors" />
                <div className="relative z-10">
                  <div className="text-gray-500 dark:text-gray-500 text-[10px] font-mono uppercase mb-1">
                    Net Worth (Est)
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign
                      size={18}
                      className="text-green-600 dark:text-green-400"
                    />
                    ${(earnedXp * 0.003).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial History Breakdown */}
            <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/40">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Wallet size={16} className="text-system-blue" />
                  Execution Ledger
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {total === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-mono text-sm">
                    No recorded history.
                  </div>
                ) : (
                  [...completed, ...failed]
                    .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
                    .slice(0, 15)
                    .map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RANK_COLORS[q.difficulty]} border-current opacity-70`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                              {q.title}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {q.startTime
                              ? new Date(q.startTime).toLocaleDateString()
                              : "Unknown"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-mono font-bold ${q.status === "COMPLETED" ? "text-system-blue" : "text-system-red"}`}
                          >
                            {q.status === "COMPLETED" ? "+" : "-"}
                            {q.status === "COMPLETED"
                              ? q.xpReward
                              : q.penaltyXP}{" "}
                            XP
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                            {q.status}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Security */}
          <div className="bg-gray-100 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 p-6 rounded h-fit">
            <h3 className="text-gray-900 dark:text-white font-bold mb-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
              <Shield size={18} className="text-system-blue" />
              Security Protocol
            </h3>

            <form
              onSubmit={handleEmailUpdate}
              className="space-y-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800"
            >
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">
                  Communication Channel (Email)
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3 text-gray-500 dark:text-gray-600"
                    size={14}
                  />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:border-system-blue outline-none transition-colors"
                    placeholder="agent@cabal.com"
                  />
                </div>
              </div>

              {emailMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs p-2 border rounded flex items-center gap-2 ${emailMsg.type === "success" ? "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"}`}
                >
                  {emailMsg.type === "success" ? (
                    <CheckCircle size={12} />
                  ) : (
                    <Shield size={12} />
                  )}
                  {emailMsg.text}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-bold uppercase text-xs py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                {emailLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                Update Email Uplink
              </button>
            </form>

            {/* PASSKEY GENERATION */}
            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-100 dark:border-blue-900/50 mb-4">
                <div className="flex items-start gap-3">
                  <Key className="text-system-blue mt-1" size={16} />
                  <div>
                    <h4 className="text-xs font-bold text-system-blue uppercase mb-1">
                      Backup Passkey
                    </h4>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      Generate a "Master Key" to regain access if you lose your
                      password. Store it offline. It is shown only once.
                    </p>
                  </div>
                </div>
              </div>

              {msg && msg.text.startsWith("PASSKEY") ? (
                <div className="bg-system-gold text-black p-4 rounded font-mono text-center mb-4">
                  <div className="text-[10px] font-bold uppercase mb-2 opacity-70">
                    Your New Passkey
                  </div>
                  <div className="text-xl font-black tracking-widest select-all bg-white/20 p-2 rounded">
                    {msg.text.split(":")[1]}
                  </div>
                  <div className="text-[9px] mt-2 font-bold uppercase">
                    COPY THIS NOW. IT CANNOT BE RECOVERED.
                  </div>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    if (
                      !confirm(
                        "Generate new Passkey? This invalidates any old keys."
                      )
                    )
                      return;
                    const rawKey = `CABAL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                    // Hash it
                    const encoder = new TextEncoder();
                    const data = encoder.encode(rawKey);
                    const hashBuffer = await crypto.subtle.digest(
                      "SHA-256",
                      data
                    );
                    const hash = Array.from(new Uint8Array(hashBuffer))
                      .map((b) => b.toString(16).padStart(2, "0"))
                      .join("");

                    // Save Hash via onUpdatePlayer
                    const updated = {
                      ...player,
                      recovery_hash: hash,
                      recovery_generated_at: Date.now(),
                    };
                    // Using savePlayerData directly or onUpdatePlayer
                    // onUpdatePlayer is better for state sync
                    if (onUpdatePlayer) {
                      onUpdatePlayer(updated);
                      // Also force a save to DB
                      await savePlayerData(player.name, updated);
                    }
                    setMsg({ text: `PASSKEY:${rawKey}`, type: "success" });
                  }}
                  className="w-full bg-system-blue/10 hover:bg-system-blue/20 text-system-blue border border-system-blue/50 font-bold uppercase text-xs py-3 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Key size={14} /> Generate New Passkey
                </button>
              )}
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">
                  New Security Key
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3 text-gray-500 dark:text-gray-600"
                    size={14}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:border-system-blue outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">
                  Verify Key
                </label>
                <div className="relative">
                  <Key
                    className="absolute left-3 top-3 text-gray-500 dark:text-gray-600"
                    size={14}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:border-system-blue outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {msg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs p-2 border rounded flex items-center gap-2 ${msg.type === "success" ? "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"}`}
                >
                  {msg.type === "success" ? (
                    <User size={12} />
                  ) : (
                    <Shield size={12} />
                  )}
                  {msg.text}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-system-blue text-white dark:text-black font-bold uppercase text-xs py-3 rounded hover:bg-blue-600 dark:hover:bg-white transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                Update Credentials
              </button>
            </form>
          </div>
          
          {/* Settings / Configuration (Merged from Settings.tsx) */}
          <div className="bg-gray-100 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 p-6 rounded h-fit mt-6">
            <h3 className="text-gray-900 dark:text-white font-bold mb-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
              {theme === "dark" ? <Moon size={18} className="text-system-blue" /> : <Sun size={18} className="text-system-gold" />}
              System Configuration
            </h3>

            {/* Theme Setting */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <div className="text-xs font-mono text-gray-500 uppercase">Current Theme</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white uppercase">{theme} MODE</div>
              </div>
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="relative w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600 transition-colors p-0.5 shadow-sm"
                >
                  <motion.div
                    initial={false}
                    animate={{ x: theme === "dark" ? 24 : 0 }}
                    className={`w-5 h-5 rounded-full shadow-md ${theme === "dark" ? "bg-system-blue" : "bg-system-gold"}`}
                  />
                </button>
              )}
            </div>

            {/* Network Sync */}
            <div className="mb-6 border-t border-gray-200 dark:border-gray-800 pt-6">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={14} className={isOnline ? "text-system-green" : "text-gray-500"} />
                <span className="text-xs font-mono font-bold text-gray-500 uppercase">Network Status</span>
              </div>
              <div className={isOnline ? "text-sm text-green-600 dark:text-green-400 font-bold" : "text-sm text-red-600 dark:text-red-400 font-bold"}>
                  {isOnline ? "ONLINE - SERVER SYNCED" : "OFFLINE - LOCAL MODE ONLY"}
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-1">
                  LAST SYNC: {lastSynced ? new Date(lastSynced).toLocaleTimeString() : "NEVER"}
              </div>
            </div>

            {/* Data Export */}
            <div className="mb-6 border-t border-gray-200 dark:border-gray-800 pt-6">
              <button onClick={onExportData} className="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-white dark:hover:text-black text-gray-900 dark:text-white px-4 py-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
                  <Download size={16} /> EXPORT DATA BACKUP
              </button>
            </div>

            {/* Danger Zone: Wipe */}
            <div className="border border-red-200 dark:border-red-900/30 rounded p-4 relative overflow-hidden mt-6 bg-red-50 dark:bg-red-900/10">
              <h4 className="text-system-red font-bold mb-2 flex items-center gap-2 text-xs uppercase">
                  <AlertTriangle size={14} /> Critical Wipe
              </h4>
              <p className="text-[10px] text-red-800 dark:text-red-300 mb-4 font-mono leading-relaxed">
                  Initiating a full wipe destroys all local save data, including progress and credentials.
              </p>
              
              {!confirmReset ? (
                  <button 
                      onClick={() => setConfirmReset(true)}
                      className="bg-red-100 dark:bg-red-900/50 hover:bg-system-red text-red-900 dark:text-red-100 hover:text-white border border-red-300 dark:border-system-red px-4 py-2 rounded-lg font-bold font-mono text-[10px] uppercase transition-colors w-full active:scale-95 text-center"
                  >
                      Wipe System Memory
                  </button>
              ) : (
                  <div className="flex flex-col gap-2 animate-pulse">
                      <span className="text-system-red font-bold uppercase text-[10px] text-center">Confirm Permanent Wipe?</span>
                      <div className="flex gap-2 w-full">
                          <button 
                              onClick={() => setConfirmReset(false)}
                              className="flex-1 bg-gray-300 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-2 rounded text-[10px] font-bold"
                          >
                              CANCEL
                          </button>
                          <button 
                              onClick={onResetData}
                              className="flex-1 bg-system-red hover:bg-red-600 text-white dark:text-black py-2 rounded text-[10px] font-bold"
                          >
                              CONFIRM
                          </button>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

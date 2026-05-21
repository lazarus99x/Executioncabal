import React, { useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";
import {
  Loader2,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { INITIAL_PLAYER } from "../constants";
import { sha256 as fallbackSha256 } from "../lib/crypto";

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hashPassword = async (text: string): Promise<string> => {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hash = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } catch (e) {
        console.warn("Crypto API Failed, using fallback:", e);
      }
    }

    return await fallbackSha256(text);
  };

  const getLockoutTime = () => {
    const lockout = localStorage.getItem("auth_lockout");
    if (!lockout) return 0;
    return parseInt(lockout, 10);
  };

  const recordAttempt = (success: boolean) => {
    if (success) {
      localStorage.removeItem("auth_failures");
      localStorage.removeItem("auth_lockout");
    } else {
      const failures =
        parseInt(localStorage.getItem("auth_failures") || "0", 10) + 1;
      localStorage.setItem("auth_failures", failures.toString());
      if (failures >= 5) {
        const lockoutEnd = Date.now() + 30 * 1000;
        localStorage.setItem("auth_lockout", lockoutEnd.toString());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const lockoutEnd = getLockoutTime();
    if (Date.now() < lockoutEnd) {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      setError(`Too many attempts. Try again in ${remaining}s.`);
      return;
    }

    setLoading(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
      const inputHash = await hashPassword(cleanPassword);

      if (isRegistering) {
        const { data: existing, error: checkError } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") throw checkError;
        if (existing) throw new Error("That username is already taken.");
        if (cleanUsername.length < 3) throw new Error("Username is too short.");

        const { error: insertError } = await supabase.from("profiles").insert([
          {
            username: cleanUsername,
            password: inputHash,
            email: email.trim() || null,
            player_data: {
              ...INITIAL_PLAYER,
              name: cleanUsername,
              email: email.trim() || "",
              currentXp: 0,
            },
          },
        ]);

        if (insertError) throw insertError;

        if (email.trim()) {
          fetch("/api/email/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              username: cleanUsername,
            }),
          }).catch((err) =>
            console.error("Onboarding Email Trigger Failed:", err)
          );
        }

        recordAttempt(true);
        onLogin(cleanUsername);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("username, password, player_data")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        recordAttempt(false);
        throw new Error("Username not found.");
      }

      const storedPassword = data.password || "";
      const playerData = data.player_data || {};
      const recoveryHash = playerData.recovery_hash;

      let authenticated = false;
      let migrationNeeded = false;

      if (storedPassword === inputHash) {
        authenticated = true;
      } else if (storedPassword === cleanPassword) {
        authenticated = true;
        migrationNeeded = true;
      } else if (recoveryHash && recoveryHash === inputHash) {
        authenticated = true;
      }

      if (!authenticated) {
        recordAttempt(false);
        throw new Error("Invalid password or master key.");
      }

      if (migrationNeeded) {
        await supabase
          .from("profiles")
          .update({ password: inputHash })
          .eq("username", cleanUsername);
      }

      recordAttempt(true);
      onLogin(data.username || cleanUsername);
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (!navigator.onLine || err.message?.includes("fetch")) {
        if (localStorage.getItem(`cabal_data_${cleanUsername}`)) {
          onLogin(cleanUsername);
        } else {
          setError("System offline and no local account cache found.");
        }
      } else {
        setError(err.message || "Unable to continue.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center relative overflow-hidden px-4 py-6 sm:px-6 sm:py-10">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-50 via-transparent to-transparent dark:from-system-blue/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg z-10"
      >
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <Logo className="mb-4 scale-110 sm:scale-125" />
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic text-center">
            EXECUTION <span className="text-system-blue">CABAL</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-[1px] w-8 bg-system-blue"></div>
            <span className="text-[10px] sm:text-xs font-mono text-system-blue tracking-[0.3em] uppercase">
              Welcome
            </span>
            <div className="h-[1px] w-8 bg-system-blue"></div>
          </div>
          <p className="mt-3 max-w-md text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            A simple sign up. Pick a username, add a password or master key, and get into the system.
          </p>
        </div>

        <div className="bg-white dark:bg-system-panel/80 border border-gray-200 dark:border-gray-800 backdrop-blur-md p-5 sm:p-8 relative overflow-hidden shadow-lg rounded-2xl">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-system-blue"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-system-blue"></div>

          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {isRegistering ? "Create your account" : "Sign in"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isRegistering
                ? "Use your email for onboarding, reminders, and reports, then choose a password or master key."
                : "Use your username and password or master key to continue."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
            <div>
              <label className="text-[11px] font-mono text-gray-500 uppercase mb-1.5 block tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 px-4 py-3.5 text-base text-gray-900 dark:text-white focus:border-system-blue outline-none transition-colors"
                placeholder="Choose a username"
                required
              />
            </div>

            {isRegistering && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
              >
                <label className="text-[11px] font-mono text-gray-500 uppercase mb-1.5 block tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 px-4 py-3.5 text-base text-gray-900 dark:text-white focus:border-system-blue outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </motion.div>
            )}

            <div>
              <label className="text-[11px] font-mono text-gray-500 uppercase mb-1.5 block tracking-wider">
                Password / Master Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 px-4 py-3.5 pr-12 text-base text-gray-900 dark:text-white focus:border-system-blue outline-none transition-colors"
                  placeholder="Enter your password or master key"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-system-blue"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-system-red text-xs sm:text-sm font-mono flex items-center gap-2 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-200 dark:border-red-900/50"
              >
                <ShieldAlert size={12} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 sm:mt-4 rounded-xl bg-system-blue text-white dark:text-black font-bold py-3.5 sm:py-4 hover:bg-blue-600 dark:hover:bg-white transition-colors flex items-center justify-center gap-2 group relative overflow-hidden text-sm sm:text-base"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>{isRegistering ? "Create Account" : "Sign In"}</span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
              className="text-gray-500 hover:text-system-blue text-sm font-mono flex items-center gap-2 transition-colors text-center"
            >
              {isRegistering ? (
                <>
                  Already have an account? <LogIn size={12} /> Sign in
                </>
              ) : (
                <>
                  New here? <UserPlus size={12} /> Create account
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-6 opacity-40">
          <p className="text-[10px] font-mono text-gray-400">
            SECURE CONNECTION ESTABLISHED
          </p>
          <p className="text-[10px] font-mono text-gray-600 dark:text-gray-600">
            V.1.0.6 // MULTI_DB_PROTOCOL
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;

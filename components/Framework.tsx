import React from "react";
import {
  BookOpen,
  Zap,
  Target,
  Shield,
  Skull,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Play,
  ShoppingBag,
  X,
  Trophy,
  AlertOctagon,
} from "lucide-react";
import FAQ from "./FAQ";

interface FrameworkProps {
  currency?: "USD" | "NGN";
}

const Framework: React.FC<FrameworkProps> = ({ currency = "USD" }) => {
  // April 2026 Pricing Update:
  // Entry: $5 USD / ₦2,500 NGN = 1,500 XP (first purchase), then 1,000 XP
  const priceDisplay = currency === "NGN" ? "₦2,500" : "$5.00";
  const firstPackXP = "1,500";
  const standardPackXP = "1,000";

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative bg-gray-50 dark:bg-black">
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header */}
        <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">
            The Rules
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm uppercase text-system-red">
            Break them, lose money.
          </p>
        </header>

        {/* --- RULE 1: EXECUTE OR PAY --- */}
        <section className="mb-12 bg-gray-900 border border-gray-800 p-8 rounded-xl relative overflow-hidden text-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">
              1. The Only Rule That Matters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-black rounded border border-gray-800">
                <div className="text-system-red font-bold font-mono text-lg mb-1">
                  NO TASK
                </div>
                <div className="text-gray-500 text-xs uppercase">No XP</div>
              </div>
              <div className="p-4 bg-black rounded border border-gray-800">
                <div className="text-system-red font-bold font-mono text-lg mb-1">
                  NO PROOF
                </div>
                <div className="text-gray-500 text-xs uppercase">No Credit</div>
              </div>
              <div className="p-4 bg-black rounded border border-gray-800">
                <div className="text-system-red font-bold font-mono text-lg mb-1">
                  24H IDLE
                </div>
                <div className="text-gray-500 text-xs uppercase">
                  Account Banned
                </div>
              </div>
            </div>
            <p className="text-gray-400 font-mono text-sm max-w-lg mx-auto">
              This is not a democracy. It’s a system for winners. Either you do
              the work, or you pay the price.
            </p>
          </div>
        </section>

        {/* --- RULE 2: LEVEL UP --- */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase">
            <TrendingUp size={20} className="text-system-blue" /> 2. How to
            Level Up (And Why It Matters)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-widest border-b border-gray-700 pb-2">
                Progression Path
              </h4>
              <ul className="space-y-3 text-sm font-mono text-gray-400">
                <li className="flex justify-between">
                  <span>RANK E (Novice)</span>
                  <span className="text-white">
                    0 Tasks{" "}
                    <span className="text-gray-600">(Losers Start Here)</span>
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>RANK D (Scout)</span>
                  <span className="text-white">
                    20 Tasks{" "}
                    <span className="text-gray-600">(Where Most Quit)</span>
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>RANK C (Vanguard)</span>
                  <span className="text-white">
                    30 Tasks{" "}
                    <span className="text-gray-600">(Winning Starts)</span>
                  </span>
                </li>
                <li className="flex justify-between text-system-gold font-bold">
                  <span>RANK X (Executioner)</span>
                  <span>100+ Tasks (Legendary)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-widest border-b border-gray-700 pb-2">
                The Rewards
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2 items-start">
                  <CheckCircle size={14} className="mt-1 text-system-blue" />{" "}
                  Exclusive store items (e.g. Discipline Boosters).
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle size={14} className="mt-1 text-system-blue" />{" "}
                  Featured in newsletter (Social Proof).
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle size={14} className="mt-1 text-system-blue" />{" "}
                  Access to private challenges (Real Money).
                </li>
              </ul>
              <div className="mt-4 p-3 bg-system-blue/10 border border-system-blue/30 rounded text-xs text-system-blue font-mono">
                PRO TIP: The fastest way to level up? Stop failing tasks.
              </div>
            </div>
          </div>
        </section>

        {/* --- RULE 3 & 4: XP & STORE --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase">
              <Zap size={20} className="text-system-gold" /> 3. The XP System
            </h2>
            <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-4">
                Action Credits (Bought XP) are mandatory to operate.
              </p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex justify-between border-b border-gray-800 pb-2">
                  <span>Create Task</span>{" "}
                  <span className="text-system-blue font-bold">
                    Cost 10 Action XP
                  </span>
                </li>
                <li className="flex justify-between border-b border-gray-800 pb-2">
                  <span>Lose XP</span>{" "}
                  <span className="text-red-500 font-bold">
                    Fail Tasks (-100 XP)
                  </span>
                </li>
                <li className="flex justify-between border-b border-gray-800 pb-2">
                  <span>Buy XP (First)</span>{" "}
                  <span className="text-system-gold font-bold">
                    {priceDisplay} = {firstPackXP} XP ★
                  </span>
                </li>
                <li className="flex justify-between pt-1">
                  <span>Buy XP (Repeat)</span>{" "}
                  <span className="text-system-gold font-bold">
                    {priceDisplay} = {standardPackXP} XP
                  </span>
                </li>
              </ul>
              <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-[10px] text-yellow-400 font-mono">
                ★ FIRST DEPOSIT BONUS: +500 extra XP on your first pack, no extra cost.
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase">
              <ShoppingBag size={20} className="text-purple-500" /> 4. The Store
            </h2>
            <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-4">
                Why buy? Because losing XP hurts. Spending it smartly hurts
                less.
              </p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>{" "}
                  <strong>Stat Boosters:</strong> +10% discipline (500 XP).
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>{" "}
                  <strong>Penalty Shields:</strong> Halve next failure cost (300
                  XP).
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>{" "}
                  <strong>Coaching:</strong> We shame you if you slack (1,000
                  XP).
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* --- RULE 5: FAILURE --- */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase">
            <Skull size={20} className="text-system-red" /> 5. What Happens If
            You Fail?
          </h2>
          <div className="bg-red-900/10 border border-red-900/50 p-6 rounded-xl flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-center p-3 bg-black/50 rounded border border-red-900/30">
                <span className="text-sm text-gray-400">Any Failure</span>
                <span className="text-system-red font-bold font-mono">
                  LOSE 100 Action XP
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-900/20 rounded border border-red-500">
                <span className="text-sm text-white font-bold uppercase">
                  24H Inactivity
                </span>
                <span className="text-white font-bold font-mono">BANNED</span>
              </div>
            </div>
            <div className="md:w-1/3 text-center md:text-left">
              <p className="text-gray-300 text-sm leading-relaxed">
                You do not get banned for failing. You get banned for{" "}
                <strong>doing nothing</strong>. <br />
                <br />
                <strong className="text-white">IDLENESS IS DEATH.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* --- RULE 6: GUARANTEE --- */}
        <section className="mb-12 text-center py-10 border-t border-gray-800">
          <h2 className="text-2xl font-black text-white mb-4 uppercase italic">
            6. The Execution Guarantee
          </h2>
          <div className="max-w-2xl mx-auto space-y-2 text-gray-400 text-sm mb-8">
            <p>
              If you follow the system, you{" "}
              <strong className="text-white">WILL</strong> execute.
            </p>
            <p>
              If you don't, you <strong className="text-white">WILL</strong>{" "}
              lose money.
            </p>
            <p className="font-mono text-system-red pt-2">
              NO REFUNDS. NO EXCUSES. NO EXCEPTIONS.
            </p>
          </div>
          <p className="text-gray-500 text-xs max-w-md mx-auto">
            This is the last productivity system you'll ever need—because it's
            the only one that works.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Framework;

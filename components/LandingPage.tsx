import React from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Shield,
  Zap,
  TrendingUp,
  ArrowRight,
  Wallet,
  Skull,
  AlertCircle,
  Globe,
  Users,
  Lock,
  BarChart,
  AlertTriangle,
} from "lucide-react";
import Logo from "./Logo";
import FAQ from "./FAQ";
import { Currency } from "../types";

interface LandingPageProps {
  onGetStarted: () => void;
  currency?: Currency;
  onToggleCurrency?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  currency = "USD",
  onToggleCurrency,
}) => {
  // New pricing (April 2026): $5 / ₦2,500 for entry → 1,500 XP first purchase, then 1,000 XP
  const priceDisplay = currency === "NGN" ? "₦2,500" : "$5.00";
  const coachingPrice = currency === "NGN" ? "₦10,000" : "$15.00";

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-gray-900 relative overflow-x-hidden font-sans selection:bg-indigo-600 selection:text-white">
      {/* Background Ambience - 'Serious' texture */}
      <div className="absolute inset-0 bg-[linear-gradient(#E5E5E5_1px,transparent_1px),linear-gradient(90deg,#E5E5E5_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30"></div>

      {/* Vibrant Header Splash - Tech Gradient Mode */}
      <div className="absolute top-0 left-0 right-0 h-[65vh] bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-950 clip-path-slant z-0 shadow-2xl transform -skew-y-1 origin-top-left scale-105"></div>

      {/* Nav */}
      <nav className="relative z-50 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-2 md:px-5 md:py-2.5 rounded-full border border-white/10 shadow-xl">
          <Logo className="w-6 h-6 md:w-8 md:h-8 scale-100 text-white" />
          <span className="font-bold font-mono tracking-tight text-white text-[10px] md:text-base hidden xs:inline-block">
            EXECUTION{" "}
            <span className="text-indigo-400 animate-pulse">CABAL</span>
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {onToggleCurrency && (
            <button
              onClick={onToggleCurrency}
              className="flex items-center gap-1 md:gap-2 bg-white hover:bg-gray-100 text-black px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 font-mono border-2 border-transparent hover:border-indigo-500"
            >
              <Globe size={12} className="text-indigo-600" /> {currency}
            </button>
          )}
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 md:px-8 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase transition-all shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.7)] active:scale-95 tracking-widest whitespace-nowrap"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 w-full pt-20 pb-12 text-center">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-white drop-shadow-xl font-serif max-w-4xl mx-auto">
              STOP EXPLAINING.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 relative inline-block filter drop-shadow-sm mt-2">
                START EXECUTING.
                <svg
                  className="absolute w-full h-3 -bottom-1 left-0 text-indigo-500 opacity-80"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Problem Card - Refined & Centered */}
            <motion.div
              className="bg-white text-left p-8 rounded-sm border-l-4 border-indigo-600 shadow-2xl relative group overflow-hidden max-w-2xl mx-auto mb-12 hover:-translate-y-1 transition-transform duration-300"
              whileHover={{ scale: 1.01 }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Skull size={100} />
              </div>

              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-black font-bold uppercase text-sm flex items-center gap-2 tracking-widest">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-xs animate-pulse">
                    !
                  </span>
                  The Problem
                </h3>
                <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  LIVE MONITORING
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed mb-6 font-medium font-serif">
                Imagine you’re a Creator, entrepreneur, or freelancer. You’ve
                tried Notion, Trello, ClickUp.
                <br className="hidden md:block" />
                You write down tasks… then ignore them. You set goals… then
                forget them.
              </p>

              <div className="p-4 bg-indigo-50 border border-indigo-100 flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="p-2 bg-white rounded-full border border-indigo-100 shadow-sm shrink-0">
                  <AlertCircle size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-indigo-900 font-mono text-xs font-bold uppercase mb-1 opacity-70">
                    Analysis Result
                  </p>
                  <p className="text-indigo-900 font-bold leading-tight">
                    You’re still broke, still behind, still making excuses.
                  </p>
                </div>
              </div>

              {/* Subtle Animation of Progress */}
              <div className="absolute bottom-0 left-0 h-1 bg-indigo-100 w-full">
                <motion.div
                  className="h-full bg-indigo-600"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                ></motion.div>
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-6">
              <button
                onClick={onGetStarted}
                className="bg-black text-white px-16 py-6 rounded-sm font-black uppercase text-lg tracking-[0.2em] shadow-[8px_8px_0px_#4F46E5] hover:shadow-[12px_12px_0px_#4F46E5] hover:-translate-y-1 transition-all border-2 border-black group relative overflow-hidden"
              >
                <span className="relative z-10">Enter The System</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edge-to-Edge Marquee - Under Hero */}
      <div className="relative w-full py-6 bg-black border-y-4 border-indigo-600 shadow-2xl overflow-hidden transform -skew-y-2 mt-8 mb-20">
        <div className="absolute inset-0 bg-indigo-900/20 pointer-events-none"></div>
        <motion.div
          className="whitespace-nowrap flex gap-4 items-center"
          animate={{ x: "-80%" }}
          transition={{ repeat: Infinity, ease: "easeInOut", duration: 24 }}
        >
          {[...Array(8)].map((_, i) => (
            <h2
              key={i}
              className="text-3xl md:text-5xl font-black italic text-white tracking-tighter uppercase shrink-0 flex items-center gap-8 px-4"
            >
              SAVE YOUR TIME AND TAKE CONTROL OF YOUR LIFE BACK{" "}
              <span className="text-indigo-500">•</span> You also earn XP for
              completing tasks<span className="text-indigo-500">•</span>
            </h2>
          ))}
        </motion.div>
      </div>

      {/* The Difference - Asymmetrical Grid - TECH GRADIENT MODE */}
      <div className="relative z-10 py-24 bg-white clip-path-slant-reverse mt-[-5rem]">
        <div className="max-w-7xl mx-auto px-6 pt-12">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-gray-900 mb-6 font-sans tracking-tight">
              The Solution
            </h2>
            <div className="w-24 h-2 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-8"></div>
            <p className="text-2xl text-gray-900 font-bold font-serif italic">
              "We don't let you off the hook. Brutal but Fair."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 border-4 border-black shadow-[10px_10px_0px_#000] hover:translate-y-[-5px] hover:shadow-[15px_15px_0px_#000] transition-all relative group h-full">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center font-black text-3xl mb-8 -mt-12 ml-auto shadow-lg border-2 border-white">
                1
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase">Set A Task</h3>
              <p className="text-gray-600 font-medium text-lg leading-relaxed">
                Actionable directives only. Creating a task costs{" "}
                <strong className="bg-black text-white px-1 whitespace-nowrap">
                  10 XP
                </strong>
                .
              </p>
            </div>

            <div className="bg-black p-8 border-4 border-black shadow-[10px_10px_0px_#7C3AED] hover:translate-y-[-5px] hover:shadow-[15px_15px_0px_#7C3AED] transition-all relative group md:-mt-8 h-full">
              <div className="w-16 h-16 bg-indigo-600 text-white flex items-center justify-center font-black text-3xl mb-8 -mt-12 ml-auto shadow-lg border-2 border-black">
                2
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase text-white">
                Bet Your XP
              </h3>
              <p className="text-gray-400 font-medium text-lg leading-relaxed">
                1,000 XP ={" "}
                <span className="text-white border-b-2 border-indigo-600">
                  {priceDisplay}
                </span>
                . You are betting REAL money on your ability to execute.
              </p>
            </div>

            <div className="bg-[#0F172A] p-8 border-4 border-indigo-600 shadow-[10px_10px_0px_#4338ca] hover:translate-y-[-5px] hover:shadow-[15px_15px_0px_#4338ca] transition-all relative group h-full">
              <div className="w-16 h-16 bg-indigo-600 text-white flex items-center justify-center font-black text-3xl mb-8 -mt-12 ml-auto shadow-lg border-2 border-white">
                3
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase text-indigo-400">
                Execute or Lose
              </h3>
              <p className="text-gray-300 font-medium text-lg leading-relaxed">
                Fail? Lose 50 XP. Idle for 24h?{" "}
                <span className="bg-red-600 text-white px-1 font-black">
                  BANNED.
                </span>
              </p>
            </div>

            <div className="bg-white p-10 border-4 border-indigo-500 shadow-[10px_10px_0px_#6366f1] hover:translate-y-[-5px] hover:shadow-[15px_15px_0px_#6366f1] transition-all relative group md:-mt-8 h-full">
              <div className="w-16 h-16 bg-indigo-500 text-white flex items-center justify-center font-black text-3xl mb-8 -mt-12 ml-auto shadow-lg border-2 border-black">
                4
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase text-gray-900">
                Earn XP
              </h3>
              <p className="text-gray-600 font-medium text-lg leading-relaxed">
                Execution pays. You earn{" "}
                <strong className="text-indigo-600">System XP</strong> for being
                Productive. Spend it to unlock power & Digital Products.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive System Section - Light & Professional */}
      <div className="py-24 bg-gray-50 text-gray-900 relative overflow-hidden border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">
              Live System
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 text-gray-900">
            The System <span className="text-indigo-600">Adapts.</span>
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed mb-16">
            A dynamic environment that evolves with your performance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <BarChart size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Activity Tracking</h3>
              <p className="text-gray-500 leading-relaxed">
                Monitors your consistency and output in real-time.
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Smart Nudges</h3>
              <p className="text-gray-500 leading-relaxed">
                Assigns dynamic daily tasks tailored to your real-time
                performance.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Dynamic Scoring</h3>
              <p className="text-gray-500 leading-relaxed">
                Your execution score fluctuates based on tangible results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Section - Professional & Encrypted */}
      <div className="w-full bg-white border-y border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
            <Shield className="text-gray-900 w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              End-to-End Encryption
            </h3>
            <p className="text-gray-500 font-medium">
              Your data is encrypted between you and the system. No external
              access. Total privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Real Stories - Collage Style */}
      <div className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <h2 className="text-left text-5xl md:text-7xl font-black uppercase italic mb-20 leading-none">
            Real
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 ml-20">
              Impact
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Hudson */}
            <div className="bg-[#111] p-10 border border-gray-800 hover:border-indigo-500 transition-colors relative">
              <div className="absolute -top-4 -left-4 bg-white text-black font-black px-4 py-1 text-sm uppercase">
                Case Study 001
              </div>
              <h4 className="text-3xl font-serif font-bold text-white mb-6">
                Hudson's Launch.
              </h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">
                    Before Protocol
                  </p>
                  <p className="text-gray-400 font-serif text-lg leading-tight">
                    "Evaluating options" for 6 months. $0 revenue.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-indigo-500 uppercase font-black tracking-widest mb-2">
                    After Protocol
                  </p>
                  <p className="text-white font-bold text-lg leading-tight">
                    Launched Day 5.
                  </p>
                  <p className="text-indigo-400 text-sm mt-1 font-mono">
                    Current: {currency === "NGN" ? "₦150k" : "$150"}/mo
                  </p>
                </div>
              </div>
            </div>

            {/* Riley */}
            <div className="bg-[#111] p-10 border border-gray-800 hover:border-purple-500 transition-colors relative md:mt-20">
              <div className="absolute -top-4 -right-4 bg-purple-600 text-white font-black px-4 py-1 text-sm uppercase">
                Case Study 002
              </div>
              <h4 className="text-3xl font-serif font-bold text-white mb-6">
                Riley's Scale.
              </h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">
                    Before Protocol
                  </p>
                  <p className="text-gray-400 font-serif text-lg leading-tight">
                    Lost 3 clients. Chronic procrastination.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-purple-500 uppercase font-black tracking-widest mb-2">
                    After Protocol
                  </p>
                  <p className="text-white font-bold text-lg leading-tight">
                    Doubled Income.
                  </p>
                  <p className="text-purple-400 text-sm mt-1 font-mono">
                    20 Tasks / 30 Days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* You */}
          <div className="mt-20 bg-gradient-to-r from-indigo-900 to-black p-10 border-t-4 border-indigo-600 relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
              <div>
                <h4 className="text-4xl font-black text-white mb-2 flex items-center gap-4">
                  SUBJECT: YOU{" "}
                  <span className="text-red-500 animate-pulse text-sm font-mono border border-red-500 px-2 py-1 rounded">
                    RECRUITING
                  </span>
                </h4>
                <p className="text-gray-300 font-mono text-sm max-w-xl">
                  Current Status: Waiting for the "right time".
                  <br />
                  Future Status:{" "}
                  <span className="text-white font-bold">
                    Results or Consequences.
                  </span>
                </p>
              </div>
              <div className="flex gap-4">
                <Check size={40} className="text-indigo-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing - 'Menu' Style */}
      <div className="py-32 bg-white text-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black uppercase mb-4 inline-block relative z-10">
              Commitment Protocol
              <span className="absolute bottom-2 left-0 w-full h-4 bg-purple-200 -z-10 transform -rotate-2"></span>
            </h2>
            <p className="text-gray-500 font-mono text-sm mt-4">
              CORE SYSTEM IS FREE. CREDITS ARE MANDATORY.
            </p>
          </div>

          <div className="border-4 border-black p-1 bg-black">
            <div className="bg-white border-2 border-black p-8">
              <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-black pb-8 mb-8 hover:bg-indigo-50 transition-colors p-4 cursor-pointer group">
                <div>
                  <h3 className="text-2xl font-black uppercase group-hover:text-indigo-600 transition-colors">
                    System Access <span className="text-indigo-500">FREE</span>
                  </h3>
                  <p className="text-gray-500 font-serif italic">
                    The dashboard, the tracking, the fear.
                  </p>
                </div>
                <div className="text-right mt-4 md:mt-0">
                  <span className="text-4xl font-black text-gray-200 group-hover:text-indigo-200 transition-colors">
                    0.00
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-black pb-8 mb-8 bg-indigo-50 -mx-4 px-8 py-6 transform scale-105 shadow-xl border-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 uppercase">
                  Recommended
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase text-indigo-900">
                    Starter Pack
                  </h3>
                  <p className="text-indigo-700 font-serif italic">
                    1,500 Action Credits (First Purchase). 1,000 thereafter.
                  </p>
                  <p className="text-xs text-indigo-500 font-mono mt-1 uppercase tracking-wide">
                    NEW: FIRST DEPOSIT EARNS +500 BONUS XP — NO EXTRA COST
                  </p>
                </div>
                <div className="text-right mt-4 md:mt-0">
                  <span className="text-4xl font-black text-indigo-600">
                    {priceDisplay}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center p-4 opacity-50 grayscale">
                <div>
                  <h3 className="text-2xl font-black uppercase flex items-center gap-2">
                    Coaching <Lock size={18} />
                  </h3>
                  <p className="text-gray-500 font-serif italic">
                    Direct oversight. Not for the weak.
                  </p>
                </div>
                <div className="text-right mt-4 md:mt-0">
                  <span className="text-4xl font-black text-gray-300">
                    {coachingPrice}
                    <span className="text-sm text-gray-400">/mo</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise / Team Grid */}
      <div className="py-24 bg-black border-t border-gray-900 relative overflow-hidden text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-block border border-indigo-600 text-indigo-400 font-bold px-4 py-1 text-xs mb-6 uppercase tracking-[0.2em]">
              Enterprise Protocol
            </div>
            <h2 className="text-6xl font-black text-white mb-8 leading-[0.9]">
              BUILD A <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                LEGION.
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 font-serif leading-relaxed">
              Single-player is just the warm-up. <br /> Deploy the protocol
              across your team to up their productivity.
            </p>

            <div className="inline-flex items-center gap-2 text-gray-500 font-mono text-sm border border-gray-800 px-4 py-2 hover:border-indigo-900 transition-colors cursor-wait">
              <Lock size={14} /> V3.0 2026 RELEASE
            </div>
          </div>

          <div className="relative">
            <div className="bg-[#0A0A0A] border border-gray-800 p-8 relative z-10 grayscale hover:grayscale-0 transition-all duration-700 group">
              <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <div>
                  <h4 className="font-bold text-white uppercase tracking-widest">
                    Global Ops
                  </h4>
                  <p className="text-xs text-indigo-500 font-mono uppercase">
                    Live Monitoring
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-white text-xl">
                    24,500 XP
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 flex items-center justify-center font-bold text-black ${i === 1 ? "bg-gradient-to-r from-blue-600 to-purple-600" : i === 2 ? "bg-white" : "bg-gray-800 text-white"}`}
                    >
                      0{i}
                    </div>
                    <div className="flex-1 bg-gray-900 h-4 overflow-hidden border border-gray-800">
                      <div
                        className={`h-full ${i === 1 ? "bg-gradient-to-r from-blue-600 to-purple-600 w-[92%]" : i === 2 ? "bg-white w-[65%]" : "bg-gray-700 w-[30%]"}`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-40 bg-gradient-to-br from-blue-900 to-indigo-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="relative z-10 px-6">
          <h2 className="text-5xl md:text-8xl font-black text-white mb-12 tracking-tighter leading-none">
            NO MORE
            <br />
            EXCUSES.
          </h2>
          <button
            onClick={onGetStarted}
            className="bg-black text-white px-16 py-8 font-black uppercase text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform border-4 border-white"
          >
            Join The Cabal
          </button>
          <div className="mt-12 space-y-4 opacity-80">
            <p className="text-white font-medium text-lg font-serif italic">
              "Not ready? That's fine. Close this tab and keep pretending next
              Monday will be different."
            </p>
            <p className="text-indigo-300 font-mono text-xs uppercase tracking-widest">
              P.S. The only thing worse than losing $$$ is losing another year
              to excuses. Pick one.
            </p>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <footer className="bg-black py-6 text-center border-t border-white/10 relative z-20">
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
          &copy; 2026 Execution Cabal. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

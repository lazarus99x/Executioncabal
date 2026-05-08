import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Shield,
  User,
  Zap,
  DollarSign,
  Brain,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { OnboardingData, Player } from "../types";
import Logo from "./Logo";

interface OnboardingFlowProps {
  username: string;
  onComplete: (data: OnboardingData) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  username,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    primaryDirective: "",
    topObstacle: "",
    hourlyRate: "",
  });

  const questions = [
    {
      id: "primaryDirective",
      title: "IDENTIFY PROTOCOL",
      subtitle: "What is your primary professional function?",
      placeholder: "e.g. Frontend Developer, Founder, Writer...",
      icon: <User className="text-system-blue" size={32} />,
      examples: [
        "Software Engineer",
        "Digital Artist",
        "Entrepreneur",
        "Student",
      ],
    },
    {
      id: "topObstacle",
      title: "THREAT ASSESSMENT",
      subtitle: "What is the single biggest threat to your execution?",
      placeholder: "e.g. Procrastination, Doomscrolling, Lack of Clarity...",
      icon: <Brain className="text-system-red" size={32} />,
      examples: [
        "Social Media Addiction",
        "Analysis Paralysis",
        "Burnout",
        "Distractions",
      ],
    },
    {
      id: "hourlyRate",
      title: "VALUE CALCULATION",
      subtitle: "What is 1 hour of your deep work worth?",
      placeholder: "e.g. $50, $200, Priceless...",
      icon: <DollarSign className="text-system-green" size={32} />,
      examples: ["$50/hr", "$100/hr", "$500/hr", "Estimating..."],
    },
  ];

  const handleNext = async () => {
    if (step < questions.length) {
      setStep(step + 1);
      return;
    }

    // Submit at End of Guide
    setLoading(true);
    const data: OnboardingData = {
      primaryDirective: answers.primaryDirective,
      topObstacle: answers.topObstacle,
      hourlyRate: answers.hourlyRate,
      completedAt: Date.now(),
    };

      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            player_data: {
              ...(await getCurrentPlayerData()),
              onboarding: data,
            },
          })
          .eq("username", username);

        if (error) throw error;

        // Artificial delay for effect
        setTimeout(() => {
          onComplete(data);
        }, 1500);
      } catch (err) {
        console.error("Onboarding Save Error:", err);
        setLoading(false);
        // Fallback: Proceed anyway in app state
        onComplete(data);
      }
  };

  // Helper to get current player data safely to merge
  const getCurrentPlayerData = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("player_data")
      .eq("username", username)
      .single();
    return data?.player_data || {};
  };

  const isGuideStep = step === questions.length;
  const currentQ = isGuideStep ? questions[step - 1] : questions[step];
  const currentAnswer = useMemo(
    () => (!isGuideStep ? Object.values(answers)[step] || "" : ""),
    [answers, isGuideStep, step]
  );
  const canProceed = isGuideStep || currentAnswer.length > 2;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black text-white font-mono">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

      {/* ProgressBar */}
      <div className="sticky top-0 left-0 z-20 w-full h-2 bg-gray-900">
        <motion.div
          className="h-full bg-system-blue shadow-glow"
          initial={{ width: "0%" }}
          animate={{ width: `${((step) / questions.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        <div className="flex-1 px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-32">
          <div className="max-w-2xl w-full mx-auto flex flex-col items-center">
            <Logo className="w-16 h-16 mb-8 sm:mb-12 animate-pulse" />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full"
              >
                {isGuideStep ? (
                  <div className="max-w-lg mx-auto bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 p-5 sm:p-6 md:p-8 text-left shadow-2xl max-h-[calc(100dvh-16rem)] overflow-y-auto">
                <h2 className="text-2xl font-black mb-6 text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="text-system-blue" />
                  System Manual
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 bg-red-500/20 p-2 rounded-full">
                      <Zap size={16} className="text-system-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">What is Execution Cabal?</h3>
                      <p className="text-sm text-gray-400 font-sans leading-relaxed">
                        It's a strict productivity app. You assign yourself tasks, and if you fail to complete them before the deadline, you lose Action points and get penalized. No excuses.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 bg-blue-500/20 p-2 rounded-full">
                      <Check size={16} className="text-system-blue" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Manual Task Assignment</h3>
                      <p className="text-sm text-gray-400 font-sans leading-relaxed">
                        Use the large chat input at the bottom of the dashboard to create new tasks. <b>Tip:</b> Click the two small Calendar Icons inside the input box to manually set your task's start date and deadline.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="mt-1 bg-purple-500/20 p-2 rounded-full">
                      <Brain size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Chaos Mode (AI Organizer)</h3>
                      <p className="text-sm text-gray-400 font-sans leading-relaxed">
                        Don't want to assign tasks one by one? Click the glowing Brain icon next to the chat input to enter Chaos Mode. Just dump your messy thoughts, and the AI will auto-generate tasks and deadlines for you.
                      </p>
                    </div>
                  </div>
                </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8 sm:mb-10">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-900 border border-gray-800 mb-6 shadow-2xl">
                        {currentQ.icon}
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                        {currentQ.title}
                      </h2>
                      <p className="text-lg sm:text-xl text-gray-400 font-serif italic">
                        {currentQ.subtitle}
                      </p>
                    </div>

                    <div className="relative mb-10 sm:mb-12">
                      <input
                        autoFocus
                        type="text"
                        value={answers[currentQ.id as keyof typeof answers]}
                        onChange={(e) =>
                          setAnswers({ ...answers, [currentQ.id]: e.target.value })
                        }
                        className="w-full bg-transparent border-b-2 border-gray-800 text-center text-2xl sm:text-3xl md:text-4xl py-4 focus:border-system-blue outline-none transition-colors text-white placeholder-gray-800"
                        placeholder={currentQ.placeholder}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canProceed) handleNext();
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 opacity-50">
                      {currentQ.examples.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setAnswers({ ...answers, [currentQ.id]: ex })}
                          className="text-xs border border-gray-700 px-3 py-1 rounded-full hover:bg-gray-800 hover:text-white transition-colors"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-gray-900/80 bg-black/90 backdrop-blur-xl px-4 py-4 sm:px-6">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">
            <button
              onClick={handleNext}
              disabled={!canProceed || loading}
              className={`
                group relative overflow-hidden bg-white text-black w-full sm:w-auto sm:min-w-[18rem] px-8 sm:px-12 py-4 font-black uppercase tracking-widest text-base sm:text-lg md:text-xl transition-all
                ${!canProceed ? "opacity-30 cursor-not-allowed" : "hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.3)]"}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  PROCESSING <Zap size={18} className="animate-spin" />
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isGuideStep ? "ENTER SYSTEM" : "NEXT"}{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              )}

              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            </button>

            <div className="text-gray-600 font-mono text-[11px] text-center">
              {isGuideStep ? "SYSTEM MANUAL // READ CAREFULLY" : `STEP ${step + 1} OF ${questions.length} // DATA ENCRYPTED`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

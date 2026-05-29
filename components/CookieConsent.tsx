import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Check } from "lucide-react";

type CookieChoice = "accepted" | "rejected" | null;

const CookieConsent: React.FC = () => {
  const [choice, setChoice] = useState<CookieChoice>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ec_cookie_consent");
    if (stored === "accepted" || stored === "rejected") {
      setChoice(stored);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("ec_cookie_consent", "accepted");
    setChoice("accepted");
    // Load analytics/tracking if any
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  };

  const handleReject = () => {
    localStorage.setItem("ec_cookie_consent", "rejected");
    setChoice("rejected");
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
  };

  const handleShowBanner = () => {
    setChoice(null);
  };

  if (choice !== null) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] p-3 md:p-4"
      >
        <div className="max-w-5xl mx-auto bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon */}
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 shrink-0">
              <Shield size={20} className="text-indigo-400" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm md:text-base mb-1">
                🍪 We Value Your Privacy
              </h3>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                Execution Cabal uses minimal cookies for essential functionality
                — authentication, session management, and security. We do{" "}
                <strong className="text-white">not</strong> sell your data or
                track you across sites.{" "}
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  Learn more
                </button>
              </p>

              {/* Expandable details */}
              <AnimatePresence>
                {showPreferences && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-xs font-semibold">
                            Essential Cookies
                          </p>
                          <p className="text-gray-500 text-[11px]">
                            Required for app functionality (auth, security,
                            session). Always active.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          Always On
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-xs font-semibold">
                            Analytics & Preferences
                          </p>
                          <p className="text-gray-500 text-[11px]">
                            Help us improve the experience (optional).
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                          Optional
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleReject}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border border-white/10 hover:border-white/20"
              >
                <X size={14} />
                Reject All
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
              >
                <Check size={14} />
                Accept All
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsent;
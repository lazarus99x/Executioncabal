import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  CheckCircle,
  ShieldCheck,
  Coins,
  X,
  AlertTriangle,
  Unlock,
} from "lucide-react";
import { Currency } from "../types";

interface PaymentModalProps {
  onPurchase: () => void;
  onRestore?: () => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  currency?: Currency;
  restorationFee?: number;
  currentBalance?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  onPurchase,
  onRestore,
  onClose,
  title = "Initialize System",
  description = "Purchase XP to begin execution.",
  currency = "USD",
  restorationFee,
  currentBalance = 0,
}) => {
  const [processing, setProcessing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1000);

  // Pricing preview only. Secure billing happens in Checkout and XP is credited only after verification.
  const tiers = [
    { xp: 1000, ngn: "2,500", usd: "5.00" },
    { xp: 5000, ngn: "12,500", usd: "25.00" },
    { xp: 10000, ngn: "25,000", usd: "50.00" },
  ];

  const handleBuy = () => {
    setProcessing(true);
    onPurchase();
    setTimeout(() => setProcessing(false), 400);
  };

  const handleRestoreClick = () => {
    if (!onRestore) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onRestore();
    }, 1500);
  };

  const currentTier = tiers.find((tier) => tier.xp === selectedTier) || tiers[0];
  const canAffordRestoration = restorationFee && currentBalance >= restorationFee;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-md bg-[#0F1115] border ${restorationFee ? "border-red-600" : "border-gray-800"} rounded-2xl relative overflow-hidden shadow-2xl`}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white z-20 transition-colors"
          >
            <X size={24} />
          </button>
        )}

        <div className="p-8 text-center border-b border-gray-800 relative bg-black/20">
          <div
            className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${restorationFee ? "via-system-red" : "via-system-blue"} to-transparent`}
          ></div>

          {restorationFee ? (
            <AlertTriangle size={48} className="mx-auto text-system-red mb-4 animate-pulse" />
          ) : (
            <Coins size={48} className="mx-auto text-system-gold mb-4" />
          )}

          <h2
            className={`text-2xl font-black ${restorationFee ? "text-system-red" : "text-white"} uppercase tracking-tighter mb-2`}
          >
            {title}
          </h2>
          <p className="text-gray-400 text-sm font-mono">{description}</p>
        </div>

        <div className="p-8">
          {restorationFee && (
            <div className="mb-6 p-4 bg-red-900/10 border border-red-900/50 rounded-lg text-center">
              <div className="text-xs text-gray-500 font-mono uppercase mb-1">
                Your Action Balance
              </div>
              <div
                className={`text-2xl font-bold font-mono mb-4 ${canAffordRestoration ? "text-green-500" : "text-red-500"}`}
              >
                {currentBalance} XP
              </div>

              {canAffordRestoration ? (
                <button
                  onClick={handleRestoreClick}
                  disabled={processing}
                  className="w-full bg-white text-black hover:bg-gray-200 font-black uppercase py-3 rounded flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  {processing ? (
                    <span className="animate-pulse">PROCESSING...</span>
                  ) : (
                    <>
                      <Unlock size={16} /> PAY {restorationFee} XP & RESTORE
                    </>
                  )}
                </button>
              ) : (
                <div className="text-xs text-red-400 font-bold mb-2">
                  INSUFFICIENT FUNDS TO PAY PENALTY. RECHARGE REQUIRED.
                </div>
              )}
            </div>
          )}

          {(!restorationFee || !canAffordRestoration) && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {tiers.map((tier) => (
                  <button
                    key={tier.xp}
                    onClick={() => setSelectedTier(tier.xp)}
                    className={`p-2 rounded border text-center transition-all ${selectedTier === tier.xp ? "bg-white text-black border-white" : "bg-transparent text-gray-500 border-gray-700 hover:border-gray-500"}`}
                  >
                    <div className="text-[10px] font-bold uppercase mb-1">
                      {tier.xp / 1000}k XP
                    </div>
                    <div className="text-xs font-mono">
                      {currency === "USD" ? `$${tier.usd}` : `₦${tier.ngn}`}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center mb-6 relative group cursor-pointer hover:border-system-blue transition-colors">
                <div className="text-sm text-gray-500 font-mono uppercase mb-2">
                  Selected Package
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {currency === "USD" ? `$${currentTier.usd}` : `₦${currentTier.ngn}`}
                </div>
                <div className="text-system-gold font-bold font-mono text-sm">
                  +{currentTier.xp.toLocaleString()} XP
                </div>
                <div className="mt-2 text-[10px] text-indigo-400 font-mono uppercase tracking-wide">
                  First purchase bonus is applied securely in checkout
                </div>

                <div className="mt-4 text-[10px] text-gray-500 flex flex-col gap-1">
                  <span className="flex items-center justify-center gap-1">
                    <CheckCircle size={10} /> Full System Access
                  </span>
                  <span className="flex items-center justify-center gap-1">
                    <ShieldCheck size={10} /> Secure Billing
                  </span>
                </div>
              </div>

              <button
                onClick={handleBuy}
                disabled={processing}
                className="w-full bg-[#00C853] hover:bg-[#00963F] text-white font-black uppercase py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <span className="animate-pulse">OPENING...</span>
                ) : (
                  <>
                    {restorationFee ? "OPEN CHECKOUT & RESTORE" : "OPEN SECURE CHECKOUT"}{" "}
                    <Smartphone size={18} />
                  </>
                )}
              </button>
            </>
          )}

          <p className="mt-4 text-[10px] text-gray-600 text-center font-mono">
            By proceeding, you accept the Execution Protocol terms.
            <br />
            XP is only credited after payment is verified by the system.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;

import React, { useState } from "react";
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  Zap,
  Calculator,
  Wallet,
  HelpCircle,
  Lock,
} from "lucide-react";
import { Player, Currency } from "../types";

interface CheckoutProps {
  player: Player;
  onPurchaseXP: (amount: number) => void;
  onWithdraw: () => void;
  currency?: Currency;
}

const Checkout: React.FC<CheckoutProps> = ({
  player,
  onPurchaseXP,
  onWithdraw,
  currency = "USD",
}) => {
  // ── Pricing Structure ──────────────────────────────────
  // First Purchase:  $5 USD = 1500 XP  |  ₦2,500 NGN = 1500 XP
  // Repeat Purchase: $5 USD = 1000 XP  |  ₦2,500 NGN = 1000 XP
  const isFirstPurchase = (player.boughtXp || 0) === 0;

  const FIXED_PRICE_USD = 5.00;
  const FIXED_PRICE_NGN = 2500;

  const XP_FOR_FIXED_USD = isFirstPurchase ? 1500 : 1000;
  const XP_FOR_FIXED_NGN = isFirstPurchase ? 1500 : 1000;

  // Derived rate (cost per XP) for the slider/custom amounts
  // After first purchase we use standard rate
  const RATE_USD = FIXED_PRICE_USD / 1000;   // $0.005 / XP (standard)
  const RATE_NGN = FIXED_PRICE_NGN / 1000;   // ₦2.5 / XP   (standard)

  // Minimum XP = the pack we promote; slider starts here
  const PROMOTED_XP = isFirstPurchase
    ? (currency === "NGN" ? XP_FOR_FIXED_NGN : XP_FOR_FIXED_USD)
    : 1000;

  const [xpAmount, setXpAmount] = useState<number>(PROMOTED_XP);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");

  // Cost for the currently-selected XP amount
  // First purchase always maps back to fixed price regardless of XP shown
  const numericCost = (() => {
    if (currency === "USD") {
      if (isFirstPurchase && xpAmount === XP_FOR_FIXED_USD) return FIXED_PRICE_USD;
      return parseFloat((xpAmount * RATE_USD).toFixed(2));
    } else {
      if (isFirstPurchase && xpAmount === XP_FOR_FIXED_NGN) return FIXED_PRICE_NGN;
      return xpAmount * RATE_NGN;
    }
  })();

  const cost = currency === "USD"
    ? numericCost.toFixed(2)
    : numericCost.toLocaleString();

  const MIN_XP = isFirstPurchase ? PROMOTED_XP : 1000;
  const MAX_XP = 50000;

  // Penalty display (100 XP deduction)
  const FAIL_PENALTY = 100;     // task failure
  const VERIFY_PENALTY = 50;    // verification rejection (per attempt)

  // XP Breakdown
  const boughtXp = player.boughtXp || 0;
  const earnedXp = Math.max(0, player.currentXp - boughtXp);

  const handlePayment = async () => {
    if (!email) {
      alert("Please enter a valid email address.");
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: numericCost,
          currency: currency === "USD" ? "USD" : "NGN",
          callback_url: window.location.href, // Redirect back to current page
        }),
      });

      const data = await res.json();

      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url; // Redirect to Paystack
      } else {
        console.error("Payment Init Failed:", data);
        alert(
          "Payment Initialization Failed: " + (data.message || "Unknown Error")
        );
        setProcessing(false);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment Error. Please try again.");
      setProcessing(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    // Snap to nearest 100
    setXpAmount(Math.round(val / 100) * 100);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">
            System Wallet
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
            Manage your Life Force (Action XP) and secure your execution
            capability.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* XP Balance Card */}
          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 rounded-xl relative overflow-hidden shadow-sm flex flex-col justify-between h-auto min-h-[192px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={40} />
            </div>
            <div>
              <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                Life Force (Total Spendable)
              </div>
              <div
                className={`text-4xl font-black font-mono mb-4 ${player.currentXp < 500 ? "text-system-red animate-pulse" : "text-system-blue"}`}
              >
                {player.currentXp}
              </div>

              {/* XP Split */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-gray-100 dark:bg-black/30 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-[9px] text-gray-500 uppercase block">
                    Action XP (Bought)
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    {boughtXp}
                  </span>
                </div>
                <div className="bg-gray-100 dark:bg-black/30 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-[9px] text-gray-500 uppercase block">
                    Reward XP (Earned)
                  </span>
                  <span className="text-sm font-bold text-yellow-500 font-mono">
                    {earnedXp}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mb-0 font-mono mt-2">
              System Lockout at 0 XP. <br />
              <span className="text-system-red">
                Task Failure: <strong>-{FAIL_PENALTY} XP</strong> &nbsp;|&nbsp; Proof Rejected: <strong>-{VERIFY_PENALTY} XP</strong>
              </span>
            </p>
          </div>

          {/* Withdrawal/Cash Card - DISABLED as per user request */}
          <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-6 rounded-xl relative overflow-hidden shadow-sm flex flex-col justify-between h-auto min-h-[192px] opacity-70">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={40} />
            </div>
            <div>
              <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                Earnings
              </div>
              <div className="text-4xl font-black font-mono text-gray-400 mb-1">
                LOCKED
              </div>
            </div>

            <div className="mt-4">
              <button
                disabled
                className="w-full py-3 rounded font-bold uppercase text-xs flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700"
              >
                <Lock size={14} />
                Withdrawal Disabled
              </button>
              <p className="text-[9px] text-center mt-2 text-gray-500 font-mono">
                PROTOCOL UPDATE: Earned XP is strictly for Store purchases. Cash
                out unavailable.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
          <span className="text-xs font-mono text-gray-500 uppercase">
            Secure XP Recharge
          </span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                  <Calculator size={18} className="text-system-gold" />
                  <span>Custom Amount</span>
                </div>
                <div className="bg-gray-100 dark:bg-black px-3 py-1 rounded text-xs font-mono font-bold text-gray-500">
                  {currency}
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-xs font-mono text-gray-500 uppercase">
                    XP Quantity
                  </label>
                  <div className="text-4xl font-mono font-bold text-system-blue">
                    {xpAmount.toLocaleString()}
                  </div>
                </div>

                <input
                  type="range"
                  min={MIN_XP}
                  max={MAX_XP}
                  step="100"
                  value={xpAmount}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-system-blue"
                />
                <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono">
                  <span>{MIN_XP.toLocaleString()} XP (Min)</span>
                  <span>50,000 XP (Max)</span>
                </div>
              </div>

              {/* First-Purchase Bonus Banner */}
              {isFirstPurchase && (
                <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
                  <div className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">🎯</div>
                  <div>
                    <div className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">First-Time Entry Bonus</div>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                      Your first deposit gets <strong>+500 bonus XP</strong> on top of the standard pack — {currency === "NGN" ? "₦2,500" : "$5.00"} for <strong>1,500 XP</strong> instead of 1,000.
                    </div>
                  </div>
                </div>
              )}

              {/* Pre-set Packs */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(isFirstPurchase
                    ? [PROMOTED_XP, 5000, 10000]
                    : [1000, 5000, 10000]).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setXpAmount(amt)}
                    className={`py-3 rounded border text-xs font-bold transition-all relative overflow-hidden ${xpAmount === amt ? "bg-system-blue text-white border-system-blue" : "bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-system-blue"}`}
                  >
                    {amt.toLocaleString()} XP
                    {isFirstPurchase && amt === PROMOTED_XP && (
                      <span className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black px-1 py-0.5">+500 BONUS</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Email Input */}
              <div className="mb-6">
                <label className="text-xs font-mono text-gray-500 uppercase mb-2 block">
                  Billing Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email for receipt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 p-3 rounded text-sm text-gray-900 dark:text-white focus:border-system-blue focus:outline-none"
                />
              </div>

              <div className="bg-gray-50 dark:bg-black/30 p-4 rounded border border-gray-200 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  <HelpCircle size={12} /> Purchase FAQ
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
                  <li>
                    • <strong>Why Buy XP?</strong> Excuses cost money. If you
                    fail a task, you lose XP. Buying XP creates a financial
                    stake in your own success.
                  </li>
                  <li>
                    • <strong>Instant Access:</strong> Funds are credited
                    immediately after secure payment.
                  </li>
                  <li>
                    • <strong>Bulk Savings:</strong> Larger packs reduce
                    transaction frequency.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right: Checkout Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-blue to-transparent"></div>

              <div className="flex items-center gap-2 mb-6 text-gray-900 dark:text-white font-bold">
                <CreditCard size={18} className="text-system-blue" />
                <span>Order Summary</span>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 pb-3">
                  <span className="text-gray-500">Item</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {xpAmount.toLocaleString()} Action XP
                    {isFirstPurchase && xpAmount === PROMOTED_XP && (
                      <span className="ml-2 text-[9px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-black">FIRST PACK</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 pb-3">
                  <span className="text-gray-500">Price</span>
                  <div className="text-right">
                    <span className="font-mono text-gray-900 dark:text-white">
                      {currency === "USD" ? `$${FIXED_PRICE_USD.toFixed(2)}` : `₦${FIXED_PRICE_NGN.toLocaleString()}`}
                      {isFirstPurchase && xpAmount === PROMOTED_XP && (
                        <span className="ml-2 text-[9px] text-indigo-500 font-mono">(1,500 XP Starter)</span>
                      )}
                    </span>
                    {!isFirstPurchase && (
                      <div className="text-[9px] text-gray-400 mt-0.5">
                        {currency === "USD" ? `$${RATE_USD}` : `₦${RATE_NGN}`} per XP
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm pb-3">
                  <span className="text-gray-500">Fees</span>
                  <span className="font-mono text-green-500 font-bold">
                    WAIVED
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-sm font-bold text-gray-500">TOTAL</span>
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    {currency === "USD" ? "$" : "₦"}
                    {cost}
                  </span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing || xpAmount < MIN_XP || !email}
                  className={`w-full text-white font-black uppercase py-4 rounded shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden ${
                    processing || xpAmount < MIN_XP || !email
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#00C853] hover:bg-[#00963F]"
                  }`}
                >
                  {processing ? (
                    <span className="animate-pulse">PROCESSING...</span>
                  ) : (
                    <>
                      PAY NOW <ShieldCheck size={18} />
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-2 text-gray-400 text-[10px]">
                  <Smartphone size={12} />
                  <span>Secured by Paystack</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

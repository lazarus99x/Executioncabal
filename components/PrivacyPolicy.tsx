import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, ChevronLeft, FileText } from "lucide-react";

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const sections = [
    {
      icon: <Shield size={18} />,
      title: "Data Controller",
      content: (
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Execution Cabal ("we," "us," or "our") operates as the data controller
          for all personal information collected through our platform. We are
          committed to protecting your privacy in accordance with the Nigerian
          Data Protection Regulation (NDPR) and the General Data Protection
          Regulation (GDPR) where applicable.
        </p>
      ),
    },
    {
      icon: <Eye size={18} />,
      title: "Information We Collect",
      content: (
        <div className="space-y-3">
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            We collect only the minimum data necessary to provide our
            accountability and task management services:
          </p>
          <ul className="space-y-2 text-gray-600 text-sm md:text-base">
            {[
              "Email address (for authentication and account recovery)",
              "Username and display name",
              "Task/quest data you create (encrypted in transit and at rest)",
              "Photo proof submissions (for AI verification — stored securely, never shared)",
              "Payment transaction records (processed via Paystack — we never store card details)",
              "Basic usage analytics (with your consent)",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Lock size={14} className="text-indigo-600 mt-1 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      icon: <Server size={18} />,
      title: "Data Encryption & Security",
      content: (
        <div className="space-y-3">
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            We take security seriously. All data handled by Execution Cabal is
            protected through the following measures:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: "Encryption in Transit",
                desc: "All traffic between your browser and our servers is encrypted using TLS 1.3 (HTTPS).",
              },
              {
                title: "Encryption at Rest",
                desc: "Database stored on Supabase infrastructure with AES-256 encryption at rest.",
              },
              {
                title: "Zero-Knowledge Architecture",
                desc: "API keys and secrets are server-side only — never exposed in client-side code.",
              },
              {
                title: "No Source Maps in Production",
                desc: "Build artifacts are minified and source-map-free, preventing reverse engineering via browser DevTools.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <h4 className="text-xs font-bold text-gray-900 uppercase mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <Lock size={18} />,
      title: "How We Use Your Data",
      content: (
        <ul className="space-y-2 text-gray-600 text-sm md:text-base">
          {[
            "Authenticate your identity and secure your account",
            "Process AI-powered photo verification of task completion",
            "Process payments through Paystack (we never see your card info)",
            "Send essential service emails (password resets, payment receipts)",
            "Improve our platform based on anonymized usage patterns (with consent)",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-indigo-600 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: <Eye size={18} />,
      title: "Third-Party Services",
      content: (
        <div className="space-y-3">
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            We integrate with the following trusted third-party services. Each
            has its own privacy policy and data handling practices:
          </p>
          <div className="space-y-2">
            {[
              {
                name: "Supabase",
                purpose: "Database, authentication, and storage",
                policy: "supabase.com/privacy",
              },
              {
                name: "Paystack",
                purpose: "Payment processing — we never store payment credentials",
                policy: "paystack.com/privacy",
              },
              {
                name: "Anthropic (Claude AI)",
                purpose: "AI verification of task proofs and chat assistance",
                policy: "anthropic.com/privacy",
              },
              {
                name: "Resend",
                purpose: "Email delivery for notifications and receipts",
                policy: "resend.com/privacy",
              },
            ].map((svc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    {svc.name}
                  </span>
                  <p className="text-xs text-gray-500">{svc.purpose}</p>
                </div>
                <span className="text-[10px] text-indigo-600 font-mono">
                  {svc.policy}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <Shield size={18} />,
      title: "Your Rights",
      content: (
        <div className="space-y-2 text-gray-600 text-sm md:text-base">
          <p>You have the right to:</p>
          {[
            "Access the personal data we hold about you",
            "Request correction or deletion of your data",
            "Withdraw consent for analytics cookies at any time",
            "Export your data in a portable format",
            "Lodge a complaint with your local data protection authority",
          ].map((right, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check size={14} className="text-green-600 mt-1 shrink-0" />
              <span>{right}</span>
            </li>
          ))}
          <p className="mt-3 text-sm">
            To exercise any of these rights, contact us at{" "}
            <strong>privacy@executioncabal.com</strong>.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-950">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors mb-4"
          >
            <ChevronLeft size={18} />
            Back to Execution Cabal
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-500/30">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-indigo-300 text-xs md:text-sm font-medium mt-1">
                Last updated: May 29, 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8">
          {/* Summary Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 md:p-6 bg-indigo-50 border border-indigo-100 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Lock size={20} className="text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-indigo-900 font-bold text-sm md:text-base mb-1">
                  TL;DR — We Respect Your Privacy
                </h3>
                <p className="text-indigo-700/80 text-xs md:text-sm leading-relaxed">
                  Execution Cabal collects only what's necessary to make the app
                  work. We encrypt everything, never sell your data, and give you
                  full control over your information. The code is open for
                  inspection — no hidden trackers, no data mining.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-indigo-600">{section.icon}</span>
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  {section.title}
                </h2>
              </div>
              {section.content}
            </motion.div>
          ))}

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center p-6 bg-gray-50 border border-gray-200 rounded-xl"
          >
            <p className="text-gray-500 text-sm mb-2">
              Questions about your data? We're here to help.
            </p>
            <a
              href="mailto:privacy@executioncabal.com"
              className="text-indigo-600 font-semibold hover:underline"
            >
              privacy@executioncabal.com
            </a>
            <p className="text-xs text-gray-400 mt-2">
              Execution Cabal · Lagos, Nigeria
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Execution Cabal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

// Check icon component needed for the rights section
const Check: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default PrivacyPolicy;
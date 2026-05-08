import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQItem: React.FC<{ question: string; answer: React.ReactNode }> = ({
  question,
  answer,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="font-bold text-gray-900 dark:text-white group-hover:text-system-blue transition-colors text-sm md:text-base pr-4">
          {question}
        </span>
        <ChevronDown
          className={`text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-system-blue" : ""}`}
          size={18}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-mono">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ: React.FC = () => {
  const faqs = [
    {
      q: "How does the XP System work?",
      a: (
        <>
          <p className="mb-2">
            XP (Experience Points) is your life force. It represents your
            productivity currency.
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Earning:</strong> Complete tasks (+50 XP), Verify proofs,
              or buy XP packs.
            </li>
            <li>
              <strong>Spending:</strong> Create Directives (-10 XP), Generate
              Plans (-30 XP), or buy Store items.
            </li>
            <li>
              <strong>Penalty:</strong> Failing a task costs -100 XP. Hitting 0
              XP suspends your account.
            </li>
          </ul>
        </>
      ),
    },
    {
      q: "What happens if I hit 0 XP?",
      a: "If your balance hits zero, your account is locked (Banned). You cannot access features until you purchase an XP top-up to revive your agent status. This creates real stakes for your productivity.",
    },
    {
      q: "How do I verify a task?",
      a: "When a timer is running, click 'Complete & Verify'. You must either write a description of what you did or upload a photo proof. The System Administrator analyzes your proof to determine if it is valid.",
    },
    {
      q: "Can I delete a task I created by mistake?",
      a: "Yes. If the task has not started yet (Status: IDLE), you can delete it. Once a task is RUNNING, you must either complete it or fail it. Deleting a running task is considered quitting.",
    },
    {
      q: "How do I withdraw earnings?",
      a: "Once your XP balance exceeds 1000, you can convert it to cash via the Wallet page. This systemizes your income—productivity literally pays.",
    },
    {
      q: "Why does creating a task cost 10 XP?",
      a: "To prevent clutter. Every directive should be meaningful. By charging a small fee, the system ensures you only create tasks you actually intend to do.",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="text-system-blue" size={24} />
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
          System Intelligence (FAQ)
        </h2>
      </div>
      <div className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        {faqs.map((f, i) => (
          <FAQItem key={i} question={f.q} answer={f.a} />
        ))}
      </div>
    </div>
  );
};

export default FAQ;

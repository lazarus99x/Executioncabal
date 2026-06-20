import React, { useState } from 'react';
import { Goal, Quest, Player } from '../types';
import { Target, Plus, Zap, Trash2, ChevronRight, Loader2, Calendar, MessageSquare, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GoalTrackerProps {
  goals: Goal[];
  player: Player;
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onGenerateTasks: (goal: Goal) => Promise<void>;
  isGenerating: boolean;
  onAIRespond?: (prompt: string) => Promise<string>;
}

const GoalTracker: React.FC<GoalTrackerProps> = ({ goals, player, onAddGoal, onDeleteGoal, onGenerateTasks, isGenerating, onAIRespond }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [step, setStep] = useState<'input' | 'qna' | 'preview'>('input');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const askAI = async (prompt: string): Promise<string> => {
    if (!onAIRespond) return '';
    try { return await onAIRespond(prompt); }
    catch { return ''; }
  };

  const handleCreateGoal = async () => {
    if (!newTitle.trim() || !newDeadline) return;
    setStep('qna');
    setLoadingAI(true);
    const qPrompt = `Given the goal: "${newTitle}" with deadline ${newDeadline}. Generate exactly 4 short relevant questions to ask the user that will help create a personalized daily task plan. The questions should be practical (skills, hours per day, current blockers, resources available). Return as a JSON array of strings. No markdown.`;
    const res = await askAI(qPrompt);
    try {
      const parsed = JSON.parse(res.replace(/```/g, ''));
      setQuestions(Array.isArray(parsed) ? parsed.slice(0, 4) : ['How many hours can you dedicate daily?', 'What skills/resources do you have?', 'What is your biggest blocker?', 'What is your current weekly commitment?']);
    } catch {
      setQuestions(['How many hours can you dedicate daily?', 'What skills/resources do you have?', 'What is your biggest blocker?', 'What is your current weekly commitment?']);
    }
    setAnswers([]);
    setCurrentQ(0);
    setCurrentAnswer('');
    setLoadingAI(false);
  };

  const handleAnswer = () => {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      generatePlan(newAnswers);
    }
  };

  const generatePlan = async (allAnswers: string[]) => {
    setLoadingAI(true);
    const context = allAnswers.map((a, i) => `Q: ${questions[i]}\nA: ${a}`).join('\n');
    const planPrompt = `Goal: "${newTitle}" by ${newDeadline}. User context:\n${context}\n\nGenerate a practical daily task plan (1-3 tasks per day) covering the remaining days. No more than 3 active tasks at once. Check NO time clashes. Return as numbered tasks with day labels. Be concise.`;
    const plan = await askAI(planPrompt);
    setGeneratedPlan(plan || 'Unable to generate plan. Please try again.');
    setStep('preview');
    setLoadingAI(false);
  };

  const handleApprove = () => {
    const goal: Goal = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: generatedPlan,
      notes: '',
      completed: false,
      deadline: new Date(newDeadline).getTime(),
    };
    onAddGoal(goal);
    // Also generate actual Quest tasks from the approved plan
    onGenerateTasks(goal);
    setNewTitle('');
    setNewDeadline('');
    setStep('input');
    setQuestions([]);
    setAnswers([]);
    setGeneratedPlan('');
    setShowAdd(false);
  };

  const handleRefine = () => {
    setStep('qna');
    setCurrentQ(0);
    setCurrentAnswer('');
  };

  const handleDeleteConfirm = (id: string) => {
    setShowConfirm(id);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 dark:border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">
              Strategic Objectives
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
              Set a goal. The AI will ask you questions and generate a daily action plan.
            </p>
          </div>
          <button onClick={() => { setShowAdd(true); setStep('input'); }} className="w-full md:w-auto bg-system-blue text-white dark:text-black font-bold font-mono px-4 py-3 md:py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-white transition-colors">
            <Plus size={16} /> SET OBJECTIVE
          </button>
        </header>

        {/* ADD / WIZARD MODAL */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-system-panel border border-system-blue/30 p-6 mb-8 rounded shadow-lg">
              {step === 'input' && (
                <>
                  <h3 className="text-system-blue font-bold font-mono mb-4">NEW OBJECTIVE</h3>
                  <input className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 rounded text-gray-900 dark:text-white mb-3 focus:border-system-blue outline-none" placeholder="e.g. Make $50 by month end, Learn React in 2 weeks" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="text-gray-500 shrink-0" size={16} />
                    <input type="date" className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 rounded text-gray-900 dark:text-white focus:border-system-blue outline-none text-sm w-full" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
                    <span className="text-gray-500 text-xs font-mono">Deadline</span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setShowAdd(false); setStep('input'); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm">CANCEL</button>
                    <button onClick={handleCreateGoal} disabled={!newTitle.trim() || !newDeadline || loadingAI} className="bg-system-blue text-white dark:text-black font-bold px-6 py-2 rounded text-sm flex items-center gap-2">
                      {loadingAI ? <Loader2 className="animate-spin" size={14} /> : <MessageSquare size={14} />}
                      CONTINUE
                    </button>
                  </div>
                </>
              )}

              {step === 'qna' && questions.length > 0 && (
                <>
                  <h3 className="text-system-blue font-bold font-mono mb-2 flex items-center gap-2">
                    <MessageSquare size={16} /> SMART ASSESSMENT
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Question {currentQ + 1} of {questions.length}</p>
                  <div className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{questions[currentQ]}</p>
                  </div>
                  <textarea className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 rounded text-gray-900 dark:text-white mb-3 h-20 focus:border-system-blue outline-none" placeholder="Type your answer..." value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnswer(); } }} />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setStep('input'); setQuestions([]); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm">BACK</button>
                    <button onClick={handleAnswer} disabled={!currentAnswer.trim() || loadingAI} className="bg-system-blue text-white dark:text-black font-bold px-6 py-2 rounded text-sm flex items-center gap-2">
                      {loadingAI ? <Loader2 className="animate-spin" size={14} /> : <ChevronRight size={14} />}
                      {currentQ < questions.length - 1 ? 'NEXT' : 'GENERATE PLAN'}
                    </button>
                  </div>
                </>
              )}

              {step === 'preview' && (
                <>
                  <h3 className="text-system-blue font-bold font-mono mb-2 flex items-center gap-2">
                    <Check size={16} /> GENERATED PLAN
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">AI-generated daily tasks for: <strong>{newTitle}</strong></p>
                  <div className="bg-gray-50 dark:bg-black/40 border border-system-blue/20 p-4 rounded-lg mb-4 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {loadingAI ? (
                      <div className="flex items-center gap-3 py-8 justify-center"><Loader2 className="animate-spin text-system-blue" size={20} /> Generating optimal plan...</div>
                    ) : generatedPlan}
                  </div>
                  {!loadingAI && (
                    <div className="flex justify-end gap-3">
                      <button onClick={handleRefine} className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded text-sm font-bold">REFINE</button>
                      <button onClick={handleApprove} className="bg-green-600 text-white font-bold px-6 py-2 rounded text-sm flex items-center gap-2 hover:bg-green-500">
                        <Check size={14} /> APPROVE & SET
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* GOAL LIST */}
        <div className="space-y-4">
          {goals.map(goal => (
            <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-system-blue/50 p-4 md:p-6 transition-colors group relative overflow-hidden shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="text-yellow-600 dark:text-system-gold shrink-0" size={20} />
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{goal.title}</h2>
                  </div>
                  {goal.deadline && (
                    <div className="text-xs font-mono text-system-red mb-2 flex items-center gap-1 pl-8">
                      <Calendar size={12} /> DEADLINE: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 pl-8 line-clamp-2">{goal.description || goal.notes}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => onGenerateTasks(goal)} disabled={isGenerating} className={`border px-4 py-2 rounded text-xs font-bold font-mono uppercase flex items-center gap-2 ${isGenerating ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-blue-50 dark:bg-system-blue/10 text-system-blue border-blue-200 dark:border-system-blue/30 hover:bg-system-blue hover:text-white dark:hover:text-black'}`}>
                    {isGenerating ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} />} GENERATE
                  </button>
                  <button onClick={() => handleDeleteConfirm(goal.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {goals.length === 0 && !showAdd && (
            <div className="text-center py-20 opacity-30">
              <Target size={64} className="mx-auto mb-4 text-gray-900 dark:text-white" />
              <p className="font-mono text-sm text-gray-900 dark:text-white">NO STRATEGIC OBJECTIVES SET</p>
              <p className="font-mono text-xs text-gray-500 mt-2">Click SET OBJECTIVE to create a goal with AI-powered task generation</p>
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowConfirm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-900 rounded-xl p-4 max-w-xs w-full shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-red-500 mb-2"><Trash2 size={28} className="mx-auto" /></div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Delete this Objective?</h4>
                <p className="text-xs text-gray-500">This action cannot be undone. The goal and its plan will be removed.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">CANCEL</button>
                <button onClick={() => { onDeleteGoal(showConfirm); setShowConfirm(null); }} className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">DELETE</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalTracker;
import React, { useState } from 'react';
import { Goal, Quest, Player } from '../types';
import { Target, Plus, Zap, Trash2, ChevronRight, Loader2, Calendar, MessageSquare, Check, X, Clock, ListChecks, CheckCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanTask {
  day: number;
  title: string;
  description: string;
  durationMinutes: number;
}

interface DailySection {
  day: number;
  date: string;
  tasks: PlanTask[];
}

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
  const [planDays, setPlanDays] = useState<DailySection[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const askAI = async (prompt: string): Promise<string> => {
    if (!onAIRespond) return '';
    try { return await onAIRespond(prompt); }
    catch { return ''; }
  };

  // Dynamic fallback questions based on goal title
  const fallbackQuestions = (title: string): string[] => {
    const lower = title.toLowerCase();
    if (lower.includes('money') || lower.includes('income') || lower.includes('dollar') || lower.includes('profit') || lower.includes('revenue')) {
      return [
        'What is your current monthly income source?',
        'How many hours per day can you dedicate to this income goal?',
        'What specific skill or method will you use to generate this income?',
        'What is the biggest financial obstacle standing in your way right now?'
      ];
    }
    if (lower.includes('learn') || lower.includes('skill') || lower.includes('course') || lower.includes('study') || lower.includes('cert')) {
      return [
        'What is your current experience level with this topic (beginner/intermediate/advanced)?',
        'How many hours per day can you commit to learning?',
        'What specific resources or materials do you already have?',
        'What is the most confusing part of this topic for you right now?'
      ];
    }
    if (lower.includes('health') || lower.includes('fitness') || lower.includes('weight') || lower.includes('gym') || lower.includes('workout')) {
      return [
        'What is your current fitness routine (if any)?',
        'How many days per week can you commit to exercise?',
        'Do you have any injuries or health restrictions?',
        'What specific equipment or gym access do you have?'
      ];
    }
    if (lower.includes('build') || lower.includes('create') || lower.includes('app') || lower.includes('project') || lower.includes('startup') || lower.includes('business')) {
      return [
        'What stage is this project at right now (idea/prototype/launched)?',
        'What specific skills do you need but currently lack?',
        'How many hours per day can you work on this?',
        'What is the single biggest blocker you face getting this done?'
      ];
    }
    return [
      'How many hours per day can you dedicate to this goal?',
      'What resources or tools do you already have?',
      'What is your biggest obstacle to achieving this?',
      'What does success look like on day 1 after starting?'
    ];
  };

  const handleCreateGoal = async () => {
    if (!newTitle.trim() || !newDeadline) return;
    setStep('qna');
    setLoadingAI(true);
    const qPrompt = `For the goal: "${newTitle}" (deadline: ${newDeadline}), generate exactly 4 unique, specific questions that will help create a personalized daily action plan. The questions MUST be directly relevant to "${newTitle}" — not generic. Return as a JSON array of 4 strings. No markdown, no backticks.`;
    const res = await askAI(qPrompt);
    try {
      const cleaned = res.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setQuestions(Array.isArray(parsed) && parsed.length >= 2 ? parsed.slice(0, 4) : fallbackQuestions(newTitle));
    } catch {
      setQuestions(fallbackQuestions(newTitle));
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
    const deadlineDate = new Date(newDeadline);
    const daysRemaining = Math.max(1, Math.ceil((deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

    const planPrompt = `Goal: "${newTitle}" by ${newDeadline} (${daysRemaining} days). User context:\n${context}\n\nGenerate a ${daysRemaining}-day roadmap with 1-3 tasks per day. Each task must be concrete, verifiable, and achievable in one session. Earlier tasks build a foundation, later tasks are more advanced.\n\nReturn valid JSON only (no markdown, no backticks):\n[\n  {\n    "day": 1,\n    "tasks": [\n      {"title": "Task title", "description": "Actionable description", "durationMinutes": 45}\n    ]\n  }\n]`;
    const plan = await askAI(planPrompt);
    try {
      const cleaned = plan.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const days: DailySection[] = Array.isArray(parsed)
        ? parsed.map((d: any) => ({
            day: d.day || 1,
            date: new Date(Date.now() + (d.day - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            tasks: Array.isArray(d.tasks) ? d.tasks.slice(0, 3) : [],
          }))
        : [];
      setPlanDays(days.length > 0 ? days : generateFallbackPlan(daysRemaining));
    } catch {
      setPlanDays(generateFallbackPlan(daysRemaining));
    }
    setStep('preview');
    setLoadingAI(false);
  };

  const generateFallbackPlan = (days: number): DailySection[] => {
    const result: DailySection[] = [];
    for (let d = 1; d <= Math.min(days, 14); d++) {
      result.push({
        day: d,
        date: new Date(Date.now() + (d - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        tasks: [
          { day: d, title: `Focus session: ${newTitle}`, description: `Dedicated block for ${newTitle} progress`, durationMinutes: 60 },
        ],
      });
    }
    return result;
  };

  const handleApprove = () => {
    const goal: Goal = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: `${planDays.length} day plan (${new Date(newDeadline).toLocaleDateString()})`,
      notes: planDays.map(d => `Day ${d.day}: ${d.tasks.map(t => t.title).join(', ')}`).join('\n'),
      completed: false,
      deadline: new Date(newDeadline).getTime(),
    };
    onAddGoal(goal);
    onGenerateTasks(goal);
    setNewTitle('');
    setNewDeadline('');
    setStep('input');
    setQuestions([]);
    setAnswers([]);
    setPlanDays([]);
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

  const totalTasks = planDays.reduce((sum, d) => sum + d.tasks.length, 0);
  const checkedTasks = useState<Set<string>>(new Set())[0];

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 dark:border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">
              Strategic Objectives
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
              Set a goal. The AI asks smart questions. Get a daily roadmap added to your directives.
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
                    <ListChecks size={16} /> DAILY ROADMAP
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    <strong>{newTitle}</strong> &mdash; {planDays.length} days &middot; {totalTasks} tasks &middot; deadline {new Date(newDeadline).toLocaleDateString()}
                  </p>

                  {loadingAI ? (
                    <div className="flex items-center gap-3 py-12 justify-center"><Loader2 className="animate-spin text-system-blue" size={24} /> Generating daily roadmap...</div>
                  ) : (
                    <>
                      {/* Summary bar */}
                      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-lg p-3 mb-4 flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400"><Calendar size={12} className="inline mr-1" /> {planDays.length} days</span>
                        <span className="text-gray-400"><ListChecks size={12} className="inline mr-1" /> {totalTasks} tasks</span>
                        <span className="text-cyan-400 font-bold">{Math.round((totalTasks * 50) / 10) * 10}+ XP</span>
                      </div>

                      {/* Day-by-day cards */}
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 mb-4">
                        {planDays.map((section) => (
                          <motion.div
                            key={section.day}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: section.day * 0.05 }}
                            className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                              <span className="text-xs font-bold text-system-blue font-mono">DAY {section.day}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{section.date}</span>
                            </div>
                            <div className="p-2 space-y-1">
                              {section.tasks.map((task, idx) => (
                                <div key={idx} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors">
                                  <Circle size={14} className="text-gray-400 shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{task.title}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{task.description}</p>
                                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                                      <Clock size={10} /> {task.durationMinutes} min
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={handleRefine} className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded text-sm font-bold">REFINE</button>
                        <button onClick={handleApprove} className="bg-green-600 text-white font-bold px-6 py-2 rounded text-sm flex items-center gap-2 hover:bg-green-500">
                          <Check size={14} /> APPROVE & ADD TO DIRECTIVES
                        </button>
                      </div>
                    </>
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
                  <div className="pl-8">
                    {goal.notes ? (
                      <div className="space-y-0.5">
                        {goal.notes.split('\n').filter(Boolean).map((line, i) => {
                          const dayMatch = line.match(/^Day (\d+):/);
                          if (dayMatch) {
                            return (
                              <div key={i} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                <ListChecks size={10} className="shrink-0 text-system-blue" />
                                <span className="text-system-blue font-bold">{dayMatch[0]}</span>
                                <span>{line.slice(dayMatch[0].length)}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{goal.description}</p>
                    )}
                  </div>
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
              <p className="font-mono text-xs text-gray-500 mt-2">Click SET OBJECTIVE to create a goal with AI-powered daily task generation</p>
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
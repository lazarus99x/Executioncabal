import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Clock, Calendar } from 'lucide-react';

interface KanbanCard {
  id: string;
  title: string;
  desc: string;
  energy: 'high' | 'mid' | 'low';
  colId: string;
  created: string;
  updated: string;
  startTime?: number;
  deadline?: number;
}

interface KanbanColumn {
  id: string;
  icon: string;
  title: string;
}

const COLUMNS: KanbanColumn[] = [
  { id: 'col-execute', icon: '🔥', title: 'execute now' },
  { id: 'col-hustle', icon: '🚀', title: 'side hustles' },
  { id: 'col-career', icon: '💼', title: 'career & brand' },
  { id: 'col-foundations', icon: '⚡', title: 'foundations' },
];

const ENERGY = { high: '⚡⚡⚡', mid: '⚡⚡', low: '⚡' };
const ENERGY_STYLE = {
  high: 'bg-red-500/15 text-red-400 border-red-500/25',
  mid: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  low: 'bg-green-500/15 text-green-400 border-green-500/25',
};

interface Props {
  onSave?: (cards: KanbanCard[]) => void;
  onLoad?: () => Promise<KanbanCard[]>;
  onCreateQuest?: (title: string, desc: string, startTime?: number, deadline?: number) => void;
}

const KanbanBoard: React.FC<Props> = ({ onSave, onLoad, onCreateQuest }) => {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [touchTarget, setTouchTarget] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<{ card?: KanbanCard; colId?: string } | null>(null);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mEnergy, setMEnergy] = useState<'high' | 'mid' | 'low'>('mid');
  const [mColId, setMColId] = useState('col-execute');
  const [mStart, setMStart] = useState('');
  const [mDead, setMDead] = useState('');

  // Track which cards already spawned a quest (persisted via localStorage as fallback)
  const [spawned, setSpawned] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ec_kanban_spawned') || '[]')); }
    catch { return new Set(); }
  });

  // Load from DB on mount, fallback to localStorage
  useEffect(() => {
    const ls = localStorage.getItem('ec_kanban_data');
    if (ls) {
      try { setCards(JSON.parse(ls)); } catch {}
    }
    if (onLoad) {
      onLoad().then(db => {
        if (db?.length) {
          setCards(db);
          localStorage.setItem('ec_kanban_data', JSON.stringify(db));
        }
      }).catch(() => {})
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  // Save to localStorage AND DB
  useEffect(() => {
    if (loading) return;
    localStorage.setItem('ec_kanban_data', JSON.stringify(cards));
    localStorage.setItem('ec_kanban_spawned', JSON.stringify(Array.from(spawned)));
    if (onSave) onSave(cards);
  }, [cards, spawned, loading]);

  const nt = () => Math.floor(Date.now() / 1000);
  const ts = (s?: number) => s ? new Date(s * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const openNew = (colId?: string) => {
    setModal({ colId: colId || 'col-execute' });
    setMTitle(''); setMDesc(''); setMEnergy('mid');
    setMColId(colId || 'col-execute'); setMStart(''); setMDead('');
  };

  const openEdit = (c: KanbanCard) => {
    setModal({ card: c });
    setMTitle(c.title); setMDesc(c.desc); setMEnergy(c.energy); setMColId(c.colId);
    setMStart(c.startTime ? new Date(c.startTime * 1000).toISOString().slice(0, 16) : '');
    setMDead(c.deadline ? new Date(c.deadline * 1000).toISOString().slice(0, 16) : '');
  };

  const save = () => {
    if (!mTitle.trim()) { show('Name required'); return; }
    const now = nt();
    const startT = mStart ? Math.floor(new Date(mStart).getTime() / 1000) : undefined;
    const deadT = mDead ? Math.floor(new Date(mDead).getTime() / 1000) : undefined;

    if (modal?.card) {
      setCards(p => p.map(c => c.id === modal.card!.id ? {
        ...c, title: mTitle.trim(), desc: mDesc.trim(), energy: mEnergy, colId: mColId,
        startTime: startT, deadline: deadT, updated: String(now),
      } : c));
      show('Updated');
    } else {
      const card: KanbanCard = {
        id: 'c' + now + Math.random().toString(36).slice(2, 6),
        title: mTitle.trim(), desc: mDesc.trim(), energy: mEnergy, colId: mColId,
        created: String(now), updated: String(now), startTime: startT, deadline: deadT,
      };
      setCards(p => [card, ...p]);
      show('Added');
    }
    setModal(null);
  };

  const del = (id: string) => { setCards(p => p.filter(c => c.id !== id)); show('Deleted'); };

  const move = (id: string, to: string) => {
    setCards(p => p.map(c => {
      if (c.id !== id) return c;
      // Auto-create quest on move to execute
      if (to === 'col-execute' && c.colId !== 'col-execute' && onCreateQuest && !spawned.has(id)) {
        setSpawned(prev => new Set(prev).add(id));
        setTimeout(() => onCreateQuest(c.title, c.desc, c.startTime, c.deadline), 50);
      }
      return { ...c, colId: to, updated: String(nt()) };
    }));
  };

  const drop = (colId: string) => {
    if (draggedId) { move(draggedId, colId); setDraggedId(null); }
    if (touchTarget) { move(touchTarget, colId); setTouchTarget(null); }
  };

  const exp = () => {
    const blob = new Blob([JSON.stringify({ cards }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `board-${new Date().toISOString().slice(0, 10)}.json`; a.click(); show('Exported');
  };

  const imp = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
    inp.onchange = (e: any) => {
      const f = e.target.files?.[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const d = JSON.parse(ev.target?.result as string);
          if (!d.cards) throw '';
          if (confirm(`Import ${d.cards.length} cards?`)) { setCards(d.cards); show(`Imported ${d.cards.length}`); }
        } catch { show('Invalid file'); }
      };
      reader.readAsText(f);
    };
    inp.click();
  };

  const byCol = (id: string) => cards.filter(c => c.colId === id);

  if (loading) return <div className="text-center py-8 text-gray-500 text-xs">Loading board...</div>;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Board</span>
          <span className="text-[10px] text-gray-500 font-mono bg-[#14141f] px-2 py-0.5 rounded border border-[#1e1e32]">{cards.length}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={exp} className="text-[9px] font-mono px-2 py-1 rounded bg-[#1e1e32] text-gray-400 hover:text-white active:scale-95 transition-all">⬇</button>
          <button onClick={imp} className="text-[9px] font-mono px-2 py-1 rounded bg-[#1e1e32] text-gray-400 hover:text-white active:scale-95 transition-all">⬆</button>
          <button onClick={() => openNew()} className="text-[9px] font-mono px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all">+ add</button>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {COLUMNS.map(col => {
          const colCards = byCol(col.id);
          return (
            <div key={col.id} className="bg-[#0f0f1a] rounded-lg border border-[#1a1a2e] flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#1a1a2e]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm">{col.icon}</span>
                  <span className="text-[10px] font-bold uppercase text-gray-300 truncate">{col.title}</span>
                  <span className="text-[9px] text-gray-500 bg-[#1a1a2e] px-1.5 rounded-full">{colCards.length}</span>
                </div>
                <button onClick={() => openNew(col.id)} className="text-gray-600 hover:text-gray-300 p-0.5"><Plus size={13} /></button>
              </div>
              <div
                className="flex-1 p-1.5 space-y-1 min-h-[50px]"
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.background = '#14142a'; }}
                onDragLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.background = ''; drop(col.id); }}
                onTouchEnd={() => drop(col.id)}
              >
                {colCards.length === 0 ? (
                  <div className="text-center py-5 text-[#3f3f5e] text-[9px]">+ drop here</div>
                ) : (
                  colCards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => setDraggedId(card.id)}
                      onDragEnd={() => setDraggedId(null)}
                      onTouchStart={() => setTouchTarget(card.id)}
                      onTouchEnd={e => { e.preventDefault(); setTouchTarget(null); }}
                      className="bg-[#14142a] border border-[#1e1e3a] rounded-lg p-2 cursor-grab active:cursor-grabbing hover:border-[#36366a] transition-all group touch-manipulation"
                    >
                      <div className="flex items-start gap-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-200 leading-snug break-words">{card.title}</div>
                          {card.desc && <div className="text-[9px] text-gray-500 mt-0.5 line-clamp-1">{card.desc}</div>}
                        </div>
                        <button onClick={() => del(card.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-0.5 transition-opacity shrink-0"><Trash2 size={10} /></button>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-semibold ${ENERGY_STYLE[card.energy]}`}>{ENERGY[card.energy]}</span>
                        {card.startTime && <span className="text-[8px] text-gray-600 flex items-center gap-0.5"><Clock size={8} />{ts(card.startTime)}</span>}
                        {card.deadline && <span className="text-[8px] text-orange-400/60 flex items-center gap-0.5"><Calendar size={8} />{ts(card.deadline)}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[7px] text-[#3f3f5e]">{ts(Number(card.created))}</span>
                        <button onClick={() => openEdit(card)} className="text-[8px] text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">✎</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile FAB */}
      <button onClick={() => openNew()} className="fixed bottom-6 right-6 sm:hidden w-11 h-11 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center active:scale-90 z-40"><Plus size={20} /></button>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3"
            onClick={() => setModal(null)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#14142a] border border-[#2a2a45] rounded-xl p-4 w-full max-w-xs shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-sm font-bold text-white mb-3">{modal?.card ? 'Edit' : 'New Task'}</h2>
              <input className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:border-indigo-500" placeholder="Task" maxLength={60} value={mTitle} onChange={e => setMTitle(e.target.value)} autoFocus />
              <textarea className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:border-indigo-500 resize-none" placeholder="Notes" maxLength={200} rows={1} value={mDesc} onChange={e => setMDesc(e.target.value)} />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-wide block mb-0.5">⚡ Energy</label>
                  <select className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500" value={mEnergy} onChange={e => setMEnergy(e.target.value as any)}>
                    <option value="high">⚡⚡⚡ High</option>
                    <option value="mid">⚡⚡ Medium</option>
                    <option value="low">⚡ Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-wide block mb-0.5">📋 Column</label>
                  <select className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500" value={mColId} onChange={e => setMColId(e.target.value)}>
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-wide block mb-0.5">🕐 Start</label>
                  <input type="datetime-local" className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded px-2 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500" value={mStart} onChange={e => setMStart(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-wide block mb-0.5">⏰ Deadline</label>
                  <input type="datetime-local" className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded px-2 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500" value={mDead} onChange={e => setMDead(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-[#1e1e32] text-gray-400 hover:bg-[#2a2a45]">CANCEL</button>
                <button onClick={save} className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95">{modal?.card ? 'UPDATE' : 'ADD'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 bg-[#1a1a2e] border border-[#2a2a45] px-3 py-2 rounded-lg text-xs text-gray-200 shadow-xl z-[200] text-center max-w-[200px] mx-auto sm:mx-0">{toast}</motion.div>}</AnimatePresence>
    </div>
  );
};

export default KanbanBoard;
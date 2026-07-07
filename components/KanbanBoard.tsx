import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';

interface KanbanCard {
  id: string;
  title: string;
  desc: string;
  energy: 'high' | 'mid' | 'low';
  colId: string;
  created: string;
  updated: string;
}

interface KanbanColumn {
  id: string;
  icon: string;
  title: string;
  color: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'col-execute', icon: '🔥', title: 'execute now', color: '#f87171' },
  { id: 'col-hustle', icon: '🚀', title: 'side hustles', color: '#818cf8' },
  { id: 'col-career', icon: '💼', title: 'career & brand', color: '#34d399' },
  { id: 'col-foundations', icon: '⚡', title: 'foundations', color: '#fbbf24' },
];

const ENERGY_LABELS: Record<string, string> = { high: '⚡⚡⚡ crush', mid: '⚡⚡ steady', low: '⚡ light' };

const STORAGE_KEY = 'ec_kanban_data';
const CREATED_IDS_KEY = 'ec_kanban_created_quests';

interface KanbanBoardProps {
  onSave?: (cards: KanbanCard[]) => void;
  onLoad?: () => Promise<KanbanCard[]>;
  onCreateQuest?: (title: string, desc: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onSave, onLoad, onCreateQuest }) => {
  const [columns] = useState<KanbanColumn[]>(DEFAULT_COLUMNS);
  const [cards, setCards] = useState<KanbanCard[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [modalColId, setModalColId] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalEnergy, setModalEnergy] = useState<'high' | 'mid' | 'low'>('mid');
  const [toast, setToast] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [touchDragId, setTouchDragId] = useState<string | null>(null);

  // Track which card IDs have already spawned a quest
  const [createdQuestIds, setCreatedQuestIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(CREATED_IDS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem(CREATED_IDS_KEY, JSON.stringify(Array.from(createdQuestIds)));
  }, [createdQuestIds]);

  useEffect(() => {
    if (onLoad) {
      onLoad().then(dbCards => {
        if (dbCards && dbCards.length > 0) {
          setCards(dbCards);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dbCards));
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    if (onSave) onSave(cards);
  }, [cards]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const nowStr = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const openNewCard = (colId?: string) => {
    setEditId(null); setModalTitle(''); setModalDesc(''); setModalEnergy('mid');
    setModalColId(colId || columns[0].id); setShowModal(true);
  };

  const openEditCard = (card: KanbanCard) => {
    setEditId(card.id); setModalTitle(card.title); setModalDesc(card.desc);
    setModalEnergy(card.energy); setModalColId(card.colId); setShowModal(true);
  };

  const saveCard = () => {
    if (!modalTitle.trim()) { showToast('Task needs a name'); return; }
    const now = nowStr();
    if (editId) {
      setCards(prev => prev.map(c =>
        c.id === editId ? { ...c, title: modalTitle.trim(), desc: modalDesc.trim(), energy: modalEnergy, colId: modalColId, updated: now } : c
      ));
      showToast('Task updated ✓');
    } else {
      const newCard: KanbanCard = {
        id: 'c' + Date.now() + Math.random().toString(36).slice(2, 6),
        title: modalTitle.trim(), desc: modalDesc.trim(), energy: modalEnergy,
        colId: modalColId, created: now, updated: now,
      };
      setCards(prev => [newCard, ...prev]);
      showToast('Task added ✓');
    }
    setShowModal(false);
  };

  const deleteCard = (id: string) => {
    if (!confirm('Delete this task?')) return;
    setCards(prev => prev.filter(c => c.id !== id));
    showToast('Task deleted');
  };

  const moveCard = (cardId: string, targetColId: string) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId);
      if (!card) return prev;
      const updated = prev.map(c => c.id === cardId ? { ...c, colId: targetColId, updated: nowStr() } : c);
      
      // Auto-create quest when moved to execute now
      if (targetColId === 'col-execute' && card.colId !== 'col-execute') {
        if (onCreateQuest && !createdQuestIds.has(cardId)) {
          setCreatedQuestIds(prev => new Set(prev).add(cardId));
          setTimeout(() => onCreateQuest(card.title, card.desc), 100);
        }
      }
      return updated;
    });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ columns, cards }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kanban-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url); showToast('Exported ✓');
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (!imported.columns || !imported.cards) throw new Error('invalid');
          if (confirm(`Import ${imported.cards.length} cards? Current data will be replaced.`)) {
            setCards(imported.cards); showToast(`Imported ${imported.cards.length} cards ✓`);
          }
        } catch { showToast('Invalid file — not a kanban export'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getColCards = (colId: string) => cards.filter(c => c.colId === colId);
  const totalCards = cards.length;

  const handleDrop = (colId: string) => {
    if (draggedId) { moveCard(draggedId, colId); setDraggedId(null); }
    if (touchDragId) { moveCard(touchDragId, colId); setTouchDragId(null); }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Header - mobile first */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">⚡ Board</h3>
          <div className="flex gap-1.5 text-[10px] font-mono text-gray-500">
            <span className="bg-[#14141f] px-2 py-1 rounded border border-[#1e1e32]">
              <strong className="text-white">{totalCards}</strong> tasks
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={exportData} className="text-[9px] sm:text-[10px] font-bold font-mono px-2 py-1.5 rounded bg-[#1e1e32] border border-[#2a2a45] text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation">
            ⬇ export
          </button>
          <button onClick={importData} className="text-[9px] sm:text-[10px] font-bold font-mono px-2 py-1.5 rounded bg-[#1e1e32] border border-[#2a2a45] text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation">
            ⬆ import
          </button>
          <button onClick={() => { if (confirm('Clear all board data?')) { localStorage.removeItem(STORAGE_KEY); setCards([]); showToast('Cleared'); } }} className="text-[9px] sm:text-[10px] font-bold font-mono px-2 py-1.5 rounded bg-[#1e1e32] border border-[#2a2a45] text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation">
            ⟳ reset
          </button>
          <button onClick={() => openNewCard()} className="text-[9px] sm:text-[10px] font-bold font-mono px-2.5 py-1.5 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg active:scale-95 transition-all touch-manipulation">
            + new task
          </button>
        </div>
      </div>

      {/* Board - single column mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {columns.map(col => {
          const colCards = getColCards(col.id);
          return (
            <div key={col.id} className="bg-[#0f0f1a] rounded-xl border border-[#1a1a2e] flex flex-col min-h-[180px] sm:min-h-[250px]">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2.5 sm:px-3 py-2 border-b border-[#1a1a2e]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm sm:text-base shrink-0">{col.icon}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-gray-300 truncate">{col.title}</span>
                  <span className="text-[9px] sm:text-[10px] bg-[#1a1a2e] px-1.5 sm:px-2 py-0.5 rounded-full text-gray-500 font-semibold shrink-0">{colCards.length}</span>
                </div>
                <button onClick={() => openNewCard(col.id)} className="text-gray-600 hover:text-gray-300 hover:bg-[#1a1a2e] p-1 rounded transition-colors touch-manipulation">
                  <Plus size={14} />
                </button>
              </div>

              {/* Cards Container - mobile tap to select target, desktop drag */}
              <div
                className="flex-1 p-1.5 sm:p-2 space-y-1.5 min-h-[60px] overflow-y-auto"
                onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).style.background = '#14142a'; (e.currentTarget as HTMLElement).style.borderRadius = '8px'; }}
                onDragLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onDrop={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).style.background = 'transparent'; handleDrop(col.id); }}
                onTouchMove={(e) => { e.preventDefault(); }}
                onTouchEnd={() => handleDrop(col.id)}
              >
                {colCards.length === 0 ? (
                  <div className="text-center py-5 sm:py-6 text-[#3f3f5e] text-[10px] sm:text-[11px]">
                    <span className="text-xl sm:text-2xl block mb-0.5">+</span>
                    drop here
                  </div>
                ) : (
                  colCards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => setDraggedId(card.id)}
                      onDragEnd={() => setDraggedId(null)}
                      onTouchStart={() => setTouchDragId(card.id)}
                      onTouchEnd={(e) => { e.preventDefault(); setTouchDragId(null); }}
                      className="bg-[#14142a] border border-[#1e1e3a] rounded-lg p-2.5 sm:p-3 cursor-grab active:cursor-grabbing hover:border-[#36366a] hover:bg-[#181830] transition-all select-none touch-manipulation"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] sm:text-[13px] font-semibold text-gray-200 leading-relaxed break-words">{card.title}</div>
                          {card.desc && <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1 leading-relaxed break-words line-clamp-2">{card.desc}</div>}
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); openEditCard(card); }} className="text-gray-600 hover:text-gray-300 p-1 rounded hover:bg-[#2a2a45] touch-manipulation hidden sm:block">
                            <Edit2 size={10} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="text-gray-600 hover:text-red-400 p-1 rounded hover:bg-[#2a1a1a] touch-manipulation">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                            card.energy === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            card.energy === 'mid' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {ENERGY_LABELS[card.energy]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] sm:text-[9px] text-[#3f3f5e]">{card.created}</span>
                          {card.updated !== card.created && <span className="text-[7px] sm:text-[8px] text-[#2a2a45]">· upd</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile floating action button */}
      <button
        onClick={() => openNewCard()}
        className="fixed bottom-6 right-6 sm:hidden w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl flex items-center justify-center active:scale-90 transition-all z-40 touch-manipulation"
      >
        <Plus size={22} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#14142a] border border-[#2a2a45] rounded-xl p-4 sm:p-5 w-full max-w-sm shadow-2xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-sm font-bold text-white mb-3">{editId ? 'Edit Task' : 'New Task'}</h2>
              <input className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded-lg px-3 py-2.5 text-sm text-white mb-2.5 outline-none focus:border-indigo-500" placeholder="Task name" maxLength={60} value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} autoFocus />
              <textarea className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white mb-2.5 outline-none focus:border-indigo-500 resize-none" placeholder="Notes (optional)" maxLength={200} rows={2} value={modalDesc} onChange={(e) => setModalDesc(e.target.value)} />
              <div className="mb-3">
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide block mb-1">Energy ⚡</label>
                <select className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded-lg px-2.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500" value={modalEnergy} onChange={(e) => setModalEnergy(e.target.value as any)}>
                  <option value="high">High ⚡⚡⚡</option>
                  <option value="mid">Medium ⚡⚡</option>
                  <option value="low">Low ⚡</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide block mb-1">Column</label>
                <select className="w-full bg-[#0a0a0f] border border-[#1e1e3a] rounded-lg px-2.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500" value={modalColId} onChange={(e) => setModalColId(e.target.value)}>
                  {columns.map(c => (<option key={c.id} value={c.id}>{c.icon} {c.title}</option>))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowModal(false)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold bg-[#1e1e32] text-gray-400 hover:bg-[#2a2a45] transition-colors touch-manipulation">CANCEL</button>
                <button onClick={saveCard} className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md active:scale-95 transition-all touch-manipulation">{editId ? 'UPDATE' : 'ADD TASK'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto bg-[#1a1a2e] border border-[#2a2a45] px-3 sm:px-4 py-2.5 rounded-lg text-xs text-gray-200 shadow-xl z-[200] text-center"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanBoard;
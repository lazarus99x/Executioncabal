
import React, { useState } from 'react';
import { Client, Currency } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, User, DollarSign, Calendar, Plus, Trash2, Download, Search, X, Mail, Phone, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ClientTrackerProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (id: string, updates: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  currency?: Currency;
}

const ClientTracker: React.FC<ClientTrackerProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient, currency = 'USD' }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({});
  const [filter, setFilter] = useState('ALL');
  
  // State for the Detailed Profile Modal
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  const handleAdd = () => {
    if (!newClient.name || !newClient.projectDetails) return;
    onAddClient({
      id: crypto.randomUUID(),
      name: newClient.name,
      contact: newClient.contact || '',
      projectDetails: newClient.projectDetails,
      status: 'PROSPECT',
      value: Number(newClient.value) || 0,
      deadline: newClient.deadline,
    });
    setNewClient({});
    setShowAdd(false);
  };

  const filteredClients = clients.filter(c => filter === 'ALL' || c.status === filter);

  const exportClients = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clients, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `EXECUTION_CABAL_CLIENTS_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'PAID': return 'text-yellow-600 dark:text-system-gold border-yellow-600 dark:border-system-gold bg-yellow-100 dark:bg-yellow-900/20';
        case 'ACTIVE': return 'text-system-blue border-system-blue bg-blue-100 dark:bg-blue-900/20';
        case 'COMPLETED': return 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 bg-green-100 dark:bg-green-900/20';
        default: return 'text-gray-500 border-gray-500 bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">Client Database</h1>
            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">Manage external contracts and revenue sources.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportClients} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-white dark:hover:text-black text-gray-900 dark:text-white p-3 rounded-lg transition-colors" title="Export Data">
                <Download size={20} />
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="bg-system-blue text-white dark:text-black font-bold px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-white transition-colors active:scale-95">
                <Plus size={20} /> ADD CLIENT
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            {['ALL', 'PROSPECT', 'ACTIVE', 'COMPLETED', 'PAID'].map(status => (
                <button 
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold border whitespace-nowrap transition-colors ${filter === status ? 'bg-system-blue text-white dark:text-black border-system-blue' : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-800'}`}
                >
                    {status}
                </button>
            ))}
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
                    <input placeholder="Client Name" className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-600 p-3 rounded text-gray-900 dark:text-white text-sm outline-none focus:border-system-blue" onChange={e => setNewClient({...newClient, name: e.target.value})} />
                    <input placeholder="Contact Info" className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-600 p-3 rounded text-gray-900 dark:text-white text-sm outline-none focus:border-system-blue" onChange={e => setNewClient({...newClient, contact: e.target.value})} />
                    <input placeholder="Project Name/Details" className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-600 p-3 rounded text-gray-900 dark:text-white text-sm outline-none focus:border-system-blue md:col-span-2" onChange={e => setNewClient({...newClient, projectDetails: e.target.value})} />
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-600 p-3 rounded">
                        <DollarSign size={16} className="text-yellow-600 dark:text-system-gold" />
                        <input type="number" placeholder="Value" className="bg-transparent text-gray-900 dark:text-white text-sm outline-none w-full" onChange={e => setNewClient({...newClient, value: Number(e.target.value)})} />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-600 p-3 rounded">
                        <Calendar size={16} className="text-gray-400" />
                        <input type="date" className="bg-transparent text-gray-900 dark:text-white text-sm outline-none w-full" onChange={e => setNewClient({...newClient, deadline: new Date(e.target.value).getTime()})} />
                    </div>
                    <button onClick={handleAdd} className="md:col-span-2 bg-system-blue text-white dark:text-black font-bold py-3 rounded hover:bg-blue-600 dark:hover:bg-white transition-colors uppercase tracking-wide">CONFIRM ENTRY</button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Client List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
                <motion.div 
                    key={client.id} 
                    layout 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    onClick={() => setSelectedClient(client)}
                    className="bg-white dark:bg-system-panel border border-gray-200 dark:border-gray-800 p-5 hover:border-system-blue transition-all group relative shadow-sm cursor-pointer hover:shadow-lg rounded-xl"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <Briefcase size={18} className="text-system-blue" />
                            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] text-lg">{client.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-1 rounded border font-bold ${getStatusColor(client.status)}`}>
                            {client.status}
                        </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-10 line-clamp-2 leading-relaxed">{client.projectDetails}</p>
                    
                    <div className="flex justify-between items-end text-xs font-mono">
                        <div>
                            <div className="text-gray-500 mb-1 font-bold">VALUE</div>
                            <div className="text-yellow-600 dark:text-system-gold font-bold text-xl">{currencySymbol}{client.value.toLocaleString()}</div>
                        </div>
                        {client.deadline && (
                            <div className="text-right">
                                <div className="text-gray-500 mb-1 font-bold">DEADLINE</div>
                                <div className={client.deadline < Date.now() ? 'text-system-red font-bold' : 'text-gray-900 dark:text-white font-bold'}>
                                    {new Date(client.deadline).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions (Stop Propagation to prevent opening modal) */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteClient(client.id); }} 
                            className="p-2 bg-red-100 dark:bg-red-900/80 text-red-600 dark:text-white rounded-lg hover:bg-red-200 dark:hover:bg-red-600"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Status Toggle (Stop Propagation) */}
                    <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-1.5">
                         {(['PROSPECT', 'ACTIVE', 'COMPLETED', 'PAID'] as const).map(s => (
                             <button 
                                key={s} 
                                onClick={(e) => { e.stopPropagation(); onUpdateClient(client.id, { status: s }); }}
                                className={`flex-1 h-2 rounded-full transition-colors ${client.status === s ? 'bg-system-blue shadow-[0_0_5px_rgba(0,162,255,0.5)]' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                title={`Set to ${s}`}
                             />
                         ))}
                    </div>
                </motion.div>
            ))}
            
            {filteredClients.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-400 dark:text-gray-600 font-mono">NO DATA FOUND</div>
            )}
        </div>

        {/* Detailed Profile Modal */}
        <AnimatePresence>
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedClient(null)}>
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl bg-white dark:bg-[#0A0C10] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-gray-50 dark:bg-[#111318]">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-system-blue shadow-lg">
                                    <User size={32} className="text-gray-400 dark:text-gray-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                                        {selectedClient.name}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(selectedClient.status)}`}>
                                            {selectedClient.status}
                                        </span>
                                        <span className="text-[10px] font-mono text-gray-500 uppercase">ID: {selectedClient.id.substring(0,8)}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedClient(null)}
                                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            
                            {/* Key Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                                    <div className="text-xs text-gray-500 font-mono uppercase mb-1 flex items-center gap-1">
                                        <DollarSign size={12} /> Project Value
                                    </div>
                                    <div className="text-2xl font-black text-yellow-600 dark:text-system-gold">
                                        {currencySymbol}{selectedClient.value.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                                    <div className="text-xs text-gray-500 font-mono uppercase mb-1 flex items-center gap-1">
                                        <Clock size={12} /> Deadline
                                    </div>
                                    <div className={`text-lg font-bold ${selectedClient.deadline && selectedClient.deadline < Date.now() ? 'text-system-red' : 'text-gray-900 dark:text-white'}`}>
                                        {selectedClient.deadline ? new Date(selectedClient.deadline).toLocaleDateString() : 'N/A'}
                                    </div>
                                    {selectedClient.deadline && (
                                        <div className="text-[10px] text-gray-500">
                                            {Math.ceil((selectedClient.deadline - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                                    <div className="text-xs text-gray-500 font-mono uppercase mb-1 flex items-center gap-1">
                                        <Mail size={12} /> Contact
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white break-words">
                                        {selectedClient.contact || 'No Info'}
                                    </div>
                                </div>
                            </div>

                            {/* Project Dossier */}
                            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Briefcase size={16} className="text-system-blue" />
                                    Project Dossier
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedClient.projectDetails}
                                </p>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111318] flex flex-col md:flex-row justify-between items-center gap-4">
                             <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                {(['PROSPECT', 'ACTIVE', 'COMPLETED', 'PAID'] as const).map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => {
                                            onUpdateClient(selectedClient.id, { status: s });
                                            setSelectedClient(prev => prev ? ({...prev, status: s}) : null);
                                        }}
                                        className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase border transition-colors whitespace-nowrap ${selectedClient.status === s ? 'bg-system-blue border-system-blue text-white' : 'bg-transparent border-gray-300 dark:border-gray-700 text-gray-500 hover:border-gray-400 dark:hover:border-gray-500'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                             </div>
                             
                             <button 
                                onClick={() => {
                                    onDeleteClient(selectedClient.id);
                                    setSelectedClient(null);
                                }}
                                className="flex items-center gap-2 text-system-red hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-3 rounded-lg transition-colors text-xs font-bold uppercase w-full md:w-auto justify-center"
                             >
                                <Trash2 size={18} /> Delete Record
                             </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ClientTracker;


import React, { useState, useEffect } from 'react';
import { Player, StoreItem, StoreCategory, Rank, Currency } from '../types';
import { ShoppingBag, Lock, Zap, CreditCard, Coins, Wallet, ExternalLink, Filter, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchStoreCategories } from '../lib/supabase';

interface StoreProps {
  player: Player;
  storeItems: StoreItem[];
  onPurchase: (item: StoreItem) => void;
  onBuyXP: () => void;
  currency?: Currency;
}

const Store: React.FC<StoreProps> = ({ player, storeItems, onPurchase, onBuyXP, currency = 'USD' }) => {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchStoreCategories().then(setCategories);
  }, []);

  const filteredItems = storeItems.filter(item => 
    selectedCategory === 'ALL' || item.type === selectedCategory
  );

  const xpPrice = currency === 'NGN' ? '₦2,500' : '$5.00';

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 relative">
       <div className="max-w-6xl mx-auto pb-20">
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 dark:border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">
              System Shop
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
              Exchange accumulated XP for system enhancements and exclusive artifacts.
            </p>
          </div>
          <div className="text-left md:text-right bg-gray-100 dark:bg-gray-900/50 p-3 rounded md:bg-transparent md:p-0">
            <div className="text-xs text-gray-500 font-mono mb-1">AVAILABLE BALANCE (TOTAL)</div>
            <div className="text-2xl font-bold text-system-blue font-mono text-shadow-glow flex items-center gap-2 justify-end">
              <Wallet size={20} />
              {player.currentXp.toLocaleString()} XP
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 custom-scrollbar">
            <button
                onClick={() => setSelectedCategory('ALL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-all ${selectedCategory === 'ALL' ? 'bg-system-blue text-white border-system-blue' : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
            >
                <Filter size={14} /> ALL
            </button>
            {categories.map(cat => (
                 <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-all ${selectedCategory === cat.id ? 'bg-white dark:bg-gray-800 text-black dark:text-white border-system-blue' : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                >
                    {cat.name}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* REAL MONEY XP PURCHASE CARD */}
          {(selectedCategory === 'ALL' || selectedCategory === 'SPECIAL') && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group border-2 border-system-gold bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-black p-6 flex flex-col justify-between h-auto min-h-[320px] shadow-[0_0_20px_rgba(255,215,0,0.1)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all rounded-xl overflow-hidden"
            >
                <div className="absolute top-0 right-0 bg-system-gold text-black text-[10px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-lg z-10">
                    Essential
                </div>
                
                <div className="mb-4 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                        <Coins size={32} className="text-yellow-700 dark:text-system-gold" />
                    </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 uppercase italic tracking-tight">
                    XP Injection
                    </h3>
                    <div className="text-4xl font-mono font-bold text-system-gold mb-4">+1,000 XP</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Purchase Action XP securely through checkout. First purchase gets +500 bonus XP at the same entry price.
                    </p>
                </div>

                <button
                onClick={onBuyXP}
                className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 bg-gray-900 text-white dark:bg-system-gold dark:text-black hover:opacity-90 transition-opacity rounded-lg relative z-10"
                >
                    <CreditCard size={18} />
                    {xpPrice}
                </button>
            </motion.div>
          )}

          {/* DYNAMIC STORE ITEMS */}
          {filteredItems.map((item) => {
            const canAfford = player.currentXp >= item.cost;
            const isLocked = player.rank === Rank.E; // Locked if Novice (Rank E)
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  relative group border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-between h-auto min-h-[320px] rounded-xl overflow-hidden
                  ${(canAfford && !isLocked) ? 'hover:border-system-blue hover:shadow-[0_0_20px_rgba(0,162,255,0.2)]' : 'opacity-60 grayscale'}
                  transition-all duration-300
                `}
              >
                {/* LOCKED OVERLAY */}
                {isLocked && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 text-center p-4 backdrop-blur-sm">
                        <Lock className="text-gray-500 mb-2" size={32} />
                        <span className="text-xs font-bold text-gray-400 uppercase">Locked</span>
                        <span className="text-[10px] text-system-red font-mono mt-1">REQ: RANK D</span>
                    </div>
                )}

                {/* Item Image */}
                <div className="h-40 w-full bg-gray-100 dark:bg-black/50 relative overflow-hidden">
                    {item.image_url ? (
                        <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                             {item.type === 'CONSUMABLE' && <Zap size={40} className="text-gray-400" />}
                             {item.type === 'SPECIAL' && <Lock size={40} className="text-gray-400" />}
                             {item.type === 'EQUIPMENT' && <ShoppingBag size={40} className="text-gray-400" />}
                             {item.type === 'KNOWLEDGE' && <BookOpen size={40} className="text-gray-400" />}
                        </div>
                    )}
                    
                    {/* Badge */}
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded border border-gray-700">
                        {item.type}
                    </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4 flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-system-blue transition-colors uppercase tracking-tight">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                    {item.content_link && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-system-blue font-mono">
                            <ExternalLink size={10} /> INCLUDES DIGITAL CONTENT
                        </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                        if (canAfford && !isLocked) {
                             if (item.content_link) {
                                 // Auto-open link on purchase for this demo
                                 window.open(item.content_link, '_blank');
                             }
                             onPurchase(item);
                        }
                    }}
                    disabled={!canAfford || isLocked}
                    className={`
                      w-full py-3 font-mono font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 rounded-lg
                      ${canAfford && !isLocked
                        ? 'bg-system-blue text-white dark:text-black hover:bg-blue-600 dark:hover:bg-white transition-colors active:scale-95' 
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}
                    `}
                  >
                    {item.content_link ? <ExternalLink size={16} /> : <ShoppingBag size={16} />}
                    {item.cost.toLocaleString()} XP
                  </button>
                </div>
              </motion.div>
            );
          })}
          
          {filteredItems.length === 0 && selectedCategory !== 'ALL' && selectedCategory !== 'SPECIAL' && (
              <div className="col-span-full py-20 text-center opacity-50 font-mono text-sm">
                  NO ITEMS FOUND IN CATEGORY: {selectedCategory}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Store;

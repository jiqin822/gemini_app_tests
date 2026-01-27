import React, { useState, useEffect } from 'react';
import { UserProfile, EconomyConfig, MarketItem, LovedOne, Transaction, TransactionStatus } from '../types';
import { Gift, Star, Check, X, Lock, Shield, Settings, Plus, DollarSign, Wallet, ShoppingBag, Trash2, Users, ChevronDown, User, Tag, AlertCircle, Package, Clock, Archive, ArrowLeft, Pencil } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateLovedOne: (id: string, updates: Partial<LovedOne>) => void;
  onUpdateProfile: (user: UserProfile) => void;
  onExit: () => void;
}

const CURRENCY_PRESETS = [
    { name: 'Love Tokens', symbol: '🪙' },
    { name: 'Hearts', symbol: '❤️' },
    { name: 'Stars', symbol: '⭐' },
    { name: 'Flowers', symbol: '🌹' },
    { name: 'Cookies', symbol: '🍪' },
    { name: 'Gems', symbol: '💎' },
];

export const RewardsMode: React.FC<Props> = ({ user, onUpdateLovedOne, onUpdateProfile, onExit }) => {
  const [selectedLovedOneId, setSelectedLovedOneId] = useState<string | null>(user.lovedOnes.length > 0 ? user.lovedOnes[0].id : null);
  
  // View State
  const [viewMode, setViewMode] = useState<'market' | 'vault'>('market');
  const [marketTab, setMarketTab] = useState<'earn' | 'spend'>('spend');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{ item: MarketItem, action: 'buy' | 'accept' } | null>(null);
  
  // New Item State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('🎁');
  const [newItemCategory, setNewItemCategory] = useState<'earn' | 'spend'>('spend');

  // Derived state for the MAIN selection (used for Market view)
  const selectedLovedOne = user.lovedOnes.find(l => l.id === selectedLovedOneId);

  useEffect(() => {
      // Auto-select first if current selection invalid
      if (!selectedLovedOne && user.lovedOnes.length > 0) {
          setSelectedLovedOneId(user.lovedOnes[0].id);
      }
  }, [user.lovedOnes, selectedLovedOne]);

  // --- Transactions Logic ---

  const initiateTransaction = (item: MarketItem) => {
      if (!selectedLovedOne) return;
      const balance = selectedLovedOne.balance || 0;
      
      if (item.category === 'spend') {
          // Check balance
          if (balance < item.cost) {
              alert("Insufficient funds for this item.");
              return;
          }
          setConfirmModal({ item, action: 'buy' });
      } else {
          // Check if already active
          const active = selectedLovedOne.transactions?.find(t => t.itemId === item.id && (t.status === 'accepted' || t.status === 'pending_approval'));
          if (active) {
              alert("You already have this quest active in your Vault.");
              return;
          }
          setConfirmModal({ item, action: 'accept' });
      }
  };

  const executeTransaction = () => {
      if (!confirmModal || !selectedLovedOne || !selectedLovedOne.economy) return;
      
      const { item, action } = confirmModal;
      const currentBalance = selectedLovedOne.balance || 0;
      const currentTransactions = selectedLovedOne.transactions || [];

      const newTx: Transaction = {
          id: Date.now().toString(),
          itemId: item.id,
          title: item.title,
          cost: item.cost,
          icon: item.icon,
          category: item.category,
          status: action === 'buy' ? 'purchased' : 'accepted',
          timestamp: Date.now()
      };

      if (action === 'buy') {
          // Deduct cost immediately for purchases
          onUpdateLovedOne(selectedLovedOne.id, { 
              balance: currentBalance - item.cost,
              transactions: [...currentTransactions, newTx]
          });
      } else {
          // Don't award money yet for accepting quests
          onUpdateLovedOne(selectedLovedOne.id, { 
              transactions: [...currentTransactions, newTx]
          });
      }
      setConfirmModal(null);
  };

  // --- Vault Actions ---

  const updateTransactionStatus = (lovedOneId: string, txId: string, newStatus: TransactionStatus) => {
      const targetLovedOne = user.lovedOnes.find(l => l.id === lovedOneId);
      if (!targetLovedOne) return;

      const transactions = targetLovedOne.transactions || [];
      const tx = transactions.find(t => t.id === txId);
      if (!tx) return;

      // Handle Balance updates for completion
      let newBalance = targetLovedOne.balance || 0;
      
      // If a bounty is APPROVED, user gets paid
      if (newStatus === 'approved' && tx.status !== 'approved') {
          newBalance += tx.cost;
      }

      const updatedTransactions = transactions.map(t => 
          t.id === txId ? { ...t, status: newStatus } : t
      );

      onUpdateLovedOne(lovedOneId, {
          balance: newBalance,
          transactions: updatedTransactions
      });
  };

  // --- Listing Management ---

  const handleAddItem = () => {
      if (!newItemTitle || !newItemCost || !selectedLovedOne) return;
      
      const newItem: MarketItem = {
          id: Date.now().toString(),
          title: newItemTitle,
          cost: parseInt(newItemCost),
          icon: newItemIcon,
          type: 'service',
          category: newItemCategory
      };

      const currentItems = selectedLovedOne.marketItems || [];
      onUpdateLovedOne(selectedLovedOne.id, { marketItems: [...currentItems, newItem] });

      setNewItemTitle('');
      setNewItemCost('');
      setShowAddModal(false);
  };

  const handleUpdateUserEconomy = (newConfig: EconomyConfig) => {
      const updatedUser = { ...user, economy: newConfig };
      onUpdateProfile(updatedUser);
  };

  const openAddModal = () => {
      setNewItemCategory(marketTab === 'earn' ? 'earn' : 'spend');
      setShowAddModal(true);
  };

  if (!selectedLovedOne) {
       return (
            <div className="h-full flex flex-col bg-slate-50 items-center justify-center p-8 text-center font-sans">
                 <ShoppingBag size={48} className="text-slate-300 mb-4" />
                 <h2 className="text-xl font-black text-slate-900 uppercase">Market Closed</h2>
                 <p className="text-slate-500 font-mono text-sm mt-2">No active relationship nodes found.</p>
                 <button onClick={onExit} className="mt-6 px-6 py-3 bg-slate-900 text-white font-bold uppercase text-xs tracking-widest">Return to Dashboard</button>
            </div>
       );
  }

  // Use the selected loved one's economy for displaying costs/rewards in Market
  const currentContextEconomy = selectedLovedOne.economy || { currencyName: 'Tokens', currencySymbol: '🪙' };
  const balance = selectedLovedOne.balance || 0;
  const items = selectedLovedOne.marketItems || [];
  
  // Aggregate transactions from ALL loved ones for the global vault view
  const allTransactions = user.lovedOnes.flatMap(lo => 
      (lo.transactions || []).map(t => ({ 
          ...t, 
          lovedOneId: lo.id, 
          lovedOneName: lo.name,
          currencySymbol: lo.economy?.currencySymbol || '🪙'
      }))
  );

  // Filter transactions for the selected loved one (for logic checks in market view)
  const currentLovedOneTransactions = selectedLovedOne.transactions || [];

  // User's own economy (for editing)
  const userEconomy = user.economy || { currencyName: 'Love Tokens', currencySymbol: '🪙' };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
            style={{ 
                backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}>
        </div>

        {/* Header (White) - Title + Config Button */}
        <div className="bg-white border-b-4 border-slate-900 px-4 py-3 shrink-0 flex items-center justify-between relative z-10">
           <div className="flex items-center gap-3">
                <button onClick={onExit} className="w-8 h-8 flex items-center justify-center border-2 border-slate-200 hover:border-slate-900 text-slate-400 hover:text-slate-900 transition-colors">
                     <X size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">
                        Marketplace
                    </h1>
                    <p className="text-[9px] font-mono text-yellow-600 uppercase tracking-widest font-bold">Shared Economy</p>
                </div>
           </div>
           
           <button 
                onClick={() => setViewMode(viewMode === 'vault' ? 'market' : 'vault')}
                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase border-2 transition-colors ${
                    viewMode === 'vault'
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
             >
                <Package size={14} /> {viewMode === 'vault' ? 'Back' : 'My Vault'}
             </button>
        </div>

        {/* Sub-Header (Dark) - User Dropdown + Add Button */}
        {viewMode !== 'vault' && (
            <div className="bg-slate-900 text-white p-2 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 px-2">
                    <User size={14} className="text-slate-400" />
                    {user.lovedOnes.length > 1 ? (
                        <div className="relative">
                            <select 
                                    value={selectedLovedOneId || ''}
                                    onChange={(e) => setSelectedLovedOneId(e.target.value)}
                                    className="appearance-none bg-slate-800 border border-slate-700 pl-2 pr-6 py-1 text-[10px] font-bold uppercase text-white focus:outline-none focus:border-indigo-500 rounded-sm"
                            >
                                {user.lovedOnes.map(lo => (
                                    <option key={lo.id} value={lo.id}>{lo.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                        </div>
                    ) : (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">{selectedLovedOne.name}</span>
                    )}
                </div>

                <button 
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors border border-indigo-500"
                >
                    <Plus size={12} /> New Listing
                </button>
            </div>
        )}
        
        {/* Balance Card (Visible in Market Mode) */}
        {viewMode === 'market' && (
            <div className="p-4 relative z-10 pb-0">
                <div className="bg-slate-900 text-white p-6 border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,0.2)] relative overflow-hidden group">
                    {/* Hatch Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 10px)' }}></div>
                    
                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <p className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-1 border-b border-slate-600 pb-1 inline-block">My Balance</p>
                            <p className="text-5xl font-mono font-bold text-white tracking-tighter mt-2">{balance} <span className="text-lg text-slate-500">{currentContextEconomy.currencyName}</span></p>
                        </div>
                        <div className="text-4xl">{currentContextEconomy.currencySymbol}</div>
                    </div>
                </div>
            </div>
        )}

        {/* Navigation Tabs (Only in Market Mode) */}
        {viewMode === 'market' && (
             <div className="px-4 mt-6">
                <div className="flex border-b-2 border-slate-200 bg-white">
                    <button 
                        onClick={() => setMarketTab('spend')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-b-4 ${
                            marketTab === 'spend' ? 'border-slate-900 text-slate-900 bg-slate-50' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <ShoppingBag size={14} /> Offers
                    </button>
                    <button 
                        onClick={() => setMarketTab('earn')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border-b-4 ${
                            marketTab === 'earn' ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Wallet size={14} /> Wants
                    </button>
                </div>
            </div>
        )}

        {/* === VAULT VIEW === */}
        {viewMode === 'vault' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10">
                
                {/* Vault Header / Actions */}
                <div className="flex justify-between items-center mb-2">
                     <div>
                         <h2 className="text-xl font-black text-slate-900 uppercase">My Vault</h2>
                         <p className="text-[10px] font-mono text-slate-500">AGGREGATED ASSETS & TASKS</p>
                     </div>
                     <button 
                        onClick={() => setShowConfigModal(true)}
                        className="bg-white border-2 border-slate-900 text-slate-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2"
                     >
                        <Settings size={12} /> My Economy
                     </button>
                </div>

                {/* My Wallet Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                        <Wallet size={14} /> My Wallet
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {user.lovedOnes.map(lo => (
                            <div key={lo.id} className="bg-slate-900 text-white p-3 flex justify-between items-center shadow-sm relative overflow-hidden group">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 10px)' }}></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 flex items-center justify-center text-2xl bg-white/10 rounded-full border border-white/20">
                                        {lo.economy?.currencySymbol || '🪙'}
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold font-mono leading-none">{lo.balance || 0}</div>
                                        <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">
                                            {lo.economy?.currencyName || 'Tokens'} <span className="text-slate-600 mx-1">•</span> {lo.name}
                                        </div>
                                    </div>
                                </div>
                                {/* Editing of loved one's currency is disabled for the user */}
                                <div className="text-[9px] font-mono text-slate-500 relative z-10">
                                    READ ONLY
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 1: Purchased Items (Ready to use) */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2 flex items-center gap-2">
                        <ShoppingBag size={14} /> Inventory (Purchased)
                    </h3>
                    
                    {allTransactions.filter(t => t.category === 'spend' && t.status === 'purchased').length === 0 && (
                        <p className="text-[10px] font-mono text-slate-400 italic">No purchased items available.</p>
                    )}

                    {allTransactions.filter(t => t.category === 'spend' && t.status === 'purchased').map(t => (
                         <div key={t.id} className="bg-white border-2 border-slate-900 p-4 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-600 border-l border-b border-slate-300">
                                 From: {t.lovedOneName}
                             </div>
                             <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-slate-100 border border-slate-200">{t.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-sm uppercase text-slate-900">{t.title}</h4>
                                        <p className="text-[10px] font-mono text-slate-500">Purchased</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => updateTransactionStatus(t.lovedOneId, t.id, 'redeemed')}
                                    className="bg-slate-900 text-white text-[10px] font-bold uppercase px-3 py-2 hover:bg-slate-700 transition-colors"
                                >
                                    Redeem / Use
                                </button>
                            </div>
                         </div>
                    ))}
                </div>

                {/* Section 2: Active Quests (Accepted) */}
                <div className="space-y-3 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 border-b border-emerald-100 pb-2 flex items-center gap-2">
                        <Star size={14} /> Active Quests
                    </h3>

                    {allTransactions.filter(t => t.category === 'earn' && t.status === 'accepted').length === 0 && (
                        <p className="text-[10px] font-mono text-slate-400 italic">No active quests.</p>
                    )}

                    {allTransactions.filter(t => t.category === 'earn' && t.status === 'accepted').map(t => (
                        <div key={t.id} className="bg-emerald-50 border-2 border-emerald-600 p-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700 border-l border-b border-emerald-200">
                                 For: {t.lovedOneName}
                             </div>
                            <div className="flex items-center justify-between mb-3 mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-white border border-emerald-200">{t.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-sm uppercase text-emerald-900">{t.title}</h4>
                                        <p className="text-[10px] font-mono text-emerald-600">Reward: {t.cost} {t.currencySymbol}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateTransactionStatus(t.lovedOneId, t.id, 'canceled')}
                                    className="flex-1 bg-white text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-3 py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => updateTransactionStatus(t.lovedOneId, t.id, 'pending_approval')}
                                    className="flex-1 bg-emerald-600 text-white text-[10px] font-bold uppercase px-3 py-2 hover:bg-emerald-500 transition-colors shadow-sm"
                                >
                                    Mark Complete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 3: Pending Verification */}
                <div className="space-y-3 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 border-b border-amber-100 pb-2 flex items-center gap-2">
                        <Clock size={14} /> Waiting Verification
                    </h3>

                    {allTransactions.filter(t => t.category === 'earn' && t.status === 'pending_approval').length === 0 && (
                        <p className="text-[10px] font-mono text-slate-400 italic">No pending verifications.</p>
                    )}

                    {allTransactions.filter(t => t.category === 'earn' && t.status === 'pending_approval').map(t => (
                        <div key={t.id} className="bg-amber-50 border-2 border-amber-400 p-4 shadow-sm opacity-90 relative overflow-hidden">
                             <div className="absolute top-0 right-0 bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700 border-l border-b border-amber-200">
                                 For: {t.lovedOneName}
                             </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-white border border-amber-200">{t.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-sm uppercase text-amber-900">{t.title}</h4>
                                        <p className="text-[10px] font-mono text-amber-700">Waiting for approval</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {/* SIMULATION BUTTON FOR DEMO */}
                                    <button 
                                        onClick={() => updateTransactionStatus(t.lovedOneId, t.id, 'approved')}
                                        className="bg-amber-500 text-white text-[9px] font-bold uppercase px-2 py-1 hover:bg-amber-400"
                                        title="Simulate partner clicking 'Approve'"
                                    >
                                        [Simulate]
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 4: History (Completed/Redeemed) */}
                 <div className="space-y-3 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 flex items-center gap-2">
                        <Archive size={14} /> History
                    </h3>
                    <div className="space-y-2 opacity-60">
                         {allTransactions.filter(t => t.status === 'redeemed' || t.status === 'approved').map(t => (
                             <div key={t.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                                 <div className="flex items-center gap-2">
                                     <span>{t.icon}</span>
                                     <div>
                                        <span className="font-bold text-slate-600 mr-2">{t.title}</span>
                                        <span className="text-[9px] font-mono text-slate-400">({t.lovedOneName})</span>
                                     </div>
                                 </div>
                                 <span className="font-mono text-[9px] uppercase bg-slate-100 px-1">
                                     {t.status === 'approved' ? `Earned ${t.cost}` : 'Redeemed'}
                                 </span>
                             </div>
                         ))}
                    </div>
                </div>

            </div>
        )}

        {/* === MARKET VIEW (SHOP/EARN) === */}
        {viewMode === 'market' && (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
                    {/* Items List */}
                    {items.filter(i => i.category === marketTab).map(item => {
                         const isAffordable = balance >= item.cost;
                         
                         // Check status in transactions (for current loved one)
                         const activeTx = currentLovedOneTransactions.find(t => t.itemId === item.id && (t.status === 'accepted' || t.status === 'pending_approval'));
                         
                         // Logic for "Greyed Out"
                         let isUnavailable = false;
                         let statusLabel = '';

                         if (marketTab === 'spend') {
                             if (!isAffordable) {
                                 isUnavailable = true;
                                 statusLabel = 'Insufficient Funds';
                             }
                         } else {
                             // Earn Tab
                             if (activeTx) {
                                 isUnavailable = true;
                                 statusLabel = activeTx.status === 'pending_approval' ? 'Pending Verification' : 'In Progress (Check Vault)';
                             }
                         }

                         return (
                            <button 
                                key={item.id} 
                                onClick={() => initiateTransaction(item)}
                                disabled={isUnavailable}
                                className={`w-full p-4 border-2 text-left relative overflow-hidden transition-all group active:translate-y-[2px] active:shadow-none ${
                                    marketTab === 'spend'
                                        ? isUnavailable
                                            ? 'bg-slate-50 border-slate-200 opacity-60 grayscale cursor-not-allowed'
                                            : 'bg-white border-slate-900 hover:bg-slate-50 shadow-[4px_4px_0px_rgba(30,41,59,1)]' 
                                        : isUnavailable
                                            ? 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'
                                            : 'bg-white border-emerald-600 hover:bg-emerald-50 shadow-[4px_4px_0px_#059669]'
                                }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`text-3xl w-14 h-14 flex items-center justify-center border-2 border-slate-200 bg-slate-50`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg leading-tight uppercase tracking-tight mb-1 text-slate-900">{item.title}</h4>
                                        
                                        {statusLabel ? (
                                             <div className="inline-block px-2 py-0.5 border text-[10px] font-mono font-bold uppercase bg-slate-200 text-slate-500 border-slate-300">
                                                {statusLabel}
                                             </div>
                                        ) : (
                                            <div className={`inline-block px-2 py-0.5 border text-[10px] font-mono font-bold uppercase ${
                                                marketTab === 'spend'
                                                    ? 'bg-slate-100 text-slate-500 border-slate-300' 
                                                    : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                            }`}>
                                                {marketTab === 'spend' ? 'COST' : 'REWARD'}: {item.cost} {currentContextEconomy.currencySymbol}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                         );
                    })}

                    {/* Empty State */}
                    {items.filter(i => i.category === marketTab).length === 0 && (
                        <div className="text-center py-8 opacity-50">
                             <p className="text-xs font-mono uppercase text-slate-500">No active listings.</p>
                        </div>
                    )}
                </div>
            </>
        )}

        {/* User Currency Config Modal */}
        {showConfigModal && (
            <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                 <div className="bg-white w-full max-w-sm border-2 border-slate-900 p-6 shadow-2xl relative">
                     <button 
                        onClick={() => setShowConfigModal(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
                     >
                        <X size={20} />
                     </button>

                     <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight mb-2 flex items-center gap-2">
                         <DollarSign size={24} /> My Economy Settings
                     </h3>
                     
                     <div className="mb-4 bg-slate-100 p-2 border border-slate-200">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scope</span>
                         <div className="text-xs font-bold text-slate-900 uppercase">My Personal Currency</div>
                     </div>

                     <p className="text-xs text-slate-500 mb-4 font-mono leading-relaxed">
                         Customize the currency you offer to others. This is what your partner will see when they interact with you.
                     </p>
                     
                     <div className="space-y-4">
                         {/* Presets */}
                         <div>
                             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Presets</label>
                             <div className="flex flex-wrap gap-2">
                                 {CURRENCY_PRESETS.map(preset => (
                                     <button
                                        key={preset.name}
                                        onClick={() => handleUpdateUserEconomy({ currencyName: preset.name, currencySymbol: preset.symbol })}
                                        className={`px-3 py-2 border-2 text-xs font-bold uppercase ${
                                            (userEconomy.currencyName === preset.name) 
                                            ? 'bg-slate-900 text-white border-slate-900' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                        }`}
                                     >
                                         {preset.symbol}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         
                         <div className="pt-4 border-t border-slate-100">
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Name</label>
                                     <input 
                                        type="text" 
                                        value={userEconomy.currencyName}
                                        onChange={(e) => handleUpdateUserEconomy({ ...userEconomy, currencyName: e.target.value })}
                                        className="w-full border-2 border-slate-200 p-2 text-sm font-bold uppercase"
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Symbol</label>
                                     <input 
                                        type="text" 
                                        value={userEconomy.currencySymbol}
                                        onChange={(e) => handleUpdateUserEconomy({ ...userEconomy, currencySymbol: e.target.value })}
                                        className="w-full border-2 border-slate-200 p-2 text-sm font-bold uppercase text-center"
                                     />
                                 </div>
                             </div>
                         </div>
                     </div>

                     <button 
                        onClick={() => setShowConfigModal(false)}
                        className="w-full mt-6 bg-indigo-600 text-white py-3 font-bold uppercase tracking-widest text-xs shadow-[4px_4px_0px_#312e81] border-2 border-indigo-900 active:shadow-none active:translate-y-0.5"
                     >
                         Save Configuration
                     </button>
                 </div>
            </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
            <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white w-full max-w-xs border-4 border-slate-900 p-6 shadow-2xl relative">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-slate-50 border-2 border-slate-900 flex items-center justify-center text-4xl mb-4">
                            {confirmModal.item.icon}
                        </div>
                        <h3 className="font-black text-lg text-slate-900 uppercase leading-tight mb-2">
                            {confirmModal.action === 'buy' ? 'Confirm Purchase' : 'Accept Quest'}
                        </h3>
                        <p className="text-sm font-mono text-slate-500 leading-relaxed">
                            {confirmModal.action === 'buy' 
                                ? `Spend ${confirmModal.item.cost} ${currentContextEconomy.currencyName} to redeem "${confirmModal.item.title}"? Item will be stored in your Vault.`
                                : `Accept "${confirmModal.item.title}"? You can view active quests in your Vault.`
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setConfirmModal(null)}
                            className="py-3 border-2 border-slate-200 font-bold uppercase text-xs hover:bg-slate-50 hover:border-slate-400 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={executeTransaction}
                            className={`py-3 font-bold uppercase text-xs text-white border-2 border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all ${
                                confirmModal.action === 'buy' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800'
                            }`}
                        >
                            {confirmModal.action === 'buy' ? 'Confirm' : 'Accept'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
            <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white w-full max-w-sm border-2 border-slate-900 p-6 shadow-2xl">
                    <h3 className="font-black text-xl uppercase tracking-tight mb-4">
                        Create New Listing
                    </h3>
                    <div className="space-y-4">
                        {/* Category Selector */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setNewItemCategory('spend')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase border-2 flex items-center justify-center gap-2 ${
                                        newItemCategory === 'spend'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-400 border-slate-200'
                                    }`}
                                >
                                    <ShoppingBag size={14} /> Reward (Spend)
                                </button>
                                <button
                                    onClick={() => setNewItemCategory('earn')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase border-2 flex items-center justify-center gap-2 ${
                                        newItemCategory === 'earn'
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-slate-400 border-slate-200'
                                    }`}
                                >
                                    <Wallet size={14} /> Bounty (Earn)
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1 font-mono">
                                {newItemCategory === 'spend' 
                                    ? "Something available for purchase using currency." 
                                    : "A task that awards currency upon completion."}
                            </p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Title</label>
                            <input 
                                type="text" 
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                className="w-full border-2 border-slate-200 p-2 text-sm font-bold"
                                placeholder={newItemCategory === 'spend' ? "e.g. Back Massage" : "e.g. Wash the Car"}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {newItemCategory === 'spend' ? 'Cost' : 'Reward Amount'}
                            </label>
                            <input 
                                type="number" 
                                value={newItemCost}
                                onChange={(e) => setNewItemCost(e.target.value)}
                                className="w-full border-2 border-slate-200 p-2 text-sm font-bold"
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Icon (Emoji)</label>
                            <input 
                                type="text" 
                                value={newItemIcon}
                                onChange={(e) => setNewItemIcon(e.target.value)}
                                className="w-full border-2 border-slate-200 p-2 text-sm font-bold text-center"
                                placeholder="🎁"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 border-2 border-slate-200 font-bold uppercase text-xs hover:bg-slate-50">Cancel</button>
                            <button onClick={handleAddItem} className="flex-1 py-3 bg-slate-900 text-white font-bold uppercase text-xs hover:bg-slate-800">Add Item</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}
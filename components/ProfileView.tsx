
import React, { useState } from 'react';
import { UserProfile, LovedOne, Transaction } from '../types';
import { ArrowLeft, User, Heart, Shield, Users, Activity, TrendingUp, BarChart3, Map as MapIcon, ShoppingBag, Clock, ChevronRight, Wallet, Star, X } from 'lucide-react';

interface Props {
  user: UserProfile;
  onBack: () => void;
}

// Simple SVG Line Chart Component - Technical Style
const MiniTrendChart: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    const max = Math.max(...data, 100);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const height = 40;
    const width = 100;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1="20" x2="100" y2="20" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1="40" x2="100" y2="40" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />

            <polyline 
                fill="none" 
                stroke={color} 
                strokeWidth="1.5" 
                points={points} 
                strokeLinejoin="round" 
            />
            {data.map((val, i) => {
                 const x = (i / (data.length - 1)) * width;
                 const y = height - ((val - min) / range) * height;
                 return <circle key={i} cx={x} cy={y} r="1.5" fill="white" stroke={color} strokeWidth="1.5" />;
            })}
        </svg>
    );
};

const RelationshipDetail: React.FC<{ person: LovedOne; onBack: () => void }> = ({ person, onBack }) => {
    // Derived Stats
    const transactions = person.transactions || [];
    const totalTransactions = transactions.length;
    const spendCount = transactions.filter(t => t.category === 'spend').length;
    const earnCount = transactions.filter(t => t.category === 'earn').length;
    
    // Simulate Love Map Score based on interaction depth (balance + tx count)
    const rawScore = ((person.balance || 0) / 100) + (totalTransactions * 5);
    const loveMapScore = Math.min(Math.floor(rawScore), 100); 
    const mapLevel = loveMapScore > 80 ? 'Level 5: Inner World' : loveMapScore > 50 ? 'Level 3: History' : 'Level 1: The Basics';

    return (
        <div className="animate-slide-in-down space-y-6">
            {/* Header */}
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 mb-2 transition-colors"
            >
                <ArrowLeft size={12} /> Back to Network
            </button>

            <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_rgba(30,41,59,0.1)] flex items-center gap-6">
                 <div className="w-20 h-20 bg-slate-900 text-white flex items-center justify-center font-bold text-3xl border-4 border-slate-100 shadow-inner">
                    {person.name.charAt(0)}
                 </div>
                 <div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{person.name}</h2>
                     <p className="text-xs font-mono text-slate-500 uppercase mt-1 bg-slate-100 inline-block px-2 py-0.5">{person.relationship}</p>
                 </div>
            </div>

            {/* SECTOR 1: LOVE MAPS */}
            <div className="bg-white border-2 border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2">
                        <MapIcon size={14} className="text-rose-500" /> Love Map Status
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400">CARTOGRAPHY MODULE</div>
                </div>
                <div className="p-5 flex items-center gap-6">
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                         <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-slate-100"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="text-rose-500 drop-shadow-md"
                                strokeDasharray={`${loveMapScore}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-xl font-black text-slate-900">{loveMapScore}%</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                         <div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase">Current Depth</div>
                             <div className="font-bold text-slate-800 uppercase">{mapLevel}</div>
                         </div>
                         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                             <div className="bg-rose-500 h-full" style={{ width: `${loveMapScore}%` }}></div>
                         </div>
                         <div className="text-[9px] font-mono text-slate-400">
                             Knowledge Base: {loveMapScore > 50 ? 'EXPANDING' : 'INITIALIZING'}
                         </div>
                    </div>
                </div>
            </div>

            {/* SECTOR 2: MARKET STATS */}
            <div className="bg-white border-2 border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2">
                        <ShoppingBag size={14} className="text-emerald-500" /> Market Analytics
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400">ECONOMY: {person.economy?.currencyName}</div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100">
                     <div className="p-4 text-center">
                         <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Wallet Balance</div>
                         <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                             {person.balance || 0} <span className="text-sm text-slate-400">{person.economy?.currencySymbol}</span>
                         </div>
                     </div>
                     <div className="p-4 text-center">
                         <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Lifetime Vol.</div>
                         <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                             {totalTransactions} <span className="text-sm text-slate-400">TX</span>
                         </div>
                     </div>
                </div>
                <div className="border-t border-slate-100 p-4 flex justify-around">
                     <div className="text-center">
                         <div className="text-[9px] font-mono text-slate-400 uppercase">Rewards Redeemed</div>
                         <div className="font-bold text-slate-700">{spendCount}</div>
                     </div>
                     <div className="text-center">
                         <div className="text-[9px] font-mono text-slate-400 uppercase">Quests Completed</div>
                         <div className="font-bold text-slate-700">{earnCount}</div>
                     </div>
                </div>
            </div>

            {/* SECTOR 3: INTERACTIONS */}
            <div className="bg-white border-2 border-slate-200">
                 <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-indigo-500" /> Interaction Log
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {transactions.length === 0 && (
                        <div className="p-6 text-center text-[10px] font-mono text-slate-400 uppercase">
                            No interaction data available.
                        </div>
                    )}
                    {[...transactions].reverse().slice(0, 10).map((tx) => (
                        <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-lg">
                                     {tx.icon}
                                 </div>
                                 <div>
                                     <div className="font-bold text-slate-800 text-xs uppercase">{tx.title}</div>
                                     <div className="text-[9px] font-mono text-slate-400">
                                         {tx.status.replace('_', ' ')} • {new Date(tx.timestamp).toLocaleDateString()}
                                     </div>
                                 </div>
                             </div>
                             <div className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                                 tx.category === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                             }`}>
                                 {tx.category === 'earn' ? '+' : '-'}{tx.cost}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ProfileView: React.FC<Props> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'relationships'>('overview');
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);
  
  const weeklyTrend = user.stats?.weeklyTrends || [65, 70, 68, 75, 82, 80, 85];
  const commScore = user.stats?.communicationScore || 78;
  const affectionScore = user.stats?.overallAffection || 85;

  const handleRelationshipBack = () => {
      setSelectedRelationId(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans relative">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
            style={{ 
                backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 bg-white border-b-4 border-slate-900 flex items-center justify-between shrink-0 sticky top-0">
        <div>
           <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-1">
               <User size={12} />
               <span>MODULE: PROFILE</span>
           </div>
           <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">MASTER SUITE</h1>
           <p className="text-[9px] font-mono text-indigo-500 uppercase tracking-widest font-bold mt-1">ANALYTICS & DATA</p>
        </div>
        <div className="flex items-center gap-4">
             <button onClick={onBack} className="w-8 h-8 flex items-center justify-center border-2 border-slate-200 hover:border-slate-900 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
            </button>
        </div>
      </header>

      {/* Tabs */}
      {!selectedRelationId && (
          <div className="flex p-2 gap-2 border-b border-slate-200 bg-white shrink-0 relative z-10">
              {[
                  { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
                  { id: 'relationships', label: 'Network', icon: <Users size={14} /> },
              ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
                        activeTab === tab.id 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                      {tab.icon}
                      {tab.label}
                  </button>
              ))}
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10 pb-20">
        
        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && !selectedRelationId && (
            <div className="space-y-6 animate-fade-in">
                
                {/* Score Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 border-2 border-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                            <Heart size={64} className="text-rose-500" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Connection Level</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-rose-500 font-mono">{affectionScore}%</span>
                            <span className="text-[10px] font-bold text-green-600 mb-1 flex items-center bg-green-50 px-1 border border-green-200"><TrendingUp size={10} className="mr-0.5" /> +2.4%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 mt-3 border border-slate-200">
                            <div className="h-full bg-rose-500" style={{ width: `${affectionScore}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white p-4 border-2 border-slate-900 shadow-[4px_4px_0px_rgba(30,41,59,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                            <Activity size={64} className="text-indigo-500" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Comm. Score</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-indigo-500 font-mono">{commScore}</span>
                            <span className="text-[10px] font-bold text-slate-400 mb-1">/ 100</span>
                        </div>
                         <div className="w-full bg-slate-100 h-2 mt-3 border border-slate-200">
                            <div className="h-full bg-indigo-500" style={{ width: `${commScore}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Weekly Trend */}
                <div className="bg-white p-5 border-2 border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight text-sm">
                            <BarChart3 size={16} className="text-slate-400" />
                            Connection Quality
                        </h3>
                        <div className="text-[9px] font-mono bg-slate-100 px-2 py-1 border border-slate-200 text-slate-500 uppercase">LAST 7 DAYS</div>
                    </div>
                    <div className="h-20 flex items-end">
                        <MiniTrendChart data={weeklyTrend} color="#6366f1" />
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-mono uppercase">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                {/* Attachment Style Deep Dive */}
                <div className="bg-slate-900 text-white p-5 border-2 border-slate-900 shadow-[6px_6px_0px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                        <div className="flex items-center gap-2">
                            <Shield size={16} className="text-emerald-400" />
                            <h3 className="font-bold uppercase tracking-wider text-sm">Attachment Profile</h3>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase border border-slate-600 px-2 py-0.5">{user.attachmentStyle}</span>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="relative pt-2">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                                <span>Anxiety</span>
                                <span className="text-white">{user.attachmentStats?.anxiety || 30}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 border border-slate-600">
                                <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${user.attachmentStats?.anxiety || 30}%` }}></div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">Tendency to worry about relationship availability.</p>
                        </div>

                        <div className="relative">
                             <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                                <span>Avoidance</span>
                                <span className="text-white">{user.attachmentStats?.avoidance || 20}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 border border-slate-600">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${user.attachmentStats?.avoidance || 20}%` }}></div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">Tendency to value independence over intimacy.</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* === RELATIONSHIPS TAB === */}
        {activeTab === 'relationships' && (
             <div className="space-y-4 animate-fade-in h-full">
                 
                 {selectedRelationId ? (
                     // DETAIL VIEW
                     (() => {
                         const person = user.lovedOnes.find(l => l.id === selectedRelationId);
                         return person ? <RelationshipDetail person={person} onBack={handleRelationshipBack} /> : null;
                     })()
                 ) : (
                     // LIST VIEW
                     <>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1 border-b border-slate-200 pb-1">Network Nodes</h3>
                        
                        {user.lovedOnes.length === 0 && (
                            <div className="text-center py-8 bg-white border-2 border-dashed border-slate-300">
                                <p className="text-xs font-mono text-slate-500 uppercase">No relationships tracked yet.</p>
                            </div>
                        )}

                        {user.lovedOnes.map((person, idx) => {
                            const mockScore = 60 + (person.name.length * 5) % 35;
                            const mockTrend = [60, 65, 62, 70, 72, 68, mockScore];
                            
                            return (
                                <button 
                                    key={person.id} 
                                    onClick={() => setSelectedRelationId(person.id)}
                                    className="w-full bg-white p-4 border-2 border-slate-200 hover:border-slate-900 transition-colors group text-left relative"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 flex items-center justify-center font-bold text-white border-2 border-slate-900 ${idx % 2 === 0 ? 'bg-indigo-600' : 'bg-rose-500'}`}>
                                                {person.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 uppercase tracking-tight">{person.name}</h4>
                                                <p className="text-[10px] font-mono text-slate-500 uppercase">{person.relationship}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-slate-900 font-mono">{mockScore}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">Index</div>
                                        </div>
                                    </div>
                                    
                                    <div className="h-8 w-full mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <MiniTrendChart data={mockTrend} color={idx % 2 === 0 ? '#4f46e5' : '#e11d48'} />
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-mono text-[9px]">Tap to View Full Analysis</span>
                                        <div className="font-bold text-indigo-600 group-hover:text-indigo-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                                            Access Data <ChevronRight size={12} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-2 border-slate-200 hover:border-slate-400">
                            <Users size={14} /> Add New Node
                        </button>
                     </>
                 )}
             </div>
        )}
      </div>
    </div>
  );
};

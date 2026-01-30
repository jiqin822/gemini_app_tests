
import React, { useState, useEffect } from 'react';
import { UserProfile, ActivityCard, Memory, EconomyConfig, LovedOne, Ritual, AppNotification } from '../types';
import { Heart, Zap, Calendar, Sparkles, BookHeart, X, Loader2, Flame, Camera, User, Repeat, CheckCircle2, Circle, Gamepad2 } from 'lucide-react';
import { generateActivities } from '../services/geminiService';

interface Props {
  user: UserProfile;
  xp: number;
  setXp: (xp: number) => void;
  economy: EconomyConfig;
  onExit: () => void;
  onUpdateLovedOne: (id: string, updates: Partial<LovedOne>) => void;
  onAddNotification: (type: AppNotification['type'], title: string, message: string) => void;
}

const HARDCODED_ACTIVITIES: ActivityCard[] = [
  {
    id: 'h1',
    title: 'The Eye Contact Challenge',
    description: 'Sit opposite each other for 2 minutes maintaining eye contact without speaking. It is okay to laugh!',
    duration: '2 mins',
    type: 'deep',
    xpReward: 150
  },
  {
    id: 'h2',
    title: 'Kitchen Dance Party',
    description: 'Put on your favorite upbeat song and dance in the kitchen while making a snack together.',
    duration: '15 mins',
    type: 'fun',
    xpReward: 100
  },
  {
    id: 'h3',
    title: 'Compliment Barrage',
    description: 'Take turns giving each other 3 sincere compliments in a row.',
    duration: '5 mins',
    type: 'romantic',
    xpReward: 120
  }
];

const DEFAULT_RITUALS: Ritual[] = [
    { id: 'r1', title: '6-Second Kiss', frequency: 'daily', streak: 0, lastCompleted: 0, icon: '💋', description: 'A kiss long enough to create oxytocin connection.' },
    { id: 'r2', title: 'Stress-Reducing Talk', frequency: 'daily', streak: 0, lastCompleted: 0, icon: '🗣️', description: '20 mins venting about the day (not the relationship).' },
    { id: 'r3', title: 'State of the Union', frequency: 'weekly', streak: 0, lastCompleted: 0, icon: '🏛️', description: 'Weekly check-in on relationship needs and logistics.' },
];

export const ActivitiesMode: React.FC<Props> = ({ user, xp, setXp, economy, onExit, onUpdateLovedOne, onAddNotification }) => {
  const [viewMode, setViewMode] = useState<'QUESTS' | 'RITUALS'>('QUESTS');
  const [activities, setActivities] = useState<ActivityCard[]>(HARDCODED_ACTIVITIES);
  const [loading, setLoading] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(user.lovedOnes[0]?.id || '');
  
  const [memories, setMemories] = useState<Memory[]>([
    { id: '1', activityTitle: 'Sunset Walk', date: Date.now() - 86400000 * 2, note: 'The sky was purple!', type: 'romantic' },
    { id: '2', activityTitle: 'Cooked Pasta', date: Date.now() - 86400000 * 5, note: 'We burned the sauce lol', type: 'fun' }
  ]);

  const selectedPartner = user.lovedOnes.find(l => l.id === selectedPartnerId);

  // Initialize rituals if not present
  useEffect(() => {
      if (selectedPartner && (!selectedPartner.rituals || selectedPartner.rituals.length === 0)) {
          onUpdateLovedOne(selectedPartner.id, { rituals: DEFAULT_RITUALS });
      }
  }, [selectedPartner]);

  const handleGenerateQuests = async () => {
    setLoading(true);
    try {
      const newActivities = await generateActivities(user.relationshipStatus, 'connected');
      if (newActivities.length > 0) {
        setActivities(newActivities);
      }
    } catch (e) {
      console.error(e);
      alert("Could not generate new quests right now.");
    } finally {
      setLoading(false);
    }
  };

  const completeActivity = (activity: ActivityCard) => {
    const note = prompt("How did it go? Write a short memory:");
    if (note) {
        setMemories(prev => [{
            id: Date.now().toString(),
            activityTitle: activity.title,
            date: Date.now(),
            note,
            type: activity.type
        }, ...prev]);
        
        // Award Global XP
        setXp(xp + activity.xpReward);

        // Award Partner Currency if selected
        if (selectedPartner) {
            const currentBalance = selectedPartner.balance || 0;
            const currencyName = selectedPartner.economy?.currencyName || 'Tokens';
            onUpdateLovedOne(selectedPartner.id, { balance: currentBalance + activity.xpReward });
            alert(`Activity Completed! +${activity.xpReward} ${economy.currencyName} (Global) & +${activity.xpReward} ${currencyName}`);
        } else {
             alert(`Activity Completed! +${activity.xpReward} ${economy.currencyName}`);
        }
        
        onAddNotification('reward', 'Activity Logged', `Completed "${activity.title}". Gained ${activity.xpReward} XP.`);
    }
  };

  const checkInRitual = (ritualId: string) => {
      if (!selectedPartner || !selectedPartner.rituals) return;

      const updatedRituals = selectedPartner.rituals.map(r => {
          if (r.id === ritualId) {
              // Check if already done today/this week (Simple logic for demo)
              const now = Date.now();
              const oneDay = 86400000;
              if (now - r.lastCompleted < (r.frequency === 'daily' ? oneDay : oneDay * 7)) {
                  alert(`You've already checked in for this ${r.frequency} ritual!`);
                  return r;
              }
              
              setXp(xp + (r.frequency === 'daily' ? 50 : 200));
              onAddNotification('system', 'Ritual Complete', `Streak updated for "${r.title}". Keep it up!`);
              return {
                  ...r,
                  streak: r.streak + 1,
                  lastCompleted: now
              };
          }
          return r;
      });

      onUpdateLovedOne(selectedPartner.id, { rituals: updatedRituals });
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
      <header className="relative z-10 px-6 py-4 bg-white border-b-4 border-slate-900 flex items-center justify-between shrink-0">
           <div>
               <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-1">
                   <Gamepad2 size={12} />
                   <span>MODULE: ACTIVITIES</span>
               </div>
               <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">GAME ROOM</h1>
               <div className="flex items-center gap-2 mt-1">
                   <p className="text-[9px] font-mono text-orange-600 uppercase tracking-widest font-bold">QUESTS & RITUALS</p>
                   <span className="text-[9px] font-mono text-slate-300">|</span>
                   <span className="text-[9px] font-mono text-slate-500 font-bold">XP: {xp}</span>
               </div>
           </div>
           
           <div className="flex items-center gap-4">
                {/* Partner Selector for Context */}
                {user.lovedOnes.length > 0 && (
                     <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-2 py-1">
                         <User size={12} className="text-slate-400" />
                         <select 
                             value={selectedPartnerId} 
                             onChange={(e) => setSelectedPartnerId(e.target.value)}
                             className="bg-transparent text-[10px] font-bold uppercase text-slate-700 focus:outline-none"
                         >
                             {user.lovedOnes.map(lo => <option key={lo.id} value={lo.id}>{lo.name}</option>)}
                         </select>
                     </div>
                )}
                <button onClick={onExit} className="w-8 h-8 flex items-center justify-center border-2 border-slate-200 hover:border-slate-900 text-slate-400 hover:text-slate-900 transition-colors">
                     <X size={20} />
                </button>
           </div>
      </header>

      {/* Tabs */}
      <div className="flex p-2 gap-2 border-b border-slate-200 bg-white shrink-0 relative z-10">
          <button
            onClick={() => setViewMode('QUESTS')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
                viewMode === 'QUESTS'
                ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
              <Sparkles size={14} /> One-Off Quests
          </button>
          <button
            onClick={() => setViewMode('RITUALS')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
                viewMode === 'RITUALS'
                ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
              <Repeat size={14} /> Rituals & Habits
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 relative z-10">
            {viewMode === 'QUESTS' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Active Assignments</h3>
                                <button 
                                    onClick={handleGenerateQuests}
                                    disabled={loading}
                                    className="bg-white border-2 border-indigo-600 text-indigo-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 flex items-center gap-2 transition-colors disabled:opacity-50 hover:bg-indigo-50"
                                >
                                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    Refresh Specs
                                </button>
                            </div>
                        {loading ? (
                                <div className="space-y-4">
                                    {[1,2,3].map(i => <div key={i} className="h-32 bg-white border-2 border-slate-200 animate-pulse" />)}
                                </div>
                            ) : (
                                activities.map((act) => (
                                    <div key={act.id} className="bg-white border-2 border-slate-900 p-5 shadow-[6px_6px_0px_rgba(30,41,59,0.1)] hover:shadow-[8px_8px_0px_rgba(30,41,59,0.2)] hover:-translate-y-0.5 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="px-2 py-0.5 border border-slate-300 bg-slate-50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                                                Type: {act.type}
                                            </div>
                                            <div className="flex items-center gap-1 text-orange-600 font-bold text-xs font-mono bg-orange-50 px-2 py-0.5 border border-orange-200">
                                                <Zap size={12} className="fill-orange-600" />
                                                REWARD: {act.xpReward} {economy.currencySymbol}
                                            </div>
                                        </div>
                                        <h4 className="font-black text-xl text-slate-900 mb-2 uppercase tracking-tight">{act.title}</h4>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4 border-l-2 border-slate-200 pl-3">{act.description}</p>
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                                            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono uppercase">
                                                <div className="flex items-center gap-1"><Calendar size={12} /> EST: {act.duration}</div>
                                            </div>
                                            <button 
                                                onClick={() => completeActivity(act)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest border-2 border-transparent hover:border-indigo-900 transition-all shadow-[2px_2px_0px_#312e81] active:translate-y-0.5 active:shadow-none"
                                            >
                                                Mark Complete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                    </div>

                    {/* PAST MEMORIES */}
                    <div className="space-y-4 pt-4">
                            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg border-t-2 border-slate-200 pt-6 flex items-center gap-2">
                                <BookHeart size={20} className="text-slate-900" />
                                Archived Logs
                            </h3>
                            {memories.length === 0 && <p className="text-center text-slate-400 py-6 text-xs font-mono uppercase border-2 border-dashed border-slate-300 bg-slate-50/50">NO DATA FOUND.</p>}
                            {memories.map((mem) => (
                                <div key={mem.id} className="bg-white border-2 border-slate-200 hover:border-slate-400 transition-colors p-0 flex">
                                    <div className="w-16 bg-slate-100 flex flex-col items-center justify-center text-slate-300 border-r-2 border-slate-200">
                                        <Camera size={20} />
                                    </div>
                                    <div className="p-3 flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-900 text-sm uppercase">{mem.activityTitle}</h4>
                                            <span className="text-[9px] font-mono text-slate-400">{new Date(mem.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-600 text-xs italic font-serif">"{mem.note}"</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {viewMode === 'RITUALS' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_rgba(30,41,59,0.1)]">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center">
                                <Repeat size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-lg">Shared Meaning</h3>
                                <p className="text-xs font-mono text-slate-500 leading-relaxed mt-1">
                                    Relationships are built on small, recurring moments of connection. Build your streaks.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {selectedPartner?.rituals?.map(ritual => {
                            const isDoneToday = Date.now() - ritual.lastCompleted < (ritual.frequency === 'daily' ? 86400000 : 86400000 * 7);
                            return (
                                <div key={ritual.id} className={`bg-white border-2 ${isDoneToday ? 'border-emerald-500' : 'border-slate-200'} p-4 shadow-sm relative overflow-hidden transition-all hover:border-slate-400`}>
                                    {isDoneToday && (
                                        <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 px-3 py-1 text-[9px] font-bold uppercase tracking-widest border-l border-b border-emerald-200">
                                            Completed
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl bg-slate-50 w-16 h-16 flex items-center justify-center border-2 border-slate-100 rounded-full">
                                            {ritual.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-900 uppercase">{ritual.title}</h4>
                                                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 border ${ritual.frequency === 'daily' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                                                    {ritual.frequency}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-3">{ritual.description}</p>
                                            
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                                                <Flame size={12} className="fill-orange-500" />
                                                Streak: {ritual.streak}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-slate-100 pt-3 flex justify-end">
                                        <button 
                                            onClick={() => checkInRitual(ritual.id)}
                                            disabled={isDoneToday}
                                            className={`
                                                flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all
                                                ${isDoneToday 
                                                    ? 'bg-emerald-50 text-emerald-600 cursor-default opacity-80' 
                                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none'}
                                            `}
                                        >
                                            {isDoneToday ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                            {isDoneToday ? 'Checked In' : 'Check In'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
      </div>
    </div>
  );
};

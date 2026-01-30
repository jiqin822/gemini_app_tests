
import React, { useState, useRef, useEffect } from 'react';
import { AppMode, UserProfile, Reward, LovedOne, EconomyConfig, MarketItem, AppNotification } from './types';
import { Onboarding } from './components/Onboarding';
import { LiveCoachMode } from './components/LiveCoachMode';
import { TherapistMode } from './components/TherapistMode';
import { ActivitiesMode } from './components/ActivitiesMode';
import { LoveMapsMode } from './components/LoveMapsMode';
import { RewardsMode } from './components/RewardsMode';
import { AuthScreen } from './components/AuthScreen';
import { VoiceAuth } from './components/VoiceAuth';
import { ProfileView } from './components/ProfileView';
import { EditProfile } from './components/EditProfile';
import { Mic, MessageCircle, Heart, Users, X, Send, Activity, BrainCircuit, Home, ArrowRight, Menu, Settings, Ruler, Plus, Armchair, Gamepad2, Radio, DoorOpen, Gift, Star, FileText, Bell, Zap, Eye, LogOut, Sliders, Lock, Trash2, Map as MapIcon, Filter, AlertTriangle, ArrowLeft } from 'lucide-react';

const DEFAULT_MARKET_ITEMS: MarketItem[] = [
    { id: '1', title: 'Breakfast in Bed', cost: 500, icon: '🥐', type: 'service', category: 'spend' },
    { id: '2', title: '1 Hour Massage', cost: 1000, icon: '💆', type: 'service', category: 'spend' },
    { id: '3', title: 'Movie Choice', cost: 300, icon: '🎬', type: 'product', category: 'spend' },
    { id: '4', title: 'Wash Dishes', cost: 150, icon: '🧼', type: 'service', category: 'earn' },
    { id: '5', title: 'Plan Date Night', cost: 400, icon: '📅', type: 'quest', category: 'earn' },
];

const DEFAULT_ECONOMY: EconomyConfig = {
    currencyName: 'Love Tokens',
    currencySymbol: '🪙'
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [showVoiceAuth, setShowVoiceAuth] = useState(false);
  const [pendingMode, setPendingMode] = useState<AppMode | null>(null);

  // Global XP (User Level) - Distinct from currency
  const [xp, setXp] = useState(1250);

  // Dashboard State (Moved from nested component)
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sidePanelView, setSidePanelView] = useState<'notifications' | 'settings'>('notifications');
  const [reactionMenuTarget, setReactionMenuTarget] = useState<{id: string, name: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRel, setNewUnitRel] = useState('Partner');

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([
      { id: '1', type: 'message', title: 'New Voice Memo', message: 'Alex sent a check-in.', timestamp: Date.now() - 1000 * 60 * 5, read: false },
      { id: '2', type: 'reward', title: 'Goal Met', message: '+500 Tokens for "Date Night".', timestamp: Date.now() - 1000 * 60 * 60, read: false },
      { id: '3', type: 'alert', title: 'High Stress', message: 'Conflict pattern detected in Lounge.', timestamp: Date.now() - 1000 * 60 * 60 * 2, read: true },
      { id: '4', type: 'system', title: 'System Update', message: 'v1.2.0 installed successfully.', timestamp: Date.now() - 1000 * 60 * 60 * 24, read: true },
  ]);
  const [notifFilter, setNotifFilter] = useState<'all' | 'alert' | 'message' | 'system' | 'reward'>('all');

  // Long Press & Reaction Logic
  const [menuPosition, setMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    const lastUserEmail = localStorage.getItem('inside_last_user');
    if (lastUserEmail) {
        const users = JSON.parse(localStorage.getItem('inside_users') || '{}');
        const userData = users[lastUserEmail];
        if (userData && userData.profile) {
            // Migration: Ensure loved ones have economy data
            const migratedProfile = migrateProfile(userData.profile);
            setUser(migratedProfile);
            setCurrentUserEmail(lastUserEmail);
            setMode(AppMode.DASHBOARD);
        }
    }
  }, []);

  // Global Pointer Listeners for Slide-to-Select
  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
        if (reactionMenuTarget) {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const reactionBtn = el?.closest('[data-reaction]');
            if (reactionBtn) {
                const reaction = reactionBtn.getAttribute('data-reaction');
                setActiveReaction(reaction);
            } else {
                setActiveReaction(null);
            }
        }
    };

    const handleGlobalUp = (e: PointerEvent) => {
        if (reactionMenuTarget) {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const reactionBtn = el?.closest('[data-reaction]');
            const reaction = reactionBtn?.getAttribute('data-reaction');
            
            if (reaction) {
                sendReaction(reaction);
            } else {
                setReactionMenuTarget(null);
            }
            
            // Close menu and reset
            setMenuPosition(null);
            setActiveReaction(null);
            document.body.style.overflow = '';
            isLongPress.current = false;
        }
    };

    if (reactionMenuTarget) {
        window.addEventListener('pointermove', handleGlobalMove);
        window.addEventListener('pointerup', handleGlobalUp);
        document.body.style.overflow = 'hidden';
    }

    return () => {
        window.removeEventListener('pointermove', handleGlobalMove);
        window.removeEventListener('pointerup', handleGlobalUp);
        document.body.style.overflow = '';
    };
  }, [reactionMenuTarget]);

  const migrateProfile = (profile: UserProfile): UserProfile => {
      // Ensure all loved ones have economy data structure
      const updatedLovedOnes = profile.lovedOnes.map(lo => ({
          ...lo,
          economy: lo.economy || { ...DEFAULT_ECONOMY },
          balance: lo.balance ?? 500,
          marketItems: lo.marketItems || [...DEFAULT_MARKET_ITEMS]
      }));
      return { ...profile, lovedOnes: updatedLovedOnes };
  };

  const handleLoginSuccess = (email: string) => {
    const users = JSON.parse(localStorage.getItem('inside_users') || '{}');
    const userData = users[email];
    
    setCurrentUserEmail(email);
    localStorage.setItem('inside_last_user', email);

    if (userData && userData.profile) {
        const migrated = migrateProfile(userData.profile);
        setUser(migrated);
        setMode(AppMode.DASHBOARD);
    } else {
        setMode(AppMode.ONBOARDING);
    }
  };

  const handleSignupSuccess = (email: string) => {
    setCurrentUserEmail(email);
    localStorage.setItem('inside_last_user', email);
    setMode(AppMode.ONBOARDING);
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    const migrated = migrateProfile(profile);
    setUser(migrated);
    if (currentUserEmail) {
        const users = JSON.parse(localStorage.getItem('inside_users') || '{}');
        if (users[currentUserEmail]) {
            users[currentUserEmail].profile = migrated;
            localStorage.setItem('inside_users', JSON.stringify(users));
        }
    }
    setMode(AppMode.DASHBOARD);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    if (currentUserEmail) {
        const users = JSON.parse(localStorage.getItem('inside_users') || '{}');
        if (users[currentUserEmail]) {
            users[currentUserEmail].profile = updatedProfile;
            localStorage.setItem('inside_users', JSON.stringify(users));
        }
    }
  };
  
  const handleUpdateLovedOne = (id: string, updates: Partial<LovedOne>) => {
      if (!user) return;
      const updatedLovedOnes = user.lovedOnes.map(lo => 
          lo.id === id ? { ...lo, ...updates } : lo
      );
      handleProfileUpdate({ ...user, lovedOnes: updatedLovedOnes });
  };

  const handleLogout = () => {
      localStorage.removeItem('inside_last_user');
      setUser(null);
      setCurrentUserEmail(null);
      setMode(AppMode.LOGIN);
  };

  const handleRestrictedAccess = (targetMode: AppMode) => {
    setPendingMode(targetMode);
    setShowVoiceAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowVoiceAuth(false);
    if (pendingMode) {
      setMode(pendingMode);
      setPendingMode(null);
    }
  };

  // Notification API
  const addNotification = (type: AppNotification['type'], title: string, message: string) => {
      const newNote: AppNotification = {
          id: Date.now().toString() + Math.random().toString(),
          type,
          title,
          message,
          timestamp: Date.now(),
          read: false
      };
      setNotifications(prev => [newNote, ...prev]);
      
      // Optional: Auto-toast on high priority
      if (type === 'alert' || type === 'message') {
          showToast(title);
      }
  };

  // Dashboard Helpers
  const reactions = [
        { label: 'Love', icon: '❤️' },
        { label: 'Miss You', icon: '👋' },
        { label: 'Sorry', icon: '🥺' },
        { label: 'Good Morning', icon: '☀️' },
        { label: 'Good Night', icon: '🌙' },
  ];

  const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
  };

  const handleAddUnit = () => {
        if (!user || !newUnitName.trim()) return;
        const newPerson: LovedOne = {
            id: Date.now().toString(),
            name: newUnitName.trim(),
            relationship: newUnitRel,
            economy: { ...DEFAULT_ECONOMY },
            balance: 500,
            marketItems: [...DEFAULT_MARKET_ITEMS]
        };
        const updatedUser = {
            ...user,
            lovedOnes: [...user.lovedOnes, newPerson]
        };
        handleProfileUpdate(updatedUser);
        setNewUnitName('');
        setNewUnitRel('Partner');
        showToast(`Registered unit: ${newPerson.name}`);
  };

  const handleRemoveUnit = (id: string) => {
        if (!user) return;
        const updatedUser = {
            ...user,
            lovedOnes: user.lovedOnes.filter(l => l.id !== id)
        };
        handleProfileUpdate(updatedUser);
  };

  const togglePref = (key: keyof NonNullable<UserProfile['preferences']>) => {
        if (!user) return;
        const defaultPrefs = { notifications: true, hapticFeedback: true, privacyMode: false, shareData: true };
        const currentPrefs = user.preferences || defaultPrefs;
        const newPrefs = { ...currentPrefs, [key]: !currentPrefs[key] };
        const newUser = { ...user, preferences: newPrefs };
        setUser(newUser);
        if (currentUserEmail) {
            const users = JSON.parse(localStorage.getItem('inside_users') || '{}');
            if (users[currentUserEmail]) {
                users[currentUserEmail].profile = newUser;
                localStorage.setItem('inside_users', JSON.stringify(users));
            }
        }
  };

  const getPref = (key: keyof NonNullable<UserProfile['preferences']>) => {
        return user?.preferences?.[key] ?? true;
  };

  const sendReaction = (reaction: string) => {
        if (reactionMenuTarget) {
            showToast(`Sent ${reaction} to ${reactionMenuTarget.name}`);
            setReactionMenuTarget(null);
        }
  };
    
  const getBubbleStyle = (rel: string, name: string) => {
        const lowerRel = rel.toLowerCase();
        const initial = name.charAt(0).toUpperCase();
        if (lowerRel.includes('partner') || lowerRel.includes('spouse')) return { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', initial };
        if (lowerRel.includes('child') || lowerRel.includes('kid')) return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', initial };
        return { bg: 'bg-slate-600', text: 'text-white', border: 'border-slate-700', initial };
  };

  // Unit Interaction Handlers
  const handleUnitPointerDown = (e: React.PointerEvent, person: LovedOne) => {
      isLongPress.current = false;
      const x = e.clientX;
      const y = e.clientY;

      longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          setReactionMenuTarget(person);
          setMenuPosition({ x, y });
          if (navigator.vibrate) navigator.vibrate(50);
      }, 500);
  };

  const handleUnitPointerUp = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  const handleUnitPointerLeave = () => {
       if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  const markAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => notifFilter === 'all' || n.type === notifFilter);

  const Door = ({ side, position = 'center', swing = 'left', isOpen = false }: { side: 'top'|'right'|'bottom'|'left', position?: string, swing?: 'left'|'right', isOpen?: boolean }) => {
        let style: React.CSSProperties = {};
        
        if (side === 'right') {
            style = { right: '-10px', top: position === 'top' ? '20%' : position === 'bottom' ? '80%' : '50%', transform: 'translateY(-50%)' };
        } else if (side === 'bottom') {
            style = { bottom: '-10px', left: position === 'left' ? '20%' : position === 'right' ? '80%' : '50%', transform: 'translateX(-50%)' };
        } else if (side === 'left') {
            style = { left: '-10px', top: position === 'top' ? '20%' : position === 'bottom' ? '80%' : '50%', transform: 'translateY(-50%)' };
        } else if (side === 'top') {
             style = { top: '-10px', left: position === 'left' ? '20%' : position === 'right' ? '80%' : '50%', transform: 'translateX(-50%)' };
        }

        const isHorizontal = side === 'top' || side === 'bottom';
        const gapSize = isHorizontal ? 'w-10 h-[10px]' : 'w-[10px] h-10';

        return (
            <div className="absolute z-20 pointer-events-none" style={style}>
                 <div className={`${gapSize} bg-white`} /> 
            </div>
        )
  };

  const Window = ({ side, width = 'w-12' }: { side: 'top'|'right'|'bottom'|'left', width?: string }) => {
        let style: React.CSSProperties = {};
        if (side === 'top') style = { top: '-4px', left: '50%', transform: 'translateX(-50%)' };
        if (side === 'bottom') style = { bottom: '-4px', left: '50%', transform: 'translateX(-50%)' };
        if (side === 'left') style = { left: '-4px', top: '50%', transform: 'translateY(-50%)' };
        if (side === 'right') style = { right: '-4px', top: '50%', transform: 'translateY(-50%)' };
        const isHorizontal = side === 'top' || side === 'bottom';
        return (
            <div className={`absolute z-20 bg-white border-x-2 border-slate-900 ${isHorizontal ? `${width} h-2` : `w-2 h-12 border-y-2 border-x-0`}`} style={style}>
                <div className="w-full h-full bg-slate-200 opacity-50"></div>
            </div>
        );
  };

  // --- Render Switching ---

  if (showVoiceAuth) {
      return <VoiceAuth onAuthenticated={handleAuthSuccess} onCancel={() => setShowVoiceAuth(false)} />;
  }

  if (mode === AppMode.LOGIN) {
      return <AuthScreen onLogin={handleLoginSuccess} onSignup={handleSignupSuccess} />;
  }

  if (mode === AppMode.ONBOARDING) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Ensure user exists for dashboard and protected modes
  if (!user) return null;

  if (mode === AppMode.LIVE_COACH) {
      return <LiveCoachMode user={user} onExit={() => setMode(AppMode.DASHBOARD)} />;
  }

  if (mode === AppMode.THERAPIST) {
      return (
        <TherapistMode 
            user={user} 
            onExit={() => setMode(AppMode.DASHBOARD)}
            onAddNotification={addNotification}
        />
      );
  }

  if (mode === AppMode.ACTIVITIES) {
      return (
            <ActivitiesMode 
                user={user} 
                xp={xp} 
                setXp={setXp} 
                economy={user.economy || { currencyName: 'Tokens', currencySymbol: '🪙' }}
                onExit={() => setMode(AppMode.DASHBOARD)} 
                onUpdateLovedOne={handleUpdateLovedOne}
                onAddNotification={addNotification}
            />
      );
  }

  if (mode === AppMode.LOVE_MAPS) {
      return (
          <LoveMapsMode 
              user={user} 
              xp={xp} 
              setXp={setXp} 
              economy={user.economy || { currencyName: 'Tokens', currencySymbol: '🪙' }}
              onExit={() => setMode(AppMode.DASHBOARD)}
              onUpdateLovedOne={handleUpdateLovedOne}
              onAddNotification={addNotification}
          />
      );
  }

  if (mode === AppMode.REWARDS) {
      return (
          <RewardsMode 
              user={user}
              onUpdateLovedOne={handleUpdateLovedOne}
              onUpdateProfile={handleProfileUpdate}
              onExit={() => setMode(AppMode.DASHBOARD)}
              onAddNotification={addNotification}
          />
      );
  }

  if (mode === AppMode.PROFILE) {
      return <ProfileView user={user} onBack={() => setMode(AppMode.DASHBOARD)} />;
  }

  if (mode === AppMode.EDIT_PROFILE) {
      return <EditProfile user={user} onBack={() => setMode(AppMode.DASHBOARD)} onUpdateProfile={handleProfileUpdate} />;
  }

  // Default: Dashboard View
  return (
    <div className="min-h-screen bg-white p-0 flex flex-col relative overflow-hidden">
       <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
       <div className="absolute inset-0 z-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(#1e293b 2px, transparent 2px), linear-gradient(90deg, #1e293b 2px, transparent 2px)', backgroundSize: '100px 100px' }}></div>
       
       {toast && (
           <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-none border border-white shadow-xl z-50 flex items-center gap-2 animate-slide-in-down font-mono text-xs">
               <span className="text-lg">✨</span>
               <span className="font-bold uppercase">{toast}</span>
           </div>
       )}

       <header className="relative z-20 px-6 pt-6 pb-4 flex justify-between items-start bg-white/80 backdrop-blur-sm border-b-4 border-slate-900">
         <div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-1">
                <Ruler size={12} />
                <span>Project: Inside</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">FLOOR PLAN</h1>
            <p className="text-[10px] font-mono text-slate-400 mt-1">LVL 1 • GENERAL ARRANGEMENT</p>
         </div>

         <div className="flex items-center gap-4 mt-1">
             <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                     <div className="text-xs font-bold uppercase tracking-widest text-slate-900">{user.name}</div>
                     <div className="text-[10px] font-mono text-slate-400 uppercase">CMD: ONLINE</div>
                 </div>
                 <div className="w-16 h-16 bg-slate-900 text-white border-2 border-slate-900 flex items-center justify-center font-bold text-2xl shadow-[4px_4px_0px_rgba(30,41,59,0.2)]">
                    {user.name.charAt(0)}
                 </div>
             </div>
         </div>
       </header>

       <div className="w-full bg-slate-50/80 backdrop-blur-sm border-b-2 border-slate-200 px-6 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar z-10 shadow-lg">
          <div className="flex flex-col justify-center border-r-2 border-slate-200 pr-4 mr-1 shrink-0">
             <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">Active</span>
             <span className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-widest leading-none">Units</span>
          </div>
          {user?.lovedOnes?.map(person => {
             const style = getBubbleStyle(person.relationship, person.name);
             return (
                 <button 
                    key={person.id} 
                    onPointerDown={(e) => handleUnitPointerDown(e, person)}
                    onPointerUp={handleUnitPointerUp}
                    onPointerLeave={handleUnitPointerLeave}
                    onContextMenu={(e) => e.preventDefault()}
                    className="group relative flex flex-col items-center gap-1 shrink-0 transition-transform active:scale-95 touch-none" 
                    title={`${person.name} (Hold to React)`}
                 >
                    <div className={`w-10 h-10 ${style.bg} ${style.text} border-2 ${style.border} flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_rgba(30,41,59,0.1)] group-hover:shadow-[3px_3px_0px_rgba(30,41,59,0.2)] transition-all`}>
                        {style.initial}
                    </div>
                 </button>
             )
          })}
           <button onClick={() => setIsAddingUnit(true)} className="w-10 h-10 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:border-slate-500 hover:text-slate-500 transition-colors shrink-0 bg-white" title="Add Unit">
                <Plus size={16} />
            </button>
       </div>

       <div className={`flex-1 flex flex-col relative transition-transform duration-300 ease-in-out ${showSidePanel ? '-translate-x-16 opacity-50' : ''}`}>
         <div className="flex-1 flex flex-col items-center justify-center w-full overflow-y-auto overflow-x-hidden pt-2 pb-4 px-12">
            <div className="bg-slate-900 p-2 shadow-2xl relative shrink-0" style={{ width: '100%', maxWidth: '26rem', aspectRatio: '4/5', maxHeight: '65vh' }}>
                <div className="absolute -top-6 left-0 w-full text-center text-[10px] font-mono text-slate-400 border-b border-slate-300">30' - 0"</div>
                <div className="absolute top-0 -left-8 h-full flex items-center justify-end pr-1 text-[10px] font-mono text-slate-400 border-r border-slate-300"><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>40' - 0"</span></div>
                
                {/* GRID SYSTEM: 6 cols x 6 rows */}
                <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-2 bg-slate-900">
                    
                    {/* ROOM 1: LOUNGE (Therapist) - Top Left (2x2) */}
                    <button 
                        onClick={() => setMode(AppMode.THERAPIST)}
                        className="col-span-2 row-span-2 bg-white hover:bg-slate-50 transition-colors relative group overflow-visible flex flex-col justify-between p-3 text-left border-2 border-slate-200"
                        style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                    >
                         <Window side="top" /><Window side="left" />
                         
                         {/* Door Bottom to Map Room */}
                         <Door side="bottom" position="center" swing="right" isOpen={true} />

                        <div className="z-10">
                            <span className="text-[8px] font-mono font-bold text-slate-400 block border-b border-slate-300 w-fit mb-1">RM-101</span>
                            <h3 className="font-black text-xs text-slate-900 leading-none">LOUNGE</h3>
                            <p className="text-[8px] font-mono text-indigo-600 mt-1 font-bold uppercase">AI Therapy</p>
                        </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-10"><Armchair size={40} strokeWidth={1} /></div>
                        <div className="z-10 flex items-end justify-between mt-auto"><MessageCircle size={14} className="text-slate-400" /></div>
                    </button>

                    {/* ROOM 2: GAME ROOM (Activities) - Top Center (2x2) */}
                    <button 
                        onClick={() => setMode(AppMode.ACTIVITIES)}
                        className="col-span-2 row-span-2 bg-white hover:bg-slate-50 transition-colors relative group overflow-visible flex flex-col justify-between p-3 text-left border-2 border-slate-200"
                        style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                    >
                        <Window side="top" width="w-8" />
                        
                        {/* Door Bottom to Map Room */}
                        <Door side="bottom" position="center" swing="right" isOpen={true} /> 

                        <div className="z-10">
                            <span className="text-[8px] font-mono font-bold text-slate-400 block border-b border-slate-300 w-fit mb-1">RM-102</span>
                            <h3 className="font-black text-xs text-slate-900 leading-none tracking-tight">GAME RM</h3>
                            <p className="text-[8px] font-mono text-orange-600 mt-1 font-bold uppercase">Quests</p>
                        </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-10"><Gamepad2 size={40} strokeWidth={1} /></div>
                    </button>

                    {/* ROOM 3: VAULT (Rewards) - Top Right (2x2) */}
                    <button 
                        onClick={() => setMode(AppMode.REWARDS)}
                        className="col-span-2 row-span-2 bg-slate-100 hover:bg-slate-200 transition-colors relative group overflow-visible flex flex-col justify-between p-3 text-left border-4 border-slate-300"
                    >
                        <Window side="top" /><Window side="right" />
                        {/* Door Bottom to Map Room */}
                        <Door side="bottom" position="center" swing="left" />

                        <div className="z-10 w-full">
                            <span className="text-[8px] font-mono font-bold text-slate-400 block border-b border-slate-300 w-fit mb-1">RM-104</span>
                            <h3 className="font-black text-xs text-slate-900 leading-none flex items-center gap-1"><Lock size={12} /> MARKET</h3>
                            <p className="text-[8px] font-mono text-yellow-600 mt-1 font-bold uppercase">Shared Economy</p>
                        </div>
                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-10"><Gift size={32} strokeWidth={1} /></div>
                    </button>

                    {/* ROOM 4: MAP ROOM (Love Maps) - Middle Strip (6x2) */}
                    <button 
                        onClick={() => setMode(AppMode.LOVE_MAPS)}
                        className="col-span-6 row-span-2 bg-slate-50 hover:bg-slate-100 transition-colors relative group overflow-visible flex flex-col justify-between p-4 text-left border-2 border-slate-200"
                        style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                    >
                        {/* Connection to Lounge (Top Left) */}
                        <Door side="top" position="left" swing="left" />
                        
                        {/* Connection to Game Room (Top Center) */}
                        <Door side="top" position="center" swing="left" />
                        
                        {/* Connection to Vault (Top Right) */}
                        <Door side="top" position="right" swing="right" />
                        
                        {/* Connection to Master (Bottom Left-ish) */}
                        <Door side="bottom" position="left" swing="right" />

                        <div className="z-10 flex justify-between w-full">
                            <div>
                                <span className="text-[8px] font-mono font-bold text-slate-400 block border-b border-slate-300 w-fit mb-1">RM-103</span>
                                <h3 className="font-black text-lg text-slate-900 leading-none tracking-tight">LIVING ROOM</h3>
                                <p className="text-[8px] font-mono text-pink-600 mt-1 font-bold uppercase">Love Map</p>
                            </div>
                            <MapIcon size={40} strokeWidth={1} className="opacity-20" />
                        </div>
                    </button>

                    {/* ROOM 5: MASTER SUITE (Profile) - Bottom Left (4x2) */}
                    <button 
                        onClick={() => setMode(AppMode.PROFILE)}
                        className="col-span-4 row-span-2 bg-white hover:bg-slate-50 transition-colors relative group overflow-visible flex flex-col justify-between p-4 text-left border-2 border-slate-200"
                        style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                    >
                        <Window side="bottom" width="w-20" /><Window side="left" />
                        
                        {/* Door to Map Room (Top) */}
                        <Door side="top" position="left" swing="left" isOpen={true} />
                        
                        {/* Door to Deck (Right) */}
                        <Door side="right" position="top" swing="right" />

                        <div className="z-10">
                             <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[8px] font-mono font-bold text-slate-400 block border-b border-slate-300 w-fit mb-1">RM-200</span>
                                    <h3 className="font-black text-lg text-slate-900 leading-none tracking-tight">MASTER<br/>SUITE</h3>
                                    <p className="text-[8px] font-mono text-indigo-500 mt-1 font-bold uppercase">Analytics & Settings</p>
                                </div>
                                <div className="text-right">
                                     <div className="text-xl font-black text-slate-900">85%</div>
                                     <div className="text-[6px] font-bold text-slate-400 uppercase">Health</div>
                                 </div>
                             </div>
                        </div>
                         <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 opacity-10"><FileText size={50} strokeWidth={1} /></div>
                        <div className="z-10 flex items-center justify-between mt-auto"><span className="text-[8px] font-mono text-slate-400">20' x 14'</span></div>
                    </button>

                    {/* ROOM 6: DIALOGUE DECK (Live Coach) - Bottom Right (2x2) */}
                    <button 
                        onClick={() => handleRestrictedAccess(AppMode.LIVE_COACH)}
                        className="col-span-2 row-span-2 bg-slate-50 hover:bg-slate-100 transition-colors relative group overflow-hidden flex flex-col justify-between p-3 text-left border-2 border-dashed border-slate-300"
                    >
                        <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 8px)' }}></div>
                        <div className="z-10">
                            <div className="flex items-center gap-1 mb-1"><span className="text-[6px] font-mono font-bold text-slate-500 bg-white px-1 border border-slate-200">EXTERIOR</span></div>
                            <h3 className="font-black text-sm text-slate-900 tracking-tight leading-none">DIALOGUE<br/>DECK</h3>
                            <p className="text-[8px] font-mono text-cyan-600 mt-1 font-bold uppercase">Live Coaching</p>
                        </div>
                        <div className="z-10 flex items-end justify-between mt-auto"><Radio size={16} className="text-slate-400" /></div>
                    </button>
                </div>
            </div>
            <div className="w-full max-w-md mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-2 shrink-0">
                <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-900 bg-white"></div><span className="text-[10px] font-mono uppercase text-slate-500">Interior</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-dashed border-slate-400 bg-slate-50"></div><span className="text-[10px] font-mono uppercase text-slate-500">Exterior</span></div>
            </div>
         </div>
       </div>

       <button 
            onClick={() => { setShowSidePanel(true); setSidePanelView('notifications'); }} 
            className="absolute bottom-6 right-6 z-30 w-10 h-10 bg-slate-900 text-white border-2 border-slate-900 shadow-[2px_2px_0px_rgba(255,255,255,1)] flex items-center justify-center hover:bg-slate-800 transition-all active:translate-y-0.5 active:shadow-none group"
            title="Notification Center"
       >
            <Bell size={18} className={unreadCount > 0 ? 'animate-bounce' : ''} />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-slate-900"></span>
            )}
       </button>

       <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${showSidePanel ? 'translate-x-0' : 'translate-x-full'}`}>
           
           {/* === NOTIFICATION CENTER VIEW === */}
           {sidePanelView === 'notifications' && (
               <>
                   <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
                       <div>
                           <h2 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inbox</h2>
                           <div className="flex items-center gap-2">
                               <h3 className="text-lg font-black uppercase tracking-tight">Notification Center</h3>
                               {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded">{unreadCount}</span>}
                           </div>
                       </div>
                       <div className="flex items-center gap-2">
                           <button onClick={() => setSidePanelView('settings')} className="text-slate-400 hover:text-white transition-colors" title="Settings">
                               <Settings size={20} />
                           </button>
                           <button onClick={() => setShowSidePanel(false)} className="text-slate-400 hover:text-white transition-colors">
                               <X size={24} />
                           </button>
                       </div>
                   </div>

                   {/* Filters */}
                   <div className="p-4 border-b border-slate-800 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                       {['all', 'message', 'alert', 'reward', 'system'].map((f) => (
                           <button
                               key={f}
                               onClick={() => setNotifFilter(f as any)}
                               className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors whitespace-nowrap ${
                                   notifFilter === f 
                                   ? 'bg-white text-slate-900 border-white' 
                                   : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                               }`}
                           >
                               {f}
                           </button>
                       ))}
                   </div>

                   {/* List */}
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                       {filteredNotifications.length === 0 && (
                           <div className="text-center py-10 text-slate-600 text-xs font-mono uppercase">No notifications found.</div>
                       )}
                       {filteredNotifications.map(n => (
                           <div key={n.id} className={`p-4 bg-slate-800 border-l-4 ${n.read ? 'border-slate-600 opacity-60' : 'border-indigo-500'} hover:bg-slate-700 transition-colors group relative`}>
                               {!n.read && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></div>}
                               <div className="flex items-start gap-3">
                                   <div className={`mt-0.5 ${
                                       n.type === 'alert' ? 'text-orange-500' :
                                       n.type === 'message' ? 'text-blue-400' :
                                       n.type === 'reward' ? 'text-yellow-400' : 'text-slate-400'
                                   }`}>
                                       {n.type === 'alert' ? <AlertTriangle size={16} /> :
                                        n.type === 'message' ? <MessageCircle size={16} /> :
                                        n.type === 'reward' ? <Gift size={16} /> : <Zap size={16} />}
                                   </div>
                                   <div>
                                       <h4 className="text-xs font-bold uppercase text-white mb-0.5">{n.title}</h4>
                                       <p className="text-[11px] text-slate-300 leading-snug font-medium">{n.message}</p>
                                       <span className="text-[9px] font-mono text-slate-500 mt-2 block">{Math.floor((Date.now() - n.timestamp) / 60000)}m ago</span>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
                   
                   <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
                       <button onClick={markAllRead} className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Mark All as Read</button>
                   </div>
               </>
           )}

           {/* === SETTINGS VIEW === */}
           {sidePanelView === 'settings' && (
               <>
                   <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
                       <div className="flex items-center gap-3">
                           <button onClick={() => setSidePanelView('notifications')} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
                           <div>
                               <h2 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Config</h2>
                               <h3 className="text-lg font-black uppercase tracking-tight">System Settings</h3>
                           </div>
                       </div>
                       <button onClick={() => setShowSidePanel(false)} className="text-slate-400 hover:text-white transition-colors">
                           <X size={24} />
                       </button>
                   </div>

                   <div className="flex-1 overflow-y-auto">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white text-slate-900 rounded-lg flex items-center justify-center font-bold text-xl border-2 border-slate-400">{user?.name.charAt(0)}</div>
                                    <div>
                                        <div className="text-xs font-mono text-slate-500 uppercase">Project Lead</div>
                                        <div className="font-bold">{user?.name}</div>
                                        <button onClick={() => { setShowSidePanel(false); setMode(AppMode.EDIT_PROFILE); }} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1"><Settings size={10} /> Edit Profile</button>
                                    </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800/50 border-b border-slate-700"><h3 className="font-bold text-slate-400 flex items-center gap-2 text-xs uppercase tracking-widest"><Sliders size={14} /> Global Preferences</h3></div>
                        <div className="divide-y divide-slate-800">
                            <div className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3"><Bell size={18} className="text-slate-400" /><div><p className="text-sm font-bold text-white uppercase">Smart Nudges</p><p className="text-[10px] text-slate-500 font-mono">Wearable Alerts</p></div></div>
                                <button onClick={() => togglePref('notifications')} className={`w-10 h-5 transition-colors relative border-2 ${getPref('notifications') ? 'bg-green-500 border-green-600' : 'bg-slate-700 border-slate-600'}`}><div className={`w-3 h-3 bg-white shadow-sm absolute top-0.5 transition-all ${getPref('notifications') ? 'left-5' : 'left-0.5'}`} /></button>
                            </div>
                            <div className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3"><Zap size={18} className="text-slate-400" /><div><p className="text-sm font-bold text-white uppercase">Haptics</p><p className="text-[10px] text-slate-500 font-mono">Tactile Feedback</p></div></div>
                                <button onClick={() => togglePref('hapticFeedback')} className={`w-10 h-5 transition-colors relative border-2 ${getPref('hapticFeedback') ? 'bg-green-500 border-green-600' : 'bg-slate-700 border-slate-600'}`}><div className={`w-3 h-3 bg-white shadow-sm absolute top-0.5 transition-all ${getPref('hapticFeedback') ? 'left-5' : 'left-0.5'}`} /></button>
                            </div>
                            <div className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3"><Eye size={18} className="text-slate-400" /><div><p className="text-sm font-bold text-white uppercase">Stealth Mode</p><p className="text-[10px] text-slate-500 font-mono">Mask Dashboard</p></div></div>
                                <button onClick={() => togglePref('privacyMode')} className={`w-10 h-5 transition-colors relative border-2 ${getPref('privacyMode') ? 'bg-green-500 border-green-600' : 'bg-slate-700 border-slate-600'}`}><div className={`w-3 h-3 bg-white shadow-sm absolute top-0.5 transition-all ${getPref('privacyMode') ? 'left-5' : 'left-0.5'}`} /></button>
                            </div>
                        </div>
                        <div className="p-6 text-center mt-4"><p className="text-[9px] font-mono text-slate-500 mb-2 uppercase">Inside.OS v1.2.0</p></div>
                   </div>
                   <div className="p-6 border-t border-slate-800 bg-slate-950 space-y-3 shrink-0">
                        <button onClick={handleLogout} className="w-full py-3 text-rose-500 hover:text-white hover:bg-rose-900 transition-all text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 border border-dashed border-rose-900/30 hover:border-rose-500"><LogOut size={14} /> System Logout</button>
                   </div>
               </>
           )}
       </div>

       {isAddingUnit && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
               <div className="bg-white w-full max-w-sm border-2 border-slate-900 p-6 shadow-[8px_8px_0px_rgba(15,23,42,1)] relative animate-slide-in-down">
                   <button onClick={() => setIsAddingUnit(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"><X size={20} /></button>
                   <div className="mb-6 flex justify-between items-start">
                       <div><h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Team Roster</h3><p className="font-mono text-slate-500 text-xs mt-1">MANAGE RELATIONSHIP NODES</p></div>
                       <Users size={24} className="text-slate-200" />
                   </div>
                   <div className="space-y-2 border-2 border-slate-100 bg-slate-50 p-2 min-h-[120px] max-h-48 overflow-y-auto mb-4">
                        {user?.lovedOnes.length === 0 && (<div className="h-full flex flex-col items-center justify-center text-slate-400 py-6"><span className="text-[10px] font-mono uppercase">No personnel assigned</span></div>)}
                        {user?.lovedOnes.map(person => (
                          <div key={person.id} className="flex items-center justify-between bg-white p-2 border border-slate-200 shadow-sm group">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center text-xs font-bold border border-slate-900">{person.name.charAt(0)}</div><div><p className="font-bold text-xs uppercase text-slate-900 leading-none">{person.name}</p><p className="text-[10px] font-mono text-slate-500 uppercase">{person.relationship}</p></div></div>
                            <button onClick={() => handleRemoveUnit(person.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        ))}
                   </div>
                   <div className="bg-slate-100 p-3 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                          <input type="text" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="NAME" className="col-span-3 bg-white border border-slate-300 p-2 text-xs font-bold uppercase placeholder:text-slate-300 focus:outline-none focus:border-indigo-500" onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}/>
                          <select value={newUnitRel} onChange={(e) => setNewUnitRel(e.target.value)} className="col-span-2 bg-white border border-slate-300 p-2 text-[10px] font-bold uppercase focus:outline-none focus:border-indigo-500"><option value="Partner">Partner</option><option value="Spouse">Spouse</option><option value="Child">Child</option><option value="Parent">Parent</option><option value="Friend">Friend</option><option value="Sibling">Sibling</option><option value="Colleague">Colleague</option></select>
                      </div>
                      <button onClick={handleAddUnit} disabled={!newUnitName.trim()} className="w-full bg-white border-2 border-slate-900 hover:bg-slate-50 disabled:opacity-50 text-slate-900 text-[10px] font-bold uppercase tracking-widest py-2 flex items-center justify-center gap-2 transition-colors"><Plus size={12} /> Add Entry</button>
                   </div>
               </div>
           </div>
       )}

       {reactionMenuTarget && menuPosition && (
           <div className="fixed inset-0 z-50 pointer-events-none">
               {(() => {
                   const MENU_WIDTH = 290;
                   const SCREEN_MARGIN = 16;
                   const screenW = typeof window !== 'undefined' ? window.innerWidth : 1000;
                   
                   let left = menuPosition.x;
                   let transform = 'translate(-50%, -100%)';

                   if (left - MENU_WIDTH / 2 < SCREEN_MARGIN) {
                       left = SCREEN_MARGIN;
                       transform = 'translate(0, -100%)';
                   } else if (left + MENU_WIDTH / 2 > screenW - SCREEN_MARGIN) {
                       left = screenW - SCREEN_MARGIN;
                       transform = 'translate(-100%, -100%)';
                   }

                   return (
                       <div 
                           className="absolute pointer-events-auto"
                           style={{ 
                               left: left, 
                               top: menuPosition.y - 12,
                               transform: transform,
                               width: 'max-content'
                           }}
                       >
                           <div className="flex items-center gap-2 p-2 bg-white rounded-full border-2 border-slate-900 shadow-xl animate-fade-in">
                                {reactions.map((r, i) => (
                                    <div 
                                        key={i} 
                                        data-reaction={r.icon}
                                        className={`
                                            w-12 h-12 flex flex-col items-center justify-center rounded-full transition-all duration-200
                                            ${activeReaction === r.icon ? 'bg-indigo-100 scale-125 border-2 border-indigo-500 z-10 shadow-lg' : 'bg-transparent hover:bg-slate-50 border border-transparent'}
                                        `}
                                    >
                                        <span className="text-2xl">{r.icon}</span>
                                        {activeReaction === r.icon && (
                                            <span className="absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap border border-slate-700">
                                                {r.label}
                                            </span>
                                        )}
                                    </div>
                                ))}
                           </div>
                       </div>
                   );
               })()}
           </div>
       )}
    </div>
  );
};

export default App;

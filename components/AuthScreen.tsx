import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Ruler, Fingerprint, UserPlus, LogIn } from 'lucide-react';

interface Props {
  onLogin: (email: string) => void;
  onSignup: (email: string) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isLogin && password !== confirmPassword) {
        setError("Passkeys do not match.");
        return;
    }

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('inside_users') || '{}');

      if (isLogin) {
        // Login Logic
        const user = users[email];
        if (user && user.password === password) {
            setLoading(false);
            onLogin(email);
        } else {
            setLoading(false);
            setError("Invalid credentials or user not found.");
        }
      } else {
        // Signup Logic
        if (users[email]) {
            setLoading(false);
            setError("User already exists.");
        } else {
            // Create base user record
            users[email] = { password, profile: null };
            localStorage.setItem('inside_users', JSON.stringify(users));
            setLoading(false);
            onSignup(email);
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
       
       {/* Blueprint Grid Background Pattern */}
       <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
            style={{ 
                backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}>
       </div>

       {/* Main Container */}
       <div className="w-full max-w-sm bg-white border-2 border-slate-900 shadow-[8px_8px_0px_rgba(30,41,59,0.2)] relative z-10 animate-fade-in flex flex-col">
          
          {/* Header Strip */}
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b-2 border-slate-900">
             <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest">
                <Ruler size={14} className="text-indigo-400" />
                <span>Access Control</span>
             </div>
             <div className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                SECURE
             </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1 leading-none">
                    {isLogin ? 'Welcome Back' : 'Join Us Inside'}
                </h1>
                <p className="text-xs font-mono text-slate-500 mt-2">
                    {isLogin ? '// PLEASE AUTHENTICATE' : '// INITIALIZE ACCOUNT'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Identity (Email)
                    </label>
                    <div className="relative">
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 p-3 pl-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none placeholder:text-slate-300"
                            placeholder="USER@DOMAIN.COM"
                        />
                        <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Passkey
                    </label>
                    <div className="relative">
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 p-3 pl-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none placeholder:text-slate-300"
                            placeholder="••••••••"
                        />
                        <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                    </div>
                </div>

                {!isLogin && (
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                            Confirm Passkey
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 p-3 pl-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none placeholder:text-slate-300"
                                placeholder="••••••••"
                            />
                            <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-600 text-xs font-bold animate-slide-in-down">
                        ERROR: {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold text-sm uppercase tracking-widest py-4 flex items-center justify-center gap-2 transition-all shadow-lg active:translate-y-0.5 active:shadow-none mt-6"
                >
                    {loading ? 'Processing...' : isLogin ? (
                        <>Unlock Dashboard <ArrowRight size={16} /></>
                    ) : (
                        <>Initialize Setup <Fingerprint size={16} /></>
                    )}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center">
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(null); setConfirmPassword(''); }}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                    {isLogin ? (
                        <><UserPlus size={14} /> Request Access</>
                    ) : (
                        <><LogIn size={14} /> Already Registered?</>
                    )}
                </button>
            </div>
          </div>
       </div>

       {/* Footer Branding */}
       <div className="absolute bottom-6 flex flex-col items-center gap-1 opacity-50">
           <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
               <ShieldCheck size={12} />
               <span>Inside Secure Gateway</span>
           </div>
       </div>
    </div>
  );
};

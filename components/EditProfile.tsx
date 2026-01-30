
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowLeft, Save, ArrowRight, Fingerprint, X } from 'lucide-react';

interface Props {
  user: UserProfile;
  onBack: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const EditProfile: React.FC<Props> = ({ user, onBack, onUpdateProfile }) => {
  const [name, setName] = useState(user.name);
  const [gender, setGender] = useState(user.gender || 'Prefer not to say');
  const [personality, setPersonality] = useState(user.personalityType || '');
  const [description, setDescription] = useState(user.personalDescription || '');
  const [interests, setInterests] = useState(user.interests?.join(', ') || '');
  const [isDirty, setIsDirty] = useState(false);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
      setter(value);
      setIsDirty(true);
  };

  const handleSave = () => {
      const updatedUser: UserProfile = {
          ...user,
          name,
          gender,
          personalityType: personality,
          personalDescription: description,
          interests: interests.split(',').map(s => s.trim()).filter(Boolean)
      };
      onUpdateProfile(updatedUser);
      setIsDirty(false);
      alert("Identity Configuration Updated Successfully");
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans relative animate-fade-in">
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
                    <Fingerprint size={12} />
                    <span>MODULE: CONFIG</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                    IDENTITY
                </h1>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold mt-1">
                    EDIT CORE DATA
                </p>
            </div>
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center border-2 border-slate-200 hover:border-slate-900 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-20 relative z-10">
             <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_rgba(30,41,59,0.1)]">
                 <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Identity Config</h3>
                    <div className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-1 border border-indigo-200 uppercase">Editable</div>
                 </div>

                 <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                            Subject Name
                        </label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => handleInputChange(setName, e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none"
                        />
                    </div>

                    {/* Gender & Personality */}
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                Gender
                            </label>
                            <div className="relative">
                                <select 
                                    value={gender} 
                                    onChange={(e) => handleInputChange(setGender, e.target.value)}
                                    className="w-full appearance-none bg-slate-50 border-2 border-slate-200 p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none"
                                >
                                    <option value="Prefer not to say">PREFER NOT TO SAY</option>
                                    <option value="Male">MALE</option>
                                    <option value="Female">FEMALE</option>
                                    <option value="Non-binary">NON-BINARY</option>
                                    <option value="Other">OTHER</option>
                                </select>
                                <ArrowRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 rotate-90" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                Personality
                            </label>
                            <input 
                                type="text" 
                                value={personality} 
                                onChange={(e) => handleInputChange(setPersonality, e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none"
                                placeholder="e.g. INFJ"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                            Personal Bio
                        </label>
                        <textarea 
                            value={description} 
                            onChange={(e) => handleInputChange(setDescription, e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none min-h-[100px]"
                            placeholder="Describe yourself..."
                        />
                    </div>

                     {/* Interests */}
                     <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                            Interests
                        </label>
                        <input 
                            type="text" 
                            value={interests} 
                            onChange={(e) => handleInputChange(setInterests, e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none"
                            placeholder="Comma separated list"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                        <button 
                            onClick={handleSave}
                            disabled={!isDirty}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-widest py-4 flex items-center justify-center gap-2 transition-all shadow-lg active:translate-y-0.5 active:shadow-none"
                        >
                            <Save size={16} /> Save Configuration
                        </button>
                        {!isDirty && (
                            <p className="text-center text-[10px] font-mono text-slate-400 mt-2 uppercase">All systems nominal. No changes detected.</p>
                        )}
                    </div>
                 </div>
             </div>
        </div>
    </div>
  );
};

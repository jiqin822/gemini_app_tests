
import React, { useState, useRef } from 'react';
import { UserProfile, LovedOne } from '../types';
import { Mic, Check, ArrowRight, Plus, Trash2, Users, Heart, Ruler, Fingerprint, ShieldCheck, Activity, BrainCircuit, Info } from 'lucide-react';
import { createPcmBlob } from '../services/audioUtils';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  
  // New Profile Fields
  const [gender, setGender] = useState('Prefer not to say');
  const [personality, setPersonality] = useState('');
  const [description, setDescription] = useState('');
  const [interests, setInterests] = useState('');

  // Loved Ones State
  const [lovedOnes, setLovedOnes] = useState<LovedOne[]>([]);
  const [newName, setNewName] = useState('');
  const [newRel, setNewRel] = useState('Partner');

  // Voice Print State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [voiceData, setVoiceData] = useState<string | null>(null);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);

  const addLovedOne = () => {
    if (newName.trim()) {
      setLovedOnes([...lovedOnes, {
        id: Date.now().toString(),
        name: newName,
        relationship: newRel
      }]);
      setNewName('');
      // Reset relationship default based on current list or status
      setNewRel('Friend'); 
    }
  };

  const removeLovedOne = (id: string) => {
    setLovedOnes(lovedOnes.filter(l => l.id !== id));
  };

  const handleVoicePrint = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = ctx;
        
        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        
        audioChunksRef.current = [];
        setIsRecording(true);
        setRecordingProgress(0);

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            // Copy buffer to avoid reference issues
            audioChunksRef.current.push(new Float32Array(inputData));
        };

        source.connect(processor);
        processor.connect(ctx.destination);

        // Progress Timer (Record for ~3 seconds)
        let progress = 0;
        const interval = setInterval(() => {
          progress += 2; // 50 ticks = 100% -> approx 2.5s
          setRecordingProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            stopRecording();
          }
        }, 60); 

    } catch (e) {
        console.error("Mic access failed", e);
        alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
      if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
      }
      if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
      }
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
      }
      if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
      }

      setIsRecording(false);
      setVoiceRecorded(true);

      // Process Audio Data
      const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunksRef.current) {
          result.set(chunk, offset);
          offset += chunk.length;
      }
      
      // Convert to PCM Base64 for storage using existing util (reused from Gemini service logic)
      const pcmBlob = createPcmBlob(result);
      setVoiceData(pcmBlob.data); // Store the base64 string

      setTimeout(() => setStep(4), 500);
  };

  const handleSkipVoice = () => {
    setVoiceRecorded(false);
    setVoiceData(null);
    setStep(4);
  };

  const handleFinish = () => {
    // Infer/Simulate attachment stats for demo
    const anxietyScore = 35; 
    const avoidanceScore = 25;
    const inferredStyle = 'secure'; 

    // Find primary partner name if exists
    const partner = lovedOnes.find(l => l.relationship.toLowerCase().includes('partner') || l.relationship.toLowerCase().includes('spouse') || l.relationship.toLowerCase().includes('wife') || l.relationship.toLowerCase().includes('husband'));

    onComplete({
      id: crypto.randomUUID(),
      name,
      partnerName: partner?.name,
      relationshipStatus: 'dating', // Defaulting as UI input was removed
      gender,
      personalDescription: description,
      interests: interests.split(',').map(i => i.trim()).filter(Boolean),
      lovedOnes: lovedOnes,
      attachmentStyle: inferredStyle,
      attachmentStats: {
          anxiety: anxietyScore,
          avoidance: avoidanceScore
      },
      // Only set ID if they actually recorded
      voicePrintId: voiceRecorded ? 'vp_' + Date.now() : undefined,
      voicePrintData: voiceData || undefined,
      personalityType: personality || 'Unknown', 
    });
  };

  // Helper Icon component for the Quote box
  const MessageCircle = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
       
       {/* Blueprint Grid Background Pattern */}
       <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
            style={{ 
                backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}>
       </div>
       <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
            style={{ 
                backgroundImage: 'linear-gradient(#1e293b 2px, transparent 2px), linear-gradient(90deg, #1e293b 2px, transparent 2px)', 
                backgroundSize: '100px 100px' 
            }}>
       </div>

       {/* Main Container */}
       <div className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[8px_8px_0px_rgba(30,41,59,0.2)] relative z-10 animate-fade-in flex flex-col max-h-[90vh]">
          
          {/* Header Strip */}
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b-2 border-slate-900 shrink-0">
             <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest">
                <Ruler size={14} className="text-indigo-400" />
                <span>System Initialization</span>
             </div>
             <div className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                SEQ: 0{step} / 04
             </div>
          </div>

          <div className="p-8 overflow-y-auto">
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-slide-in-down">
              <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">
                    Identity Config
                  </h1>
                  <p className="text-xs font-mono text-slate-500">
                    // ENTER PRIMARY USER DETAILS
                  </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Subject Name
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="e.g. ALEX"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                            Gender
                        </label>
                        <div className="relative">
                            <select 
                                value={gender} 
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border-2 border-slate-200 p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none"
                            >
                                <option value="Prefer not to say">PREFER NOT TO SAY</option>
                                <option value="Male">MALE</option>
                                <option value="Female">FEMALE</option>
                                <option value="Non-binary">NON-BINARY</option>
                                <option value="Other">OTHER</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ArrowRight size={14} className="rotate-90" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                            Personality
                        </label>
                        <input 
                            type="text" 
                            value={personality} 
                            onChange={(e) => setPersonality(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none placeholder:text-slate-300"
                            placeholder="e.g. INFJ, OUTGOING"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Personal Description
                    </label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none placeholder:text-slate-300 min-h-[80px]"
                        placeholder="Briefly describe yourself..."
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Interests
                    </label>
                    <input 
                        type="text" 
                        value={interests} 
                        onChange={(e) => setInterests(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors rounded-none placeholder:text-slate-300"
                        placeholder="Cooking, Hiking, Sci-Fi (Comma separated)"
                    />
                </div>
                
                <div className="pt-4">
                    <button 
                    onClick={() => setStep(2)}
                    disabled={!name}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-widest py-4 flex items-center justify-center gap-2 transition-all shadow-lg active:translate-y-0.5 active:shadow-none"
                    >
                    Initialize Setup <ArrowRight size={16} />
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Add Loved Ones */}
          {step === 2 && (
            <div className="space-y-6 animate-slide-in-down">
              <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">
                        Team Roster
                    </h1>
                    <p className="text-xs font-mono text-slate-500">
                        // ASSIGN RELATIONSHIP NODES
                    </p>
                  </div>
                  <Users size={32} className="text-slate-200" />
              </div>

              {/* List */}
              <div className="space-y-2 border-2 border-slate-100 bg-slate-50 p-2 min-h-[120px] max-h-48 overflow-y-auto">
                {lovedOnes.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                      <span className="text-[10px] font-mono uppercase">No personnel assigned</span>
                   </div>
                )}
                {lovedOnes.map(person => (
                  <div key={person.id} className="flex items-center justify-between bg-white p-2 border border-slate-200 shadow-sm group">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center text-xs font-bold border border-slate-900">
                         {person.name.charAt(0)}
                       </div>
                       <div>
                         <p className="font-bold text-xs uppercase text-slate-900 leading-none">{person.name}</p>
                         <p className="text-[10px] font-mono text-slate-500 uppercase">{person.relationship}</p>
                       </div>
                    </div>
                    <button onClick={() => removeLovedOne(person.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                       <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="bg-slate-100 p-3 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="NAME"
                        className="col-span-3 bg-white border border-slate-300 p-2 text-xs font-bold uppercase placeholder:text-slate-300 focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && addLovedOne()}
                      />
                      <select
                        value={newRel}
                        onChange={(e) => setNewRel(e.target.value)}
                        className="col-span-2 bg-white border border-slate-300 p-2 text-[10px] font-bold uppercase focus:outline-none focus:border-indigo-500"
                      >
                         <option value="Partner">Partner</option>
                         <option value="Spouse">Spouse</option>
                         <option value="Child">Child</option>
                         <option value="Parent">Parent</option>
                         <option value="Friend">Friend</option>
                         <option value="Sibling">Sibling</option>
                         <option value="Colleague">Colleague</option>
                      </select>
                  </div>
                  <button 
                    onClick={addLovedOne}
                    disabled={!newName}
                    className="w-full bg-white border-2 border-slate-900 hover:bg-slate-50 disabled:opacity-50 text-slate-900 text-[10px] font-bold uppercase tracking-widest py-2 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={12} /> Add Entry
                  </button>
              </div>

              <button 
                  onClick={() => setStep(3)}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-widest py-4 flex items-center justify-center gap-2 transition-all shadow-lg active:translate-y-0.5 active:shadow-none"
                >
                  Proceed <ArrowRight size={16} />
                </button>
            </div>
          )}

          {/* STEP 3: Voice Print */}
          {step === 3 && (
            <div className="space-y-6 animate-slide-in-down text-center">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">
                    Biometric Sync
                </h1>
                <p className="text-xs font-mono text-slate-500">
                    // OPTIONAL: REQ. FOR LIVE COACHING
                </p>
              </div>
              
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 p-6 relative overflow-hidden group">
                 <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400">REF: SCRIPT-01</div>
                 <p className="font-serif italic text-lg text-slate-800 leading-relaxed relative z-10">
                    "Communication is the bridge between confusion and clarity. My voice is my identity."
                 </p>
                 <div className="absolute bottom-2 right-2 text-slate-200">
                    <MessageCircle size={40} strokeWidth={1} />
                 </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                {isRecording ? (
                    <div className="w-full space-y-2">
                        <div className="h-12 bg-slate-900 relative overflow-hidden flex items-center justify-center border-2 border-slate-900">
                            <span className="relative z-10 text-white text-xs font-mono font-bold uppercase tracking-widest animate-pulse">Recording...</span>
                            <div 
                                className="absolute left-0 top-0 bottom-0 bg-indigo-600 transition-all duration-75 ease-linear opacity-50"
                                style={{ width: `${recordingProgress}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">READ THE QUOTE ABOVE</p>
                    </div>
                ) : (
                    <button 
                        onClick={handleVoicePrint}
                        className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-50 border-4 border-slate-100 shadow-[0_0_0_4px_#e11d48] flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
                    >
                        <Mic size={32} />
                    </button>
                )}
              </div>
              
              {!isRecording && (
                <>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        Tap to begin voice calibration
                    </p>

                    <div className="bg-indigo-50 border border-indigo-100 p-3 text-left flex items-start gap-2 mt-4">
                        <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-indigo-900 font-medium leading-relaxed">
                            <strong>NOTE:</strong> Your voice data is processed to help the AI distinguish you from your partner during live coaching sessions.
                        </p>
                    </div>

                    <button 
                        onClick={handleSkipVoice}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest border-b border-transparent hover:border-slate-400 transition-all pb-0.5"
                    >
                        Skip Calibration &gt;&gt;
                    </button>
                </>
              )}
            </div>
          )}

          {/* STEP 4: Complete */}
          {step === 4 && (
            <div className="space-y-8 animate-slide-in-down text-center py-4">
               <div className="w-24 h-24 bg-emerald-50 text-emerald-600 border-4 border-emerald-100 rounded-full mx-auto flex items-center justify-center mb-4 relative">
                 <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-ping opacity-20"></div>
                 <Check size={48} strokeWidth={3} />
               </div>
               
               <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                    System Ready
                </h1>
                <p className="text-xs font-mono text-slate-500 max-w-[200px] mx-auto uppercase">
                    // PROFILE CONFIGURED<br/>
                    // BIOMETRICS: {voiceRecorded ? 'SECURED' : 'BYPASSED'}<br/>
                    // DASHBOARD UNLOCKED
                </p>
               </div>

               <div className="pt-4">
                <button 
                    onClick={handleFinish}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-widest py-4 flex items-center justify-center gap-2 transition-all shadow-lg active:translate-y-0.5 active:shadow-none"
                    >
                    Enter Dashboard <ArrowRight size={16} />
                </button>
               </div>
            </div>
          )}

          </div>
       </div>

       {/* Footer Branding */}
       <div className="absolute bottom-6 flex flex-col items-center gap-1 opacity-50">
           <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
               <ShieldCheck size={12} />
               <span>Secure Relational Operating System</span>
           </div>
           <div className="text-[8px] font-mono text-slate-300">v1.0.4-beta</div>
       </div>
    </div>
  );
};

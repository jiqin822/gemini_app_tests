import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../types';
import { Mic, MicOff, Activity, Bluetooth, Watch, Radio, X } from 'lucide-react';
import { connectLiveCoach } from '../services/geminiService';

interface Props {
  user: UserProfile;
  onExit: () => void;
}

export const LiveCoachMode: React.FC<Props> = ({ user, onExit }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'active'>('disconnected');
  const [nudge, setNudge] = useState<string | null>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  
  // Live API Connection Ref
  const liveSessionRef = useRef<{ sendAudio: (d: Float32Array) => void; disconnect: () => void } | null>(null);

  // Canvas Ref for Visualizer
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startSession = async () => {
    setStatus('connecting');
    try {
      // Input Audio Setup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;
      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Output Audio Setup
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputCtx;
      let nextStartTime = 0;

      // Connect to Gemini
      const session = await connectLiveCoach({
        onOpen: () => {
          setStatus('active');
          setIsActive(true);
        },
        onClose: () => {
          setStatus('disconnected');
          setIsActive(false);
        },
        onError: (err) => {
          console.error(err);
          setStatus('disconnected');
        },
        onNudge: (text) => {
          setNudge(text);
          // Auto clear nudge after 5 seconds
          setTimeout(() => setNudge(null), 5000);
        },
        onAudioData: (buffer) => {
          // Play audio response from Gemini
          if (!outputAudioContextRef.current) return;
          const ctx = outputAudioContextRef.current;
          
          if (ctx.state === 'closed') return;

          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.connect(ctx.destination);
          
          const currentTime = ctx.currentTime;
          if (nextStartTime < currentTime) {
            nextStartTime = currentTime;
          }
          src.start(nextStartTime);
          nextStartTime += buffer.duration;
        }
      });
      
      liveSessionRef.current = session;

      // Send Input Audio Loop
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        session.sendAudio(inputData);
        drawVisualizer(inputData);
      };

      source.connect(processor);
      processor.connect(inputCtx.destination); 

    } catch (err) {
      console.error("Failed to start session", err);
      setStatus('disconnected');
      alert("Could not access microphone or connect to AI service.");
    }
  };

  const stopSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
      liveSessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
    
    if (outputAudioContextRef.current) {
       if (outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close().catch(console.error);
       }
       outputAudioContextRef.current = null;
    }

    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
    
    setIsActive(false);
    setStatus('disconnected');
  };

  const drawVisualizer = (data: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22d3ee'; // Cyan 400
    ctx.beginPath();

    const sliceWidth = canvas.width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i += 10) { 
      const v = data[i] * 50; 
      const y = (canvas.height / 2) + v;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth * 10;
    }

    ctx.stroke();
  };
  
  useEffect(() => {
    return () => stopSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white relative overflow-hidden font-mono">
      {/* Dark Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
            style={{ 
                backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
            }}>
      </div>
      
      {/* Radial Gradient for Radar effect */}
      <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent to-slate-950 opacity-80 pointer-events-none"></div>

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <Radio className={isActive ? "animate-pulse" : ""} size={16} />
                <span className="text-[10px] tracking-widest uppercase font-bold">Signal: {status === 'active' ? 'LOCKED' : 'WAITING'}</span>
            </div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100">Dialogue Deck</h1>
        </div>
        <button onClick={onExit} className="border border-slate-700 hover:border-white text-slate-400 hover:text-white px-3 py-1 text-xs uppercase tracking-widest transition-colors">
          Abort
        </button>
      </div>

      {/* Main Wearable UI */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        {/* Nudge Overlay */}
        {nudge && (
          <div className="absolute top-24 left-6 right-6 z-20 animate-slide-in-down">
            <div className="bg-slate-900 border-2 border-cyan-500 p-4 shadow-[0_0_20px_rgba(34,211,238,0.2)] relative">
              <div className="absolute top-0 left-0 w-2 h-2 bg-cyan-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyan-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyan-500"></div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-950 border border-cyan-800 text-cyan-400 mt-1">
                   <Watch size={18} />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Tactical Nudge</h3>
                  <p className="text-lg leading-snug font-bold text-white uppercase">{nudge}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center Pulse Visual */}
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Crosshairs */}
            <div className="absolute inset-0 border border-slate-800 rounded-full"></div>
            <div className="absolute w-full h-[1px] bg-slate-800"></div>
            <div className="absolute h-full w-[1px] bg-slate-800"></div>
            
            {isActive && (
                <>
                    <div className="absolute w-full h-full rounded-full border border-cyan-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute w-48 h-48 rounded-full border border-cyan-500/50 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}></div>
                </>
            )}
            
            <div className="relative z-10 w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center border-2 border-cyan-900 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                 {!isActive ? (
                     <button onClick={startSession} className="flex flex-col items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors group">
                         <Mic size={32} className="group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Init</span>
                     </button>
                 ) : (
                    <button onClick={stopSession} className="flex flex-col items-center gap-2 text-cyan-500 hover:text-cyan-200 transition-colors">
                        <div className="relative">
                            <MicOff size={32} />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                            </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Cut</span>
                    </button>
                 )}
            </div>
        </div>

        {/* Canvas Visualizer at bottom */}
        <div className="absolute bottom-12 left-0 w-full h-32 opacity-80 pointer-events-none border-t border-slate-800 bg-slate-950/50">
            <div className="absolute top-2 left-2 text-[9px] text-cyan-700 uppercase">Audio Spectrum</div>
            <canvas ref={canvasRef} width={window.innerWidth} height={128} className="w-full h-full" />
        </div>

      </div>

      {/* Footer Status */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest z-10">
          <div className="flex items-center gap-2">
              <Bluetooth size={12} className={isActive ? "text-blue-500" : ""} />
              <span>Peripheral: Apple Watch Ultra</span>
          </div>
          <span>Mode: Conflict Res.</span>
      </div>
    </div>
  );
};
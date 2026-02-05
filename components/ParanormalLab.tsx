
import React, { useEffect, useState } from 'react';
import { ParanormalAnalysis } from '../types';

interface ParanormalLabProps {
  analysis?: ParanormalAnalysis;
  onClose: () => void;
}

const ParanormalLab: React.FC<ParanormalLabProps> = ({ analysis, onClose }) => {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setFlicker(prev => !prev), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!analysis) return null;

  return (
    <div className="flex flex-col h-full cyber-glass bg-slate-950/90 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-sky-500/30 shadow-[0_0_50px_rgba(56,189,248,0.1)] animate-in fade-in zoom-in-95">
      {/* Device Header */}
      <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center relative">
            <div className={`w-2 h-2 rounded-full absolute -top-1 -right-1 ${flicker ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900'}`}></div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-sky-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-black text-lg md:text-xl uppercase tracking-tighter">Field Analyzer</h2>
            <p className="text-[8px] md:text-[10px] text-sky-400 font-bold uppercase tracking-[0.2em]">Chinki Paranormal Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
        {/* Main Meters */}
        <div className="grid grid-cols-2 gap-4">
          {/* EMF Meter */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col items-center">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2">EMF Level (mG)</span>
            <div className="text-2xl font-black text-sky-400 font-mono">{analysis.emfLevel.toFixed(1)}</div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${analysis.emfLevel > 50 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-sky-500'}`} 
                style={{ width: `${Math.min(100, (analysis.emfLevel/100)*100)}%` }}
              ></div>
            </div>
          </div>

          {/* Temp Meter */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col items-center">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2">Ambient Temp</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">{analysis.tempCelsius.toFixed(1)}°C</div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-emerald-500" style={{ width: `${(analysis.tempCelsius/50)*100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Audio/Motion Status */}
        <div className="flex gap-4">
           <div className="flex-1 flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Audio Level</span>
              <span className="text-xs font-black text-white">{analysis.soundDb} dB</span>
           </div>
           <div className="flex-1 flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Motion</span>
              <span className={`text-[9px] font-black uppercase ${analysis.motionDetected ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                {analysis.motionDetected ? 'ACTIVE' : 'IDLE'}
              </span>
           </div>
        </div>

        {/* Verdict Box */}
        <div className="space-y-4">
           <div className={`p-6 rounded-3xl border ${
              analysis.safetyStatus === 'Anomalous' ? 'bg-red-950/20 border-red-500/40' : 
              analysis.safetyStatus === 'Unusual' ? 'bg-yellow-900/10 border-yellow-500/40' : 
              'bg-emerald-950/20 border-emerald-500/40'
           }`}>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Analytical Verdict</span>
              <p className="text-sm text-slate-200 font-medium italic leading-relaxed">"{analysis.scientificVerdict}"</p>
           </div>

           <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Logical Explanations:</h4>
              <div className="space-y-2">
                {analysis.possibleSources.map((source, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                    <span className="text-[10px] text-slate-400 font-bold">{source}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 bg-slate-900/80 border-t border-slate-800 text-center">
        <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.4em]">Environmental Logic Grid Engaged</p>
      </div>
    </div>
  );
};

export default ParanormalLab;

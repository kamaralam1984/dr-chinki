
import React from 'react';
import { YoutubeAnalysis } from '../types';

interface YoutubeAnalysisPanelProps {
  analysis: YoutubeAnalysis;
  onClose: () => void;
}

const YoutubeAnalysisPanel: React.FC<YoutubeAnalysisPanelProps> = ({ analysis, onClose }) => {
  return (
    <div className="fixed md:absolute inset-x-0 bottom-0 md:inset-auto md:right-10 md:bottom-10 w-full md:w-[400px] cyber-glass bg-slate-950/95 md:bg-slate-950/90 rounded-t-[2.5rem] md:rounded-[2.5rem] border-sky-500/40 p-6 md:p-8 shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right-4 z-[60] max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div>
          <span className="text-[8px] md:text-[10px] text-pink-500 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 block">Viral Intelligence</span>
          <h2 className="text-xl md:text-2xl font-black text-white glow-text uppercase leading-none">Video Analysis</h2>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* View Prediction */}
        <div className="bg-slate-900/60 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 flex flex-col items-center">
          <span className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 md:mb-2">Predicted Views</span>
          <div className="text-2xl md:text-4xl font-black text-emerald-400 font-mono tracking-tighter glow-text">
            {analysis.predictedViews}
          </div>
          <div className="w-full bg-slate-800 h-1 mt-3 md:mt-4 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '85%' }}></div>
          </div>
        </div>

        {/* Viral Index */}
        <div className="flex items-center justify-between gap-4">
           <div className="flex-1">
              <span className="text-[8px] md:text-[9px] text-sky-400 font-black uppercase tracking-widest block mb-1.5 md:mb-2">Viral Potential</span>
              <div className="h-2.5 md:h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-pink-500 transition-all duration-1000" 
                  style={{ width: `${analysis.viralIndex}%` }}
                ></div>
              </div>
           </div>
           <div className="text-xl md:text-2xl font-black text-white">{analysis.viralIndex}%</div>
        </div>

        {/* Hacks & Advice */}
        <div className="space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl md:rounded-2xl">
            <span className="text-[8px] md:text-[9px] text-sky-400 font-black uppercase tracking-widest mb-1 block">Winning Hook</span>
            <p className="text-[10px] md:text-xs text-sky-100 font-bold italic leading-relaxed">"{analysis.hookAdvice}"</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <span className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest block px-1">Power-ups:</span>
            {analysis.viralHacks.map((hack, i) => (
              <div key={i} className="flex items-center gap-2.5 md:gap-3 bg-slate-900/40 p-2.5 md:p-3 rounded-lg md:rounded-xl border border-slate-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                <span className="text-[10px] md:text-[11px] text-slate-300 font-bold">{hack}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl overflow-hidden border border-slate-700">
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] text-white font-black uppercase">Chinki's Verdict</p>
            <p className="text-[7px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">Kamar Alam Approved Strategy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeAnalysisPanel;

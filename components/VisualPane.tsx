import React, { useState } from 'react';
import { OrganType, OrganDetail } from '../types';
import { ORGAN_METADATA } from '../constants';

interface VisualPaneProps {
  model: OrganType;
  generatedImageUrl: string | null;
  onSelectPart: (part: OrganDetail | null) => void;
  selectedPart: OrganDetail | null;
  isImageEnabled?: boolean;
}

const VisualPane: React.FC<VisualPaneProps> = ({ 
  model, 
  generatedImageUrl, 
  onSelectPart, 
  selectedPart,
  isImageEnabled = true 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const maxZoom = 10;
  
  // Handle 2D list selection since 3D model is removed
  const parts = ORGAN_METADATA[model] || [];

  return (
    <div className="relative w-full h-full bg-slate-900/40 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-inner group">
      <div className="scanline"></div>
      
      {!isImageEnabled && !generatedImageUrl && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-600"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
          </div>
          <h3 className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">Imaging System Offline</h3>
          <p className="text-[10px] text-slate-700 mt-2 italic uppercase">Enable image display to view assets Boss Jaan.</p>
        </div>
      )}

      {/* HUD - Metadata */}
      <div className="absolute top-4 left-4 md:top-10 md:left-10 z-10 pointer-events-none select-none">
        <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="w-1 h-8 md:w-1.5 md:h-12 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>
            <div>
                <h2 className="text-sm md:text-2xl font-black text-white tracking-tight glow-text uppercase">VISUAL_LAB_v3 (2D MODE)</h2>
                <div className="flex items-center gap-1 md:gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isImageEnabled ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <p className="text-[7px] md:text-[10px] text-sky-400 font-bold opacity-80 uppercase tracking-widest">{isImageEnabled ? '2D Projection Active' : 'System Halted'}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Zoom Stats */}
      <div className="absolute top-4 right-4 md:top-10 md:right-10 z-10">
        <div className="cyber-glass bg-slate-900/90 px-4 py-3 md:px-8 md:py-6 rounded-xl md:rounded-[2rem] border-slate-800 flex flex-col items-center shadow-2xl transition-all hover:border-sky-500/40">
            <span className="hidden md:block text-[10px] text-sky-400 font-black tracking-[0.2em] uppercase mb-4">Zoom Depth</span>
            <div className="hidden md:flex items-end gap-1.5 h-16 mb-2">
                {[...Array(8)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1.5 rounded-full transition-all duration-300 ${i < Math.ceil(zoomLevel) ? 'bg-sky-500 glow-cyan' : 'bg-slate-800'}`}
                        style={{ height: `${20 + (i * 10)}%` }}
                    ></div>
                ))}
            </div>
            <div className="flex flex-col items-center">
                <span className="text-xl md:text-4xl font-black text-white tracking-tighter glow-text">{zoomLevel}x</span>
                <span className="text-[7px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">Magnify</span>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3 md:gap-6 cyber-glass bg-slate-900/95 p-2 md:p-3 rounded-[1.5rem] md:rounded-[2rem] border-slate-700 shadow-2xl scale-90 md:scale-100">
         <button 
            onClick={() => {
                setZoomLevel(prev => Math.max(1, prev - 1));
            }} 
            className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-white hover:text-sky-400 hover:bg-slate-800 rounded-xl md:rounded-2xl transition-all active:scale-90"
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
         </button>
         <div className="hidden md:flex flex-col justify-center items-center px-6 border-x border-slate-800 min-w-[160px]">
             <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden mb-2 shadow-inner">
                 <div className="h-full bg-sky-500 glow-cyan transition-all duration-500" style={{ width: `${(zoomLevel / maxZoom) * 100}%` }}></div>
             </div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Level 0{zoomLevel}_Neural</span>
         </div>
         <button 
            onClick={() => setZoomLevel(prev => Math.min(maxZoom, prev + 1))} 
            className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-white hover:text-sky-400 hover:bg-slate-800 rounded-xl md:rounded-2xl transition-all active:scale-90"
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
         </button>
      </div>

      {/* Main Content Area - Replaces Canvas */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900/0 to-slate-900/50">
          {generatedImageUrl ? (
             <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <img 
                    src={generatedImageUrl} 
                    className="max-w-none transition-all duration-500 object-contain"
                    style={{ 
                        transform: `scale(${1 + (zoomLevel - 1) * 0.5})`,
                        maxHeight: '80%',
                        maxWidth: '80%'
                    }}
                    alt="Medical Analysis"
                />
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-950/80 rounded-full border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-widest">
                    AI Generated Visualization
                </div>
             </div>
          ) : model && model !== 'none' ? (
             <div className="flex flex-col items-center">
                 <div className="w-40 h-40 md:w-60 md:h-60 rounded-full border-4 border-slate-800 border-t-sky-500 animate-[spin_10s_linear_infinite] flex items-center justify-center mb-6 relative">
                     <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-b-sky-500/50 animate-[spin_15s_linear_infinite_reverse] scale-90"></div>
                     <span className="text-4xl md:text-6xl">🧬</span>
                 </div>
                 <h2 className="text-2xl md:text-4xl font-black text-white glow-text uppercase mb-2">{ORGAN_METADATA[model]?.[0]?.name || model}</h2>
                 <p className="text-xs text-sky-400 uppercase tracking-widest font-bold">3D Engine Offline • Data View Only</p>
                 
                 {/* Organ Parts List since we can't click 3D model */}
                 <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {parts.map((part) => (
                        <button 
                            key={part.id}
                            onClick={() => onSelectPart(part)}
                            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedPart?.id === part.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-sky-500/50 hover:text-sky-400'}`}
                        >
                            {part.name}
                        </button>
                    ))}
                 </div>
             </div>
          ) : (
             <div className="flex flex-col items-center opacity-40">
                <div className="w-20 h-20 border-2 border-slate-700 rounded-full flex items-center justify-center mb-4">
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-ping"></div>
                </div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Awaiting Visual Input</p>
             </div>
          )}
      </div>

      {/* Selected Part Details Overlay */}
      {selectedPart && (
         <div className="absolute top-1/2 right-10 -translate-y-1/2 w-64 bg-slate-950/90 border border-sky-500/30 p-6 rounded-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-4 z-20">
             <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-black text-white uppercase leading-none">{selectedPart.name}</h3>
                <button onClick={() => onSelectPart(null)} className="text-slate-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <div className="space-y-4">
                 <div>
                    <span className="text-[8px] font-black text-sky-500 uppercase tracking-widest block mb-1">Function</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedPart.function}</p>
                 </div>
                 <div>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block mb-1">NEET Fact</span>
                    <p className="text-xs text-emerald-100 leading-relaxed font-bold italic">"{selectedPart.neetFact}"</p>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default VisualPane;

import React, { useState, useEffect } from 'react';
import { BusinessAnalysis } from '../types';

interface BusinessGrowthLabProps {
  analysis?: BusinessAnalysis;
  onClose: () => void;
  onStartAnalysis: (url: string) => void;
  isAnalyzing: boolean;
}

const BusinessGrowthLab: React.FC<BusinessGrowthLabProps> = ({ analysis, onClose, onStartAnalysis, isAnalyzing }) => {
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'leads' | 'outreach' | 'strategy'>('strategy');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput) onStartAnalysis(urlInput);
  };

  return (
    <div className="flex flex-col h-full cyber-glass bg-slate-950/90 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-right-10">
      <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center glow-cyan">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
          </div>
          <div>
            <h2 className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter">Growth Oracle</h2>
            <p className="text-[8px] md:text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em]">Neural Lead & Marketing Engine</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {!analysis && !isAnalyzing ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-8">
           <div className="w-20 h-20 bg-emerald-500/5 rounded-full border border-emerald-500/10 flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-emerald-500/30"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>
           </div>
           <div className="max-w-xs">
              <h3 className="text-white font-black text-lg uppercase mb-2">Initialize Scraper</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                Boss Jaan, website ka link dein. Dr. Chinki leads nikalegi aur khud phone (+91 7039125391) aur mail (8rupiya@gmail.com) karegi.
              </p>
           </div>
           <form onSubmit={handleSubmit} className="w-full max-w-sm relative">
              <input 
                type="url" 
                value={urlInput} 
                onChange={(e) => setUrlInput(e.target.value)} 
                placeholder="https://company-website.com" 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm"
              />
              <button type="submit" className="absolute right-2 top-2 bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </button>
           </form>
        </div>
      ) : isAnalyzing ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="relative w-40 h-40 mb-10">
               <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
               <div className="absolute inset-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-emerald-500 font-black text-xl animate-pulse">HUB</span>
               </div>
            </div>
            <h3 className="text-xl font-black text-white glow-text mb-4 uppercase">Neural Scraping Active</h3>
            <div className="space-y-3 w-full max-w-xs">
               <div className="flex justify-between text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                  <span>Logic Mapping</span>
                  <span>92%</span>
               </div>
               <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '92%' }}></div>
               </div>
               <p className="text-[9px] text-slate-500 italic">"Boss Jaan, Chinki market research kar rahi hai..."</p>
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
           {/* Summary Header */}
           <div className="px-8 py-6 bg-emerald-500/5 border-b border-emerald-500/10">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-black text-white glow-text uppercase leading-none mb-2">{analysis?.companyName}</h3>
                    <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/30">
                       {analysis?.marketNiche}
                    </span>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Growth Engine</p>
                    <p className="text-xl font-black text-emerald-400">SCALE_ENABLED</p>
                 </div>
              </div>
           </div>

           {/* Tabs */}
           <div className="flex px-4 pt-4 border-b border-slate-800">
              {(['strategy', 'leads', 'outreach'] as const).map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                >
                  {tab}
                </button>
              ))}
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'strategy' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                   <div className="p-6 bg-slate-900/60 rounded-3xl border border-slate-800">
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Market Edge (USP)</span>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">"{analysis?.usp}"</p>
                   </div>
                   <div className="p-6 bg-emerald-950/20 rounded-3xl border border-emerald-500/20">
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Growth Blueprint</span>
                      <p className="text-sm text-emerald-100 italic leading-relaxed">{analysis?.growthStrategy}</p>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Key Competitors Detected:</span>
                      {analysis?.competitors.map((comp, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-slate-800">
                           <span className="text-xs text-white font-bold">{comp}</span>
                           <span className="text-[8px] text-red-500 font-black uppercase tracking-widest">Outrank Strategy Set</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'leads' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex justify-between items-center px-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Scraper Pipeline</h4>
                      <span className="text-[9px] text-emerald-400 font-black">{analysis?.potentialLeads.length} Targets</span>
                   </div>
                   <div className="space-y-3">
                      {analysis?.potentialLeads.map((lead, i) => (
                        <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">🏢</div>
                              <div>
                                 <p className="text-xs font-black text-white">{lead.name}</p>
                                 <p className="text-[8px] text-slate-500 font-bold uppercase">{lead.platform} • {lead.source}</p>
                              </div>
                           </div>
                           <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                              lead.contactStatus === 'Agreed' ? 'bg-emerald-500 text-slate-950' : 
                              lead.contactStatus === 'Calling' ? 'bg-sky-500 text-white animate-pulse' :
                              'bg-slate-800 text-slate-400'
                           }`}>
                              {lead.contactStatus}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'outreach' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-slate-900/80 rounded-3xl border border-sky-500/30 shadow-xl">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">📞</div>
                            <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Neural Calling</span>
                         </div>
                         <p className="text-xl font-black text-white mb-1">+91 7039125391</p>
                         <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Python Voice Stream Engaged</p>
                      </div>
                      <div className="p-6 bg-slate-900/80 rounded-3xl border border-emerald-500/30 shadow-xl">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">📧</div>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Quantum Mail</span>
                         </div>
                         <p className="text-sm font-black text-white mb-1">8rupiya@gmail.com</p>
                         <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Automated Marketing Script</p>
                      </div>
                   </div>

                   <div className="p-6 bg-slate-900/60 rounded-3xl border border-slate-800">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Recent Actions Log:</h4>
                      <div className="space-y-4">
                         <div className="flex items-start gap-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1"></div>
                            <div>
                               <p className="text-[10px] text-white font-bold uppercase">Success: Meeting Booked with Lead #3</p>
                               <p className="text-[8px] text-slate-500 mt-1 uppercase">Email Confirmation sent to Boss Jaan (Kamar Alam)</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-4">
                            <div className="w-2 h-2 rounded-full bg-sky-500 mt-1"></div>
                            <div>
                               <p className="text-[10px] text-white font-bold uppercase">Call initiated to Lead #12</p>
                               <p className="text-[8px] text-slate-500 mt-1 uppercase">Status: Customer convinced, awaiting doc upload</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>

           <div className="p-6 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100" className="w-full h-full object-cover" />
                 </div>
                 <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">System Monitoring: Kamar Alam Approvals Only</p>
              </div>
              <button 
                className="px-6 py-2 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all glow-cyan"
                onClick={() => alert("Post Scheduled on LinkedIn & Meta Boss Jaan!")}
              >
                Schedule Social Posts
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default BusinessGrowthLab;

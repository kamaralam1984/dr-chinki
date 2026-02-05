import React, { useEffect, useState } from 'react';
import { getMemories } from '../services/memoryService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionMessageCount: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, sessionMessageCount }) => {
  const [memoryCount, setMemoryCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await getMemories();
        if (res.success) {
          setMemoryCount(res.count);
        } else {
          setMemoryCount(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[155] flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-xl p-4">
      <div className="w-full max-w-3xl cyber-glass bg-slate-950/95 rounded-t-[2.5rem] md:rounded-[2.5rem] border-emerald-500/30 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5M4.5 8.25h15M6 12h12M8.25 15.75h7.5M10.5 19.5h3" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-black text-base md:text-lg uppercase tracking-tight glow-text">
                Admin Control Deck
              </h2>
              <p className="text-[8px] md:text-[9px] text-emerald-400/80 font-black uppercase tracking-[0.3em]">
                Session & Memory Analytics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900/70 border border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">
              Current Chat Messages
            </span>
            <span className="text-2xl font-black text-white">{sessionMessageCount}</span>
            <p className="text-[9px] text-slate-500">
              Iss browser session me total messages ka quick snapshot.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">
              Saved Memories (DB)
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {isLoading ? '...' : memoryCount ?? '—'}
            </span>
            <p className="text-[9px] text-slate-500">
              Python backend se direct count fetch kiya gaya.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">
              Quick Notes
            </span>
            <p className="text-[9px] text-slate-400">
              Admin yahan se daily usage ko monitor karke improvements decide kar sakta hai.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
              Recommended Admin Flows
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-400">
              <li>Memory Vault se purani, irrelevant memories clean rakho.</li>
              <li>Business Growth Lab ko sirf verified client URLs ke saath use karo.</li>
              <li>LiveTutor sessions record karne se pehle user consent le lena.</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 text-[8px] text-slate-600 font-black uppercase tracking-[0.3em] text-center">
          Admin Panel • Dr. Chinki Ops Monitoring
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;


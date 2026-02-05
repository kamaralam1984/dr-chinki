import React, { useEffect, useState } from 'react';
import { getMemories, deleteMemory, Memory } from '../services/memoryService';

interface MemoriesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MemoriesPanel: React.FC<MemoriesPanelProps> = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getMemories();
        if (res.success) {
          setMemories(res.memories || []);
        } else {
          setError('Memories load nahi ho paayi Boss Jaan.');
        }
      } catch (e) {
        console.error(e);
        setError('Server se connect nahi ho paayi. Memory backend check karein.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isOpen]);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      await deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error(e);
      setError('Ye memory delete karne me dikkat aa gayi.');
    }
  };

  const handleClearAll = async () => {
    if (!memories.length) return;
    const confirmClear = window.confirm('Boss Jaan, kya aap sure hain? Saari memories delete ho jayengi.');
    if (!confirmClear) return;

    setIsClearing(true);
    setError(null);
    try {
      // Best-effort clear – errors per item ko ignore karke aage badhenge
      for (const mem of memories) {
        if (mem.id) {
          try {
            await deleteMemory(mem.id);
          } catch (e) {
            console.error('Failed to delete memory', mem.id, e);
          }
        }
      }
      setMemories([]);
    } catch (e) {
      console.error(e);
      setError('Saari memories clear karne me problem aa gayi.');
    } finally {
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-xl cyber-glass bg-slate-900/95 rounded-[2.5rem] border-sky-500/30 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-sky-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3v9.75a2.25 2.25 0 0 1-2.25 2.25H7.5A2.25 2.25 0 0 1 5.25 18V8.25a3 3 0 0 1 3-3h7.5Zm0 0V3.75A2.25 2.25 0 0 0 13.5 1.5h-3a2.25 2.25 0 0 0-2.25 2.25v1.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-black text-base md:text-lg uppercase tracking-tight glow-text">
                Memory Vault
              </h2>
              <p className="text-[8px] md:text-[9px] text-sky-400/70 font-black uppercase tracking-[0.25em]">
                Saved Moments of Boss Jaan
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

        <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.25em]">
            {isLoading ? 'Loading memories...' : `Total: ${memories.length}`}
          </p>
          <button
            onClick={handleClearAll}
            disabled={!memories.length || isClearing}
            className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border transition-all disabled:opacity-40 disabled:cursor-not-allowed
              border-red-500/40 text-red-300 hover:bg-red-600/10"
          >
            Clear All
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-900/30 text-[10px] text-red-200 border-b border-red-500/40">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading && (
            <div className="w-full flex items-center justify-center py-8 text-[9px] text-sky-400 font-black uppercase tracking-[0.3em] animate-pulse">
              Neural archive scan in progress...
            </div>
          )}

          {!isLoading && memories.length === 0 && !error && (
            <div className="w-full flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                <span className="text-xl">🧠</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em]">
                Abhi tak koi memory save nahi hui
              </p>
              <p className="text-[9px] text-slate-500">
                LiveTutor se &quot;remember this&quot; ya &quot;meri awaaz yaad rakho&quot; bolkar memories bana sakte hain.
              </p>
            </div>
          )}

          {memories.map((m) => (
            <div
              key={m.id || `${m.name}-${m.timestamp}`}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3"
            >
              <div className="mt-1">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[11px] font-semibold text-white truncate">
                    {m.name}
                  </p>
                  <span className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">
                    {m.type.toUpperCase()}
                  </span>
                </div>
                {m.content && (
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {m.content}
                  </p>
                )}
                {m.timestamp && (
                  <p className="text-[8px] text-slate-500 mt-1">
                    {new Date(m.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="ml-1 p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-500 hover:text-red-300 hover:border-red-400 transition-all"
                title="Delete memory"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12M9.75 7.5v10.125M14.25 7.5v10.125M10.125 4.5h3.75A1.125 1.125 0 0 1 15 5.625V7.5H9V5.625A1.125 1.125 0 0 1 10.125 4.5Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 text-[8px] text-slate-600 font-black uppercase tracking-[0.35em] text-center">
          Dr. Chinki Secure Memory System • Local Device Only
        </div>
      </div>
    </div>
  );
};

export default MemoriesPanel;


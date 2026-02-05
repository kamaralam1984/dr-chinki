
import React, { useState, useRef } from 'react';
import { generateVeoVideo } from '../services/geminiService';

interface CreativeLabProps {
  onClose: () => void;
}

const CreativeLab: React.FC<CreativeLabProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedImage) return;
    setIsGenerating(true);
    setVideoUrl(null);
    
    const base64Image = selectedImage ? selectedImage.split(',')[1] : undefined;
    const url = await generateVeoVideo(prompt, aspectRatio, base64Image);
    
    setVideoUrl(url);
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-full cyber-glass bg-slate-950/90 rounded-[2rem] overflow-hidden border-purple-500/30 shadow-2xl animate-in fade-in slide-in-from-right-10">
      <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center glow-cyan">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
          </div>
          <div>
            <h2 className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter">Veo 3.1 Animator</h2>
            <p className="text-[8px] md:text-[10px] text-purple-400 font-bold uppercase tracking-[0.3em]">Image-to-Video Engine</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <div className="space-y-4">
          <div className="flex gap-4">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="flex-1 aspect-square md:aspect-video rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 transition-all bg-slate-900/40 overflow-hidden"
             >
               {selectedImage ? (
                 <img src={selectedImage} className="w-full h-full object-cover" />
               ) : (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-600 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                   <span className="text-[9px] font-black text-slate-600 uppercase">Upload Reference Image</span>
                 </>
               )}
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
             </div>
             {selectedImage && (
               <button onClick={() => setSelectedImage(null)} className="text-red-500 hover:text-red-400 font-black text-[10px] uppercase">Clear</button>
             )}
          </div>

          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Movement Description / Prompt:</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="How should this image move? e.g. 'The heart beats rhythmically as blood flows through valves'..."
            className="w-full h-24 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-200 text-sm focus:outline-none focus:border-purple-500 transition-all resize-none shadow-inner"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['16:9', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${aspectRatio === ratio ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || (!prompt.trim() && !selectedImage)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-full font-black text-[12px] uppercase shadow-lg glow-cyan disabled:opacity-50 transition-all active:scale-95"
            >
              {isGenerating ? 'Anatomizing...' : 'Animate with Veo'}
            </button>
          </div>
        </div>

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 gap-6 animate-pulse">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-purple-400 font-black uppercase text-[10px] tracking-[0.3em]">Chinki is rendering your vision...</p>
          </div>
        )}

        {videoUrl && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <video src={videoUrl} controls autoPlay className="w-full rounded-3xl border-2 border-purple-500/30 bg-black shadow-2xl" />
            <a href={videoUrl} download="Chinki_Animated.mp4" className="block text-center text-sky-400 text-[10px] font-black uppercase tracking-widest hover:underline">Save Video</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeLab;

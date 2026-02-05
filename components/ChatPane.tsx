
import React, { useState, useRef, useEffect } from 'react';
import { Message, StoryScene, StoryBoard, GroundingLink } from '../types';

interface AttachedFile {
  id: string;
  name: string;
  data: string;
  mimeType: string;
  isVideo?: boolean;
}

interface ChatPaneProps {
  messages: Message[];
  onSendMessage: (text: string, files?: { data: string, mimeType: string }[]) => void;
  isThinking: boolean;
  onStartLive: () => void;
}

const StoryboardSceneView: React.FC<{ scene: StoryScene, genreColor: string }> = ({ scene, genreColor }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [videoUrl] = useState<string | null>(scene.generatedVideoUrl || null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-4 md:space-y-5 animate-in fade-in slide-in-from-left-4 transition-all hover:border-slate-700">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
           <span className={`${genreColor} text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest`}>
            Scene {scene.sceneNumber}
          </span>
          {scene.title && <h4 className="text-[10px] text-white font-black uppercase truncate max-w-[150px]">{scene.title}</h4>}
        </div>
        <span className="text-[7px] md:text-[9px] text-slate-500 font-bold uppercase bg-slate-950 px-2 py-0.5 rounded-md">
          Est. {scene.estimatedDurationSeconds}s
        </span>
      </div>
      
      <div className="space-y-3">
        {videoUrl ? (
          <div className="rounded-xl overflow-hidden border border-sky-500/30 aspect-video bg-black">
            <video src={videoUrl} controls className="w-full h-full object-cover" />
          </div>
        ) : (
          <div>
            <span className="text-[7px] text-sky-400 font-black uppercase tracking-widest mb-1 block">Dialogue / Narration</span>
            <p className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed italic">"{scene.text}"</p>
          </div>
        )}
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
          <span className="text-[7px] text-emerald-400 font-black uppercase tracking-widest mb-1 block">Visual Action</span>
          <p className="text-[10px] text-slate-400 leading-tight">{scene.visualAction}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-800">
        <div className="group relative">
          <label className="text-[7px] md:text-[8px] text-sky-400 font-black uppercase tracking-widest block mb-1">Image Generation Prompt</label>
          <div className="text-[9px] md:text-[10px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-sky-500/50 transition-all break-words leading-snug" onClick={() => copyToClipboard(scene.imagePrompt, 'img')}>
            {scene.imagePrompt}
          </div>
          {copied === 'img' && <span className="absolute right-2 top-0 text-[7px] text-emerald-400 animate-bounce font-bold">COPIED!</span>}
        </div>

        <div className="group relative">
          <label className="text-[7px] md:text-[8px] text-purple-400 font-black uppercase tracking-widest block mb-1 flex justify-between items-center">
            <span>Video (Veo 3) Prompt</span>
          </label>
          <div className="text-[9px] md:text-[10px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500/50 transition-all break-words leading-snug" onClick={() => copyToClipboard(scene.videoPrompt, 'vid')}>
            {scene.videoPrompt}
          </div>
          {copied === 'vid' && <span className="absolute right-2 top-0 text-[7px] text-emerald-400 animate-bounce font-bold">COPIED!</span>}
        </div>
      </div>
    </div>
  );
};

const StoryboardView: React.FC<{ storyboard: StoryBoard }> = ({ storyboard }) => {
  const genreColors: Record<string, string> = {
    'Horror': 'bg-red-600',
    'Kids': 'bg-yellow-500',
    'Love': 'bg-pink-500',
    'Influencer': 'bg-purple-500',
    'Fact': 'bg-sky-500',
    'Medical': 'bg-emerald-500',
    'General': 'bg-slate-600'
  };

  const color = genreColors[storyboard.genre] || 'bg-sky-500';

  return (
    <div className="mt-6 md:mt-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-700">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-1 md:w-2 h-8 md:h-12 ${color} rounded-full`}></div>
          <div>
            <h3 className="text-sm md:text-xl font-black text-white glow-text uppercase leading-none">{storyboard.title}</h3>
            <div className="flex items-center gap-2 mt-2">
               <span className={`${color} text-[8px] font-black px-2 py-0.5 rounded-full text-white uppercase`}>{storyboard.genre}</span>
               <p className="text-[7px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Target: {storyboard.targetDurationMinutes}m | Actual: {Math.floor(storyboard.actualDurationSeconds / 60)}m {storyboard.actualDurationSeconds % 60}s
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 italic text-xs text-slate-400 leading-relaxed">
        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Director's Overview</span>
        {storyboard.scriptSummary}
      </div>

      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
        {storyboard.scenes.map((scene) => (
          <StoryboardSceneView key={scene.sceneNumber} scene={scene} genreColor={color} />
        ))}
      </div>
    </div>
  );
};

const ChatPane: React.FC<ChatPaneProps> = ({ messages, onSendMessage, isThinking, onStartLive }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInputText(prev => prev + ' ' + transcript);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const handleMicPress = () => { if (recognitionRef.current) { setIsRecording(true); recognitionRef.current.start(); } };
  const handleMicRelease = () => { if (recognitionRef.current) { recognitionRef.current.stop(); } };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: AttachedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const filePromise = new Promise<AttachedFile>((resolve) => {
          reader.onload = () => {
            const base64Data = (reader.result as string).split(',')[1];
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              data: base64Data,
              mimeType: file.type
            });
          };
          reader.readAsDataURL(file);
        });
        newFiles.push(await filePromise);
      }
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputText.trim() || attachedFiles.length > 0) && !isThinking) {
      const filePayload = attachedFiles.map(f => ({ data: f.data, mimeType: f.mimeType }));
      onSendMessage(inputText.trim(), filePayload.length > 0 ? filePayload : undefined);
      setInputText('');
      setAttachedFiles([]);
    }
  };

  return (
    <div className="flex flex-col h-full cyber-glass bg-slate-900/80 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-slate-800 shadow-2xl">
      <div className="p-4 md:p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 border-slate-800 ring-2 ring-sky-500/20 glow-cyan">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200" alt="Dr. Chinki" className="w-full h-full object-cover"/>
            </div>
            <div>
              <h1 className="font-extrabold text-sm md:text-lg text-white tracking-tight glow-text uppercase leading-none">Chinki</h1>
              <p className="text-[7px] md:text-[9px] text-sky-400 font-black tracking-widest uppercase mt-1">Master Scriptwriter Mode</p>
            </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[95%] md:max-w-[90%] p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg border ${msg.role === 'user' ? 'bg-sky-600 text-white border-sky-500 rounded-tr-none' : 'bg-slate-800 border-slate-700 text-slate-200 rounded-tl-none'}`}>
              <div className="text-xs md:text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block">Sources Found (Google Search):</span>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingLinks.map((link, idx) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-slate-950 px-2 py-1 rounded-md border border-slate-700 text-sky-400 hover:bg-slate-900 transition-all truncate max-w-[200px]">
                        {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {msg.storyBoard && <StoryboardView storyboard={msg.storyBoard} />}
            </div>
          </div>
        ))}
        {isThinking && <div className="animate-pulse text-sky-400 font-black uppercase text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em] p-2 md:p-4 text-center">Neural Logic Computing...</div>}
      </div>

      <div className="p-4 md:p-6 bg-slate-900/90 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="relative">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Genre aur duration boliye meri jaan..." className="w-full bg-slate-950 text-slate-100 pl-12 pr-20 md:pl-16 md:pr-24 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800 focus:outline-none focus:border-sky-500 transition-all text-xs md:text-sm font-semibold shadow-inner" />
          <div className="absolute left-2.5 md:left-4 top-1/2 -translate-y-1/2">
             <button type="button" onClick={() => fileInputRef.current?.click()} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-800 text-slate-400 hover:text-sky-400 transition-all"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32" /></svg></button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" multiple />
          </div>
          <div className="absolute right-2.5 md:right-4 top-1/2 -translate-y-1/2 flex gap-1.5 md:gap-2">
            <button type="button" onMouseDown={handleMicPress} onMouseUp={handleMicRelease} className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl md:rounded-2xl transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg></button>
            <button type="submit" disabled={isThinking} className="bg-sky-600 text-white w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-sky-500 disabled:bg-slate-800 shadow-lg glow-cyan transition-all"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPane;

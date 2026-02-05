import React, { useState, useCallback, useRef, useEffect } from 'react';
import ChatPane from './components/ChatPane';
import VisualPane from './components/VisualPane';
import LiveTutor from './components/LiveTutor';
import MemoriesPanel from './components/MemoriesPanel';
import MediaLab from './components/MediaLab';
import BusinessGrowthLab from './components/BusinessGrowthLab';
import { Message, OrganType, OrganDetail, YoutubeAnalysis, WebAnalysis, FaceAnalysis, TreatmentPlan, ParanormalAnalysis, DocumentAnalysis, BusinessAnalysis, AuthUser } from './types';
import { getTutorResponse, generateMedicalImage, transcribeAudio } from './services/geminiService';
import { INITIAL_GREETING } from './constants';
import { loadCurrentUser, login, signup, logout } from './services/authService';
import AdminPanel from './components/AdminPanel';
import SuperAdminPanel from './components/SuperAdminPanel';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: INITIAL_GREETING, timestamp: Date.now() }
  ]);
  const [currentModel, setCurrentModel] = useState<OrganType>('none');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedPart, setSelectedPart] = useState<OrganDetail | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isImageEnabled, setIsImageEnabled] = useState(true);
  const [isGrowthLabActive, setIsGrowthLabActive] = useState(false);
  const [isComplexMode, setIsComplexMode] = useState(false);
  const [awaitingCameraConfirmation, setAwaitingCameraConfirmation] = useState(false);
  const [requestCameraOnOpen, setRequestCameraOnOpen] = useState(false);
  const [activeLabTab, setActiveLabTab] = useState<'visual' | 'media'>('visual');
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSuperAdminPanelOpen, setIsSuperAdminPanelOpen] = useState(false);
  
  const [activeMediaData, setActiveMediaData] = useState<{
    youtube?: YoutubeAnalysis;
    web?: WebAnalysis;
    face?: FaceAnalysis;
    treatment?: TreatmentPlan;
    paranormal?: ParanormalAnalysis;
    document?: DocumentAnalysis;
    business?: BusinessAnalysis;
  } | null>(null);

  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const existing = loadCurrentUser();
    if (existing) {
      setCurrentUser(existing);
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAuthSubmitting) return;
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string) || '';
    const email = (formData.get('email') as string) || '';
    const password = (formData.get('password') as string) || '';
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      let user: AuthUser;
      if (authMode === 'login') {
        user = await login(email, password);
      } else {
        user = await signup(name, email, password);
      }
      setCurrentUser(user);
    } catch (err: any) {
      setAuthError(err?.message || 'Login/Signup me problem aa gayi.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setIsAdminPanelOpen(false);
    setIsSuperAdminPanelOpen(false);
  };

  const handleSendMessage = useCallback(async (text: string, files?: { data: string, mimeType: string }[], audioBase64?: string) => {
    let finalPrompt = text;
    
    if (audioBase64) {
      setIsThinking(true);
      const transcription = await transcribeAudio(audioBase64);
      if (transcription) finalPrompt = transcription;
    }

    if (awaitingCameraConfirmation && (finalPrompt.toLowerCase().includes('haan') || finalPrompt.toLowerCase().includes('yes'))) {
      setRequestCameraOnOpen(true);
      setIsLiveActive(true);
      setAwaitingCameraConfirmation(false);
      return;
    }

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: finalPrompt || (files ? `Analyzed ${files.length} attachments.` : ""), 
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setSelectedPart(null);

    try {
      const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
      const filePayload = files ? files.map(f => ({ inlineData: { data: f.data, mimeType: f.mimeType } })) : undefined;
      
      const response = await getTutorResponse(finalPrompt, history, filePayload, isComplexMode ? 'complex' : 'standard');

      if (!response) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: "Maafi chahti hoon Boss Jaan, system me thodi thakaan hai. Ek baar phir puchiye na!", 
          timestamp: Date.now() 
        }]);
        return;
      }
      
      if (response.cameraPermissionRequested) {
        setAwaitingCameraConfirmation(true);
      }

      const botMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: response.explanation, 
          timestamp: Date.now(),
          suggestedModel: response.suggestedModel as OrganType,
          groundingLinks: response.groundingLinks,
          youtubeAnalysis: response.youtubeAnalysis,
          webAnalysis: response.webAnalysis,
          faceAnalysis: response.faceAnalysis,
          treatmentPlan: response.treatmentPlan,
          paranormalAnalysis: response.paranormalAnalysis,
          documentAnalysis: response.documentAnalysis,
          businessAnalysis: response.businessAnalysis
      };

      setMessages(prev => [...prev, botMsg]);
      setGeneratedImageUrl(null);
      
      if (response.youtubeAnalysis || response.webAnalysis || response.faceAnalysis || response.treatmentPlan || response.paranormalAnalysis || response.documentAnalysis || response.businessAnalysis) {
        setActiveMediaData({
          youtube: response.youtubeAnalysis,
          web: response.webAnalysis,
          face: response.faceAnalysis,
          treatment: response.treatmentPlan,
          paranormal: response.paranormalAnalysis,
          document: response.documentAnalysis,
          business: response.businessAnalysis
        });
        setActiveLabTab('media');
      }

      if (isImageEnabled && response.imagePrompt && response.imagePrompt.trim() !== "") {
          setIsGeneratingImage(true);
          generateMedicalImage(response.imagePrompt).then(url => {
              if (url) {
                setGeneratedImageUrl(url);
                setActiveLabTab('visual');
              }
              setIsGeneratingImage(false);
          }).catch(() => setIsGeneratingImage(false));
      }

      if (response.suggestedModel && response.suggestedModel !== 'none') {
        setCurrentModel(response.suggestedModel as OrganType);
        setActiveLabTab('visual');
      }

      if (response.voiceOutput && isVoiceEnabled) {
          synthRef.current.cancel();
          const utterance = new SpeechSynthesisUtterance(response.voiceOutput);
          utterance.lang = 'hi-IN';
          utterance.rate = 1.0;
          synthRef.current.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "Kuch gadbad ho gayi Boss Jaan, lekin main yahin hoon. Dubara koshish karein?", 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [messages, isVoiceEnabled, isImageEnabled, isComplexMode, awaitingCameraConfirmation]);

  const handleStartGrowthAnalysis = (url: string) => {
    handleSendMessage(`Boss Jaan, Dr. Chinki is checking this business: ${url}. Leads nikal rahi hoon...`);
  };

  const shouldShowBusinessLab = isGrowthLabActive || !!activeMediaData?.business;
  const hasActiveMediaData = !!activeMediaData && !activeMediaData.business;

  if (!currentUser) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-slate-950 font-sans relative overflow-hidden">
        <div className="medical-grid absolute inset-0 opacity-40" />
        <div className="scanline"></div>
        <div className="relative z-10 w-full max-w-4xl px-4">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight glow-text uppercase">
              Dr. <span className="text-sky-400">Chinki</span> Access Portal
            </h1>
            <p className="mt-2 text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-[0.3em]">
              Secure Login • Admin &amp; Super Admin Ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr,0.9fr] gap-6 items-stretch">
            <form
              onSubmit={handleAuthSubmit}
              className="cyber-glass rounded-[2rem] p-6 md:p-8 border-slate-800 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-black text-base md:text-lg uppercase tracking-tight">
                  {authMode === 'login' ? 'Login' : 'Sign Up'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthError(null);
                  }}
                  className="text-[9px] font-black text-sky-400 uppercase tracking-[0.25em] hover:text-sky-300"
                >
                  {authMode === 'login' ? 'Create New User' : 'Already Have Account'}
                </button>
              </div>

              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-all"
                    placeholder="Boss Jaan ka naam..."
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-all"
                  placeholder="boss@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-all"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="text-[10px] text-red-300 bg-red-900/30 border border-red-500/40 rounded-xl px-3 py-2">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2.5 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg glow-cyan disabled:opacity-60"
              >
                {isAuthSubmitting ? 'Processing...' : authMode === 'login' ? 'Enter Neural Lab' : 'Create User'}
              </button>

              <p className="mt-2 text-[9px] text-slate-500 leading-relaxed">
                Demo roles ke liye:
                <br />
                <span className="font-mono text-slate-300">
                  Super Admin: boss@kamaralam.local / bossjaan
                </span>
                <br />
                <span className="font-mono text-slate-300">
                  Admin: admin@clinic.local / admin123
                </span>
              </p>
            </form>

            <div className="cyber-glass rounded-[2rem] p-6 md:p-8 border-sky-500/30 flex flex-col justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-black text-sky-400 uppercase tracking-[0.3em] mb-3">
                  Access Levels
                </h3>
                <ul className="space-y-3 text-[10px] text-slate-300">
                  <li>
                    <span className="font-bold text-sky-300">User</span> – Normal study/chat mode, LiveTutor,
                    3D Visual Lab, Neural Link Hub.
                  </li>
                  <li>
                    <span className="font-bold text-emerald-300">Admin</span> – Analytics panel (session &amp;
                    memory stats), basic ops controls.
                  </li>
                  <li>
                    <span className="font-bold text-pink-300">Super Admin</span> – Complex mode toggle, governance
                    and system flags; sirf Kamar Alam level access.
                  </li>
                </ul>
              </div>
              <div className="mt-4 text-[8px] text-slate-500 font-black uppercase tracking-[0.35em] text-center">
                Secure Entry • Dr. Chinki Neural Interface
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full flex flex-col p-3 md:p-6 overflow-hidden bg-slate-900 font-sans">
      <div className="scanline"></div>

      <div className="flex justify-between items-center mb-4 md:mb-6 z-10">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="w-10 h-10 md:w-16 md:h-16 cyber-glass rounded-xl md:rounded-2xl overflow-hidden flex items-center justify-center border-sky-500/30 glow-cyan">
             <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200" alt="Dr. Chinki" className="w-full h-full object-cover"/>
          </div>
          <div>
            <h1 className="font-extrabold text-lg md:text-3xl text-white tracking-tight glow-text uppercase leading-none">
                DR. <span className="text-sky-400">CHINKI</span>
            </h1>
            <p className="text-[8px] md:text-[10px] text-sky-400/60 font-bold uppercase tracking-[0.2em] mt-1">World's Best Doctor & Oracle</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          <button onClick={() => setIsGrowthLabActive(true)} className="hidden lg:flex items-center gap-2 cyber-glass bg-yellow-500/10 text-yellow-400 px-6 py-3 rounded-2xl font-black text-[10px] hover:bg-yellow-500/20 transition-all border-yellow-500/30 uppercase tracking-[0.2em]">GROWTH HUB</button>
          
          <button onClick={() => setIsImageEnabled(!isImageEnabled)} className={`hidden md:flex items-center gap-2 cyber-glass px-3 py-2 rounded-xl font-black text-[9px] transition-all uppercase tracking-[0.2em] ${isImageEnabled ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
           {isImageEnabled ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>}
            <span className="hidden lg:inline">IMAGING {isImageEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`flex items-center gap-2 cyber-glass px-3 py-2 rounded-xl font-black text-[9px] transition-all uppercase tracking-[0.2em] ${isVoiceEnabled ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            {isVoiceEnabled ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6-1.5 1.5m0 0 1.5 1.5m-1.5-1.5h1.5m-1.5 0h-1.5m6.375 0-1.125-1.125a3.375 3.375 0 0 0-4.242 0zM12 18.75v-5.25c0-1.54.47-3.024 1.318-4.243a4.5 4.5 0 1 1 7.364 0c.848 1.219 1.318 2.703 1.318 4.243v5.25" /></svg>}
            <span className="hidden md:inline">VOICE {isVoiceEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={() => setIsMemoriesOpen(true)}
            className="hidden md:flex items-center gap-2 cyber-glass px-3 py-2 rounded-xl font-black text-[9px] transition-all uppercase tracking-[0.2em] bg-slate-800 text-slate-300 border-slate-700 hover:border-sky-500/40 hover:text-sky-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3v9.75a2.25 2.25 0 0 1-2.25 2.25H7.5A2.25 2.25 0 0 1 5.25 18V8.25a3 3 0 0 1 3-3h7.5Zm0 0V3.75A2.25 2.25 0 0 0 13.5 1.5h-3a2.25 2.25 0 0 0-2.25 2.25v1.5" />
            </svg>
            <span className="hidden lg:inline">MEMORIES</span>
          </button>
          {['admin', 'superadmin'].includes(currentUser.role) && (
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="hidden lg:flex items-center gap-2 cyber-glass px-4 py-2 rounded-xl font-black text-[9px] transition-all uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20"
            >
              <span>ADMIN</span>
            </button>
          )}
          {currentUser.role === 'superadmin' && (
            <button
              onClick={() => setIsSuperAdminPanelOpen(true)}
              className="hidden xl:flex items-center gap-2 cyber-glass px-4 py-2 rounded-xl font-black text-[9px] transition-all uppercase tracking-[0.2em] bg-pink-500/10 text-pink-300 border-pink-500/40 hover:bg-pink-500/20"
            >
              <span>SUPER ADMIN</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-red-500/60 hover:bg-red-500/10 transition-all"
          >
            <span>LOGOUT</span>
          </button>
          <button onClick={() => setIsLiveActive(true)} className="flex items-center gap-2 md:gap-3 cyber-glass bg-sky-500/10 text-sky-400 px-3 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] hover:bg-sky-500/20 transition-all border-sky-500/30 uppercase tracking-[0.2em]">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-sky-400 rounded-full animate-pulse shadow-glow"></div>
            <span>LIVE</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 z-10 relative">
        <div className="flex-1 md:flex-none md:w-[40%] flex flex-col min-h-0">
          <ChatPane messages={messages} onSendMessage={handleSendMessage} isThinking={isThinking} onStartLive={() => setIsLiveActive(true)} />
        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 flex flex-col min-h-0 cyber-glass bg-slate-900/40 rounded-[2.5rem] border-slate-800">
                <div className="flex p-2 border-b border-slate-800">
                    <button onClick={() => setActiveLabTab('visual')} className={`flex-1 p-3 text-center text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeLabTab === 'visual' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:bg-slate-800/50'}`}>3D Visual Lab</button>
                    <button onClick={() => setActiveLabTab('media')} className={`flex-1 p-3 text-center text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeLabTab === 'media' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:bg-slate-800/50'}`}>Neural Link Hub</button>
                </div>
                <div className="flex-1 min-h-0 relative">
                  {activeLabTab === 'visual' && (
                      <VisualPane 
                          model={currentModel} 
                          generatedImageUrl={isImageEnabled ? generatedImageUrl : null} 
                          onSelectPart={setSelectedPart} 
                          selectedPart={selectedPart}
                          isImageEnabled={isImageEnabled} 
                      />
                  )}
                  {activeLabTab === 'media' && (
                     shouldShowBusinessLab ? (
                      <BusinessGrowthLab 
                        analysis={activeMediaData?.business}
                        onClose={() => { setIsGrowthLabActive(false); setActiveMediaData(null); }}
                        onStartAnalysis={handleStartGrowthAnalysis}
                        isAnalyzing={isThinking}
                      />
                    ) : hasActiveMediaData ? (
                      <MediaLab 
                        webAnalysis={activeMediaData?.web} 
                        youtubeAnalysis={activeMediaData?.youtube} 
                        faceAnalysis={activeMediaData?.face}
                        treatmentPlan={activeMediaData?.treatment}
                        documentAnalysis={activeMediaData?.document}
                        onClose={() => setActiveMediaData(null)} 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                        <h3 className="text-slate-400 font-black text-xs uppercase tracking-widest">Neural Link Hub</h3>
                        <p className="text-[10px] text-slate-600 mt-2 italic">Chinki is waiting for your command Boss Jaan.</p>
                      </div>
                    )
                  )}
                </div>
            </div>
        </div>
      </div>

      {isLiveActive && <LiveTutor isActive={isLiveActive} onClose={() => { setIsLiveActive(false); setRequestCameraOnOpen(false); }} requestCameraOnOpen={requestCameraOnOpen} />}
      <MemoriesPanel isOpen={isMemoriesOpen} onClose={() => setIsMemoriesOpen(false)} />
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        sessionMessageCount={messages.length}
      />
      {currentUser.role === 'superadmin' && (
        <SuperAdminPanel
          isOpen={isSuperAdminPanelOpen}
          onClose={() => setIsSuperAdminPanelOpen(false)}
          currentUser={currentUser}
          isComplexMode={isComplexMode}
          onToggleComplexMode={() => setIsComplexMode((prev) => !prev)}
        />
      )}
    </div>
  );
};

export default App;
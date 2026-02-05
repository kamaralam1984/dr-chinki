import React, { useEffect, useState } from 'react';
import { AuthUser } from '../types';
import { getUserProfile, saveUserProfile, UserProfile } from '../services/memoryService';
import { getSystemPrompt, saveSystemPrompt, resetToDefaultPrompt, getPromptStats } from '../services/promptService';

interface SuperAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  isComplexMode: boolean;
  onToggleComplexMode: () => void;
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  isComplexMode,
  onToggleComplexMode,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  
  // Prompt Editor State
  const [activeTab, setActiveTab] = useState<'profile' | 'prompt'>('profile');
  const [promptText, setPromptText] = useState('');
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [isPromptSaving, setIsPromptSaving] = useState(false);
  const [promptMessage, setPromptMessage] = useState<string | null>(null);
  const [promptStats, setPromptStats] = useState({ length: 0, isCustom: false, wordCount: 0 });

  useEffect(() => {
    if (!isOpen) return;
    const loadProfile = async () => {
      setIsProfileLoading(true);
      setProfileMessage(null);
      try {
        const res = await getUserProfile();
        if (res.success && res.profile) {
          setProfile(res.profile);
        } else {
          setProfile({
            name: currentUser.name,
            interests: [],
            goals: [],
            preferred_language: 'Hinglish',
            personality_type: 'Dr. Chinki – Influencer Tutor',
          });
        }
      } catch (e) {
        console.error(e);
        setProfileMessage('Profile load nahi ho paaya. Backend check karein.');
      } finally {
        setIsProfileLoading(false);
      }
    };
    const loadPrompt = () => {
      setIsPromptLoading(true);
      setPromptMessage(null);
      try {
        const prompt = getSystemPrompt();
        setPromptText(prompt);
        const stats = getPromptStats();
        setPromptStats(stats);
      } catch (e) {
        console.error(e);
        setPromptMessage('Prompt load nahi ho paaya.');
      } finally {
        setIsPromptLoading(false);
      }
    };
    loadProfile();
    loadPrompt();
  }, [isOpen, currentUser.name]);

  const handleProfileChange = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...(prev || { interests: [], goals: [] }), ...updates }));
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await saveUserProfile(profile);
      setProfileMessage(res.success ? 'Brand memory successfully updated Boss Jaan.' : res.message);
    } catch (e) {
      console.error(e);
      setProfileMessage('Profile save karte waqt error aaya.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleSavePrompt = async () => {
    setIsPromptSaving(true);
    setPromptMessage(null);
    try {
      const res = saveSystemPrompt(promptText);
      setPromptMessage(res.success ? 'System prompt successfully saved! Dr. Chinki ab iske hisab se behave karegi.' : res.message);
      if (res.success) {
        const stats = getPromptStats();
        setPromptStats(stats);
      }
    } catch (e) {
      console.error(e);
      setPromptMessage('Prompt save karte waqt error aaya.');
    } finally {
      setIsPromptSaving(false);
    }
  };

  const handleResetPrompt = () => {
    if (confirm('Kya aap default prompt me reset karna chahte hain? Current custom prompt delete ho jayega.')) {
      const res = resetToDefaultPrompt();
      setPromptMessage(res.success ? 'Reset to default prompt successful!' : res.message);
      if (res.success) {
        const prompt = getSystemPrompt();
        setPromptText(prompt);
        const stats = getPromptStats();
        setPromptStats(stats);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-4">
      <div className="w-full max-w-4xl cyber-glass bg-slate-950/95 rounded-[2.75rem] border-sky-500/40 shadow-[0_0_80px_rgba(56,189,248,0.35)] overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center glow-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-sky-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-black text-lg md:text-2xl uppercase tracking-tight glow-text">
                Super Admin Console
              </h2>
              <p className="text-[8px] md:text-[9px] text-sky-400/75 font-black uppercase tracking-[0.35em]">
                Root Access • Kamar Alam Only
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

        <div className="px-6 md:px-8 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">
              Logged In As
            </span>
            <p className="text-sm font-semibold text-white">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.25em] bg-sky-500/20 text-sky-300 border border-sky-500/40">
              {currentUser.role.toUpperCase()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">
              Gemini Mode
            </span>
            <p className="text-sm font-semibold text-white">
              {isComplexMode ? 'Complex / Pro' : 'Standard / Flash'}
            </p>
            <p className="text-[10px] text-slate-400">
              Complex mode zyada powerful models use karta hai (costly + slow).
            </p>
            <button
              onClick={onToggleComplexMode}
              className={`mt-2 inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border transition-all ${
                isComplexMode
                  ? 'bg-red-500/10 text-red-300 border-red-500/50 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/20'
              }`}
            >
              Toggle Complex Mode
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">
              System Flags
            </span>
            <ul className="text-[10px] text-slate-400 space-y-1">
              <li>Node Engine: &gt;= 20 (package.json me set)</li>
              <li>Python Memory Backend: manual start required</li>
              <li>Gemini API Key: Vite env ke through browser-side</li>
            </ul>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 md:px-8 py-4 border-b border-slate-800 flex gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
              activeTab === 'profile'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                : 'bg-slate-900 text-slate-500 border border-slate-700 hover:text-slate-300'
            }`}
          >
            Brand Memory
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
              activeTab === 'prompt'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                : 'bg-slate-900 text-slate-500 border border-slate-700 hover:text-slate-300'
            }`}
          >
            System Prompt Editor (1000+ Lines)
          </button>
        </div>

        <div className="px-6 md:px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
              Chinki Brand Memory (Profile)
            </h3>
            {isProfileLoading && (
              <p className="text-[10px] text-slate-500 mb-2">Profile loading...</p>
            )}
            {profile && (
              <div className="space-y-3 text-[10px] text-slate-300">
                <div>
                  <label className="block text-[9px] text-slate-400 font-black uppercase tracking-[0.25em] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile.name || ''}
                    onChange={(e) => handleProfileChange({ name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-[10px] text-slate-100 focus:outline-none focus:border-sky-500"
                    placeholder="Boss Jaan ka naam ya preferred title"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-black uppercase tracking-[0.25em] mb-1">
                    Interests (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profile.interests.join(', ')}
                    onChange={(e) =>
                      handleProfileChange({
                        interests: e.target.value
                          .split(',')
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-[10px] text-slate-100 focus:outline-none focus:border-sky-500"
                    placeholder="NEET, Business, Content, Politics..."
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-black uppercase tracking-[0.25em] mb-1">
                    Goals (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profile.goals.join(', ')}
                    onChange={(e) =>
                      handleProfileChange({
                        goals: e.target.value
                          .split(',')
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-[10px] text-slate-100 focus:outline-none focus:border-sky-500"
                    placeholder="YouTube growth, NEET rank, clinic expansion..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-black uppercase tracking-[0.25em] mb-1">
                      Preferred Language
                    </label>
                    <input
                      type="text"
                      value={profile.preferred_language || ''}
                      onChange={(e) => handleProfileChange({ preferred_language: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-[10px] text-slate-100 focus:outline-none focus:border-sky-500"
                      placeholder="Hinglish / Hindi / English"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 font-black uppercase tracking-[0.25em] mb-1">
                      Personality Mode
                    </label>
                    <input
                      type="text"
                      value={profile.personality_type || ''}
                      onChange={(e) => handleProfileChange({ personality_type: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-[10px] text-slate-100 focus:outline-none focus:border-sky-500"
                      placeholder="Influencer Tutor / Business Oracle / Political Coach..."
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isProfileSaving}
                  className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.25em] bg-sky-600 text-white hover:bg-sky-500 transition-all disabled:opacity-60"
                >
                  {isProfileSaving ? 'Saving...' : 'Save Brand Memory'}
                </button>
                {profileMessage && (
                  <p className="text-[9px] text-slate-400 mt-1">
                    {profileMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
              Governance Rules
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-400">
              <li>Sirf trusted devices par Super Admin login details use karein.</li>
              <li>Medical guidance ko kabhi real doctor ke replacement ke roop me present na karein.</li>
              <li>User ki photos, voice aur memories ka misuse strictly prohibited hai.</li>
            </ul>
          </div>
          </div>
          )}

          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
                    Dr. Chinki System Prompt (Full Control)
                  </h3>
                  <p className="text-[9px] text-slate-500">
                    Yahan tum Dr. Chinki ka complete behavior, language, memory rules, aur sab kuch set kar sakte ho. 
                    Minimum 100 characters required. Current: {promptStats.length} chars, {promptStats.wordCount} words, 
                    {promptStats.isCustom ? ' Custom Prompt' : ' Default Prompt'}
                  </p>
                </div>
                <button
                  onClick={handleResetPrompt}
                  className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.25em] bg-red-500/10 text-red-300 border border-red-500/50 hover:bg-red-500/20 transition-all"
                >
                  Reset Default
                </button>
              </div>
              
              {isPromptLoading && (
                <p className="text-[10px] text-slate-500 text-center py-4">Prompt loading...</p>
              )}
              
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full h-[50vh] bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-[11px] text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-sky-500 resize-none custom-scrollbar"
                placeholder="Yahan Dr. Chinki ka complete system prompt likho..."
                spellCheck={false}
              />
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSavePrompt}
                  disabled={isPromptSaving || promptText.trim().length < 100}
                  className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.25em] bg-sky-600 text-white hover:bg-sky-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPromptSaving ? 'Saving...' : 'Save System Prompt'}
                </button>
                {promptMessage && (
                  <p className={`text-[9px] ${promptMessage.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {promptMessage}
                  </p>
                )}
              </div>
              
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">
                  Important Notes:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[9px] text-slate-500">
                  <li>Prompt save hone ke baad LiveTutor aur Chat me Dr. Chinki iske hisab se behave karegi.</li>
                  <li>Kamar Alam ko "Boss", "Jaan" (selectively), ya "Sir" keh sakti ho.</li>
                  <li>75% Urdu, 25% Hinglish language ratio maintain karo.</li>
                  <li>"Mujhe pehchano" / "Yaad rakhna" commands se image + name + details database me save honge.</li>
                  <li>Sabhi se pyaar se, gentle tone me baat karna zaroori hai.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 md:px-8 py-3 border-t border-slate-800 text-[8px] text-slate-600 font-black uppercase tracking-[0.35em] text-center">
          Super Admin Panel • Root Level Configuration • Handle With Care
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;


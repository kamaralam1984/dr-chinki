## DR. CHINKI – FULL SYSTEM OVERVIEW (SINGLE-FILE STYLE EXPLAIN)

Yeh document tumhare poore project ka **high-level overview** hai – jaise sab kuch ek hi file me likha ho.

---

## 1. FRONTEND ENTRY

**`index.tsx`**
- Browser me React app mount karta hai.
- `#root` element dhundta hai, uspe:
  - `ReactDOM.createRoot(rootElement)`
  - `<App />` render.

**`App.tsx` – MASTER UI CONTROLLER**
- Global states:
  - `messages` – saari chat history.
  - `currentModel` – kaunsa 3D organ model dikhana hai.
  - `generatedImageUrl` – AI se aayi medical image.
  - `isThinking` – AI response wait state.
  - `isGeneratingImage` – image generate ho rahi hai.
  - `selectedPart` – 3D model ka selected part.
  - `isLiveActive` – LiveTutor (Neural Vision + Voice) panel open hai ya nahi.
  - `isVoiceEnabled`, `isImageEnabled` – toggles.
  - `isGrowthLabActive` – Business growth lab toggle.
  - `isComplexMode` – heavy AI mode (logic `geminiService` me).
  - `awaitingCameraConfirmation`, `requestCameraOnOpen` – chat-based camera permission flow.
  - `activeLabTab` – `"visual"` (3D lab) ya `"media"` (Neural Link Hub).
  - `activeMediaData` – YouTube/Web/Face/Treatment/Paranormal/Document/Business analysis data.
- `synthRef` – browser `speechSynthesis` reference.

**Core function: `handleSendMessage(text, files?, audioBase64?)`**
- Audio diya ho to:
  - `transcribeAudio` se text banata hai.
- Agar user "haan / yes" bole aur camera confirmation pending ho:
  - `requestCameraOnOpen = true`, `isLiveActive = true`, return (AI call nahi).
- Chat me **user message** push karta hai.
- Recent 5 messages se **history** banata hai.
- Files ko Gemini ke format me convert karta hai (`inlineData`).
- `getTutorResponse(...)` ko call:
  - **Input**: user text + history + images + mode.
  - **Output**: JSON jisme:
    - `explanation` (assistant text),
    - `suggestedModel` (organ),
    - `imagePrompt`,
    - `voiceOutput`,
    - `groundingLinks`,
    - `youtubeAnalysis`, `webAnalysis`, `faceAnalysis`,
    - `treatmentPlan`, `paranormalAnalysis`, `documentAnalysis`, `businessAnalysis`,
    - `cameraPermissionRequested`.
- Response aane ke baad:
  - Assistant message chat me add.
  - Agar **media analysis** mila:
    - `activeMediaData` set, `activeLabTab = 'media'`.
  - Agar **imagePrompt** mila aur imaging on hai:
    - `generateMedicalImage(...)` call, jo medical image base64 se URL banata hai.
    - `generatedImageUrl` set + `activeLabTab = 'visual'`.
  - Agar **organ model** suggest hua:
    - `currentModel` set karo (e.g. `"brain"`, `"heart"`).
  - Agar **voiceOutput** mila aur voice on hai:
    - `SpeechSynthesisUtterance` se Hindi voice me bolne lagta hai.

**Layout:**
- Left: `ChatPane` (text + voice + file input).
- Right:
  - Top tabs: `"3D Visual Lab"` / `"Neural Link Hub"`.
  - `visual` tab:
    - `VisualPane` – organ 3D model + generated image.
  - `media` tab:
    - Agar business mode active: `BusinessGrowthLab` panel.
    - Nahi to `MediaLab` jo YT, web, doc, face, treatment, paranormal analysis cards dikhata hai.
- Footer overlay: `LiveTutor` jab `isLiveActive` true ho.

---

## 2. CHAT & STORYBOARD – `ChatPane.tsx`

- Props:
  - `messages` – chat history.
  - `onSendMessage(text, files?)` – App se aaya handler.
  - `isThinking` – loading state.
  - `onStartLive` – future use (Live mode open karne ke liye).
- Features:
  - **Auto-scroll** jab naya message ya thinking state change ho.
  - **Voice input**:
    - Browser `SpeechRecognition` (ya `webkitSpeechRecognition`) se mic press/release par Hindi/Hinglish text add hota hai.
  - **File attachments**:
    - User images / videos attach kar sakta hai.
    - `FileReader` se base64 encode, `attachedFiles` state me store.
  - `handleSubmit`:
    - `inputText` + attached files ko `onSendMessage` me pass.
    - Local input clear karta hai.
- Message rendering:
  - User message right side, blue bubble.
  - Assistant message left side, dark bubble.
  - Agar `msg.groundingLinks` ho:
    - “Sources Found” section with clickable links.
  - Agar `msg.storyBoard` ho:
    - `StoryboardView` – YouTube/shorts style scene‑by‑scene storyboard:
      - har scene ka dialogue, visual action, image prompt, Veo video prompt.

---

## 3. LIVE NEURAL TUTOR – `LiveTutor.tsx`

Yeh component **real-time voice + camera + memory** integration ka brain hai.

### 3.1 State & refs
- Status:
  - `status`: `"CONNECTING" | "ACTIVE" | "STABILIZING" | "ERROR"`.
  - `isSpeaking`, `transcription` (user text), `aiResponse` (AI ka jawab).
  - `showResultPanel` – captions panel on/off.
  - `isRecording`, `isSessionRecording`, `sessionRecordingUrl`.
- Refs:
  - `transcriptionRef`, `aiResponseRef` – latest text track karne ke liye.
  - Audio: `audioContextRef`, `mixedDestinationRef`, `sessionRecorderRef`, `sourcesRef`, `nextStartTimeRef`.
  - Media: `mediaRecorderRef`, `audioChunksRef`, `audioStreamRef`.
  - Video: `videoRef`, `canvasRef`, `cameraStreamRef`, `frameIntervalRef`.
  - Session: `sessionRef`, `reconnectTimeoutRef`, `retryCountRef`, `isIntentionalCloseRef`, `mountedRef`.
  - Camera: `isCameraActive`, `isCameraPromptActive` + unke refs.

### 3.2 Session lifecycle (`initSession`)
- `GoogleGenAI` ke `live.connect` se:
  - Model: `gemini-2.5-flash-native-audio-preview-12-2025`.
  - Response modality: `AUDIO` (AI ka voice).
  - Input/output transcription enabled.
  - Tools (function calling):
    - `requestCamera`
    - `stopCamera`
    - `rememberThis`
    - `recognizePerson`
    - `rememberVoice`
  - System prompt: **DR. CHINKI v2.0** (medical + teacher + oracle personality, Hindi feminine style, Kamar Alam creator, etc.).
- Mic stream:
  - `getUserMedia({ audio: true })` → `AudioContext` se connect.
  - `ScriptProcessorNode` me audio frames:
    - 24kHz → 16kHz downsample.
    - Blob format me convert (`createGenAIBlob`).
    - `sessionRef.current.sendRealtimeInput({ media: ... })`.
- On `onmessage`:
  - **Tool calls** handle:
    - `requestCamera` → UI me camera permission modal dikhana.
    - `stopCamera` → camera band karna.
    - `rememberThis`:
      - 3s audio recording, base64 audio, optional camera se ek snapshot.
      - Current transcription se text.
      - Ye sab `saveMemory(...)` ko pass.
    - `recognizePerson`:
      - `action: 'save'` → face + name ko `saveMemory`.
      - `action: 'recall'` → `recognizeFromDescription` se DB me check.
    - `rememberVoice`:
      - `action: 'save'` → `saveVoiceProfile`.
      - `action: 'identify'` → `recognizeVoice`.
  - **Text**:
    - `inputTranscription` → user text update (`transcription`).
    - `outputTranscription` → AI reply text update (`aiResponse`).
  - **Audio**:
    - AI ke base64 audio ko decode karke `AudioBuffer` banata hai.
    - Play queue handle karta hai (overlap avoid).
    - Mixed destination pe bhi connect, taki full session record ho sake.
  - **Interruption**:
    - Agar AI session interrupt ho jaye:
      - sab audio sources stop.
      - `transcription`/`aiResponse` clear.

### 3.3 Camera & Neural Vision
- `handleToggleCamera`:
  - Camera ON:
    - `getUserMedia({ video: { width, height, facingMode: "user" } })`.
    - `cameraStreamRef` me store + video element par set.
    - `setInterval` se har second ek frame:
      - canvas par draw.
      - JPEG blob bana ke base64.
      - `sessionRef.current.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } })`.
  - Camera OFF:
    - `stopHardware()` – tracks + intervals stop.
- Permission modal:
  - Hindi me “Boss Jaan, kya main camera on karoon?”
  - Buttons: `Nahi` / `Haan, Zaroor`.

### 3.4 Session recording (MP3 style)
- `handleToggleSessionRecording`:
  - `mixedDestinationRef.stream` se `MediaRecorder` banata hai.
  - Stop hone par:
    - Blob ko URL me convert karta hai.
    - `sessionRecordingUrl` – download button dikhata hai “Download MP3”.

---

## 4. GEMINI SERVICE – `services/geminiService.ts`

### 4.1 `getTutorResponse(...)`
- Intent detection:
  - `hasUrl` – kya prompt me URL / .com / http hai.
  - `isBusiness` – business / lead / market words.
  - `isMapRequest` – nearby / location / map.
- Model choose:
  - Default: `gemini-3-flash-preview`.
  - URL/business/maps: `gemini-2.5-flash`.
  - Complex / files: `gemini-3-pro-preview`.
  - Fast mode: `gemini-flash-lite-latest`.
- User profile injection:
  - `getUserProfile()` se:
    - name, interests, goals, skill level, business type, personality, language.
  - Inko `[USER MEMORY]` section me embed karke prompt strong banata hai.
- Tools:
  - `googleSearch` (har time).
  - `googleMaps` agar map request.
- Response:
  - Content se `response.text` lekar:
    - Markdown code fences clean.
    - JSON parse try.
    - Fail ho to simple repair (braces/brackets balance).
  - Grounding metadata se:
    - `GroundingLink[]` (title + url) banata hai.
  - Parsed JSON wapas deta hai (App.tsx use karta hai).

### 4.2 `getQuizQuestions(topic)`
- NEET-style MCQs (5 questions).
- Response schema strongly defined (question, options, correctIndex, explanation).

### 4.3 `transcribeAudio(base64Audio)`
- `gemini-3-flash-preview` se audio transcription (Hindi/Hinglish friendly).

### 4.4 `generateMedicalImage(prompt)`
- `gemini-2.5-flash-image` ko call.
- Inline image se base64 data leke `data:image/png;base64,...` style URL return.

### 4.5 `generateVeoVideo(...)`
- Veo 3 se short video generate.
- Polling until operation done.
- Generated video URI se download karke Blob URL return.

---

## 5. MEMORY & BACKEND (PYTHON)

**`memory_server.py` + `backend/` + `memories.db`**
- SQLite DB me:
  - text description,
  - image base64,
  - audio,
  - metadata (timestamp, type, source, etc.).
- Functions (TS service se dikhte hue):
  - `saveMemory`, `recognizeFromDescription`.
  - `saveVoiceProfile`, `recognizeVoice`.
- Use cases:
  - “Remember this” → image + audio + text as single memory.
  - “Yeh kaun hai?” → current face se DB check.
  - “Meri awaaz yaad rakho” → voice profile save.

---

## 6. KYA CHEEZEIN ABHI IMPROVE HO SAKTI HAIN

- **Node version alignment**:
  - `package.json` me `"engines": { "node": ">=20" }` add karo.
  - `nvm` se Node 20 LTS pe standardize karo.
- **Safer JSON handling**:
  - `getTutorResponse` ke liye:
    - `responseMimeType: "application/json"` + `responseSchema` wapas enable.
    - Agar parse fail ho to UI me clear fallback message + retry option.
- **Privacy & control**:
  - Settings panel:
    - Memories list + delete.
    - Face/voice memory toggles.
    - “Clear all memories” button.
- **LiveTutor modularization**:
  - Audio, camera, session, recording logic ko alag hooks me tod do (`useLiveSession`, `useCamera`, `useSessionRecorder`).
- **Business/Media UX**:
  - Neural Link Hub me chips/tabs: YouTube / Websites / Docs / Treatment / Business.
- **Onboarding & help**:
  - Pehli baar open hone par short guided tour + “How to talk to Dr. Chinki” tips.

Yeh file tumhe kisi bhi developer ko dikha kar **poora system 5 minute me samjhaane** ke kaam aayegi.


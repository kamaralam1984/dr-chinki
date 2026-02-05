import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob, Type } from '@google/genai';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { saveMemory, recognizeFromDescription, saveVoiceProfile, recognizeVoice } from '../services/memoryService';
import { getSystemPrompt } from '../services/promptService';

interface LiveTutorProps {
  onClose: () => void;
  isActive: boolean;
  requestCameraOnOpen?: boolean;
}

// Utility functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const blobToBase64 = (blob: globalThis.Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) {
  if (outputSampleRate === inputSampleRate) return buffer;
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function createGenAIBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveTutor: React.FC<LiveTutorProps> = ({ onClose, isActive, requestCameraOnOpen }) => {
  const [status, setStatus] = useState<'CONNECTING' | 'ACTIVE' | 'STABILIZING' | 'ERROR'>('CONNECTING');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState(''); // User Text
  const [aiResponse, setAiResponse] = useState(''); // AI Text
  const [showResultPanel, setShowResultPanel] = useState(true); // Toggle for result panel
  const [isRecording, setIsRecording] = useState(false); // Audio recording state
  const [isSessionRecording, setIsSessionRecording] = useState(false);
  const [sessionRecordingUrl, setSessionRecordingUrl] = useState<string | null>(null);

  // Refs for text to avoid stale closures without breaking dependency array
  const transcriptionRef = useRef('');
  const aiResponseRef = useRef('');

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => { transcriptionRef.current = transcription; }, [transcription]);
  useEffect(() => { aiResponseRef.current = aiResponse; }, [aiResponse]);

  // Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraPromptActive, setIsCameraPromptActive] = useState(false);

  // Refs to track state inside callbacks without breaking closures
  const isCameraActiveRef = useRef(false);
  const isCameraPromptActiveRef = useRef(false);
  const mountedRef = useRef(true);
  const isIntentionalCloseRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Sync refs
  useEffect(() => { isCameraActiveRef.current = isCameraActive; }, [isCameraActive]);
  useEffect(() => { isCameraPromptActiveRef.current = isCameraPromptActive; }, [isCameraPromptActive]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sessionRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionChunksRef = useRef<Blob[]>([]);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Separate session cleanup from hardware cleanup
  const disconnectSession = useCallback(() => {
    console.log("Disconnecting Session (keeping camera alive if active)");

    // Clear reconnect timer
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error("Session close warning:", e);
      }
      sessionRef.current = null;
    }

    // Stop audio sources
    sourcesRef.current.forEach((s: any) => { try { s.stop(); } catch (e) { } });
    sourcesRef.current.clear();

    // Close AudioContext (optional, but good practice for new session)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.error("AudioContext close warning:", e);
      }
      audioContextRef.current = null;
    }
  }, []);

  const stopHardware = useCallback(() => {
    console.log("Stopping Hardware (Camera/Mic)");

    // Stop Camera Stream
    if (cameraStreamRef.current) {
      console.log("Stopping camera tracks", cameraStreamRef.current.id);
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }

    // Clear Frame Interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Clear Video Source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Stop Audio Stream if recording
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    console.log("Full Cleanup (Unmount)");
    isIntentionalCloseRef.current = true;
    disconnectSession();
    stopHardware();
  }, [disconnectSession, stopHardware]);

  // Ensure video stream is attached whenever camera state changes
  useEffect(() => {
    const attachVideo = async () => {
      if (isCameraActive && videoRef.current && cameraStreamRef.current) {
        // Only assign if different to prevent interruption
        if (videoRef.current.srcObject !== cameraStreamRef.current) {
          videoRef.current.srcObject = cameraStreamRef.current;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.error("Video play failed:", e);
          }
        }
      }
    };
    attachVideo();
  }, [isCameraActive]);

  // STABLE: Doesn't depend on changing state (uses refs)
  const handleToggleCamera = useCallback(async () => {
    console.log("handleToggleCamera called", { isCameraActive: isCameraActiveRef.current });
    setIsCameraPromptActive(false);

    if (!isCameraActiveRef.current) {
      // TURN ON CAMERA
      console.log("Attempting to turn ON camera");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          }
        });
        console.log("Camera stream acquired", stream.id);
        cameraStreamRef.current = stream;

        // Attach stream to video element immediately so user ko visual turant mile
        if (videoRef.current) {
          try {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          } catch (e) {
            console.error("Immediate video attach failed:", e);
          }
        }

        setIsCameraActive(true);

        // Start streaming frames to Gemini
        frameIntervalRef.current = window.setInterval(() => {
          if (videoRef.current && canvasRef.current && sessionRef.current) {
            const videoEl = videoRef.current;
            const canvasEl = canvasRef.current;
            const ctx = canvasEl.getContext('2d');
            if (ctx && videoEl.readyState >= 2) {
              canvasEl.width = videoEl.videoWidth;
              canvasEl.height = videoEl.videoHeight;
              ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);

              canvasEl.toBlob(
                async (blob) => {
                  if (blob && sessionRef.current) {
                    const base64Data = await blobToBase64(blob);
                    try {
                      sessionRef.current.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                    } catch (e) {
                      // Session might be closed
                    }
                  }
                },
                'image/jpeg',
                0.5
              );
            }
          }
        }, 1000);
      } catch (err) {
        console.error("Neural Vision error:", err);
        alert("Camera access failed. Please check permissions.");
        setIsCameraActive(false);
      }
    } else {
      // TURN OFF CAMERA
      console.log("Turning OFF camera (User Request)");
      stopHardware();
      setIsCameraActive(false);
    }
  }, [stopHardware]);

  // Audio Recording Functions
  const startAudioRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log('🎤 Audio recording started');
    } catch (error) {
      console.error('❌ Error starting audio recording:', error);
    }
  };

  const stopAudioRecording = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder) {
        reject(new Error('No media recorder'));
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        setIsRecording(false);

        // Stop all tracks
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }

        console.log('🎤 Audio recording stopped, size:', audioBlob.size);
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  };

  const handleToggleSessionRecording = useCallback(() => {
    if (!isSessionRecording) {
      // START RECORDING
      if (!mixedDestinationRef.current) {
        alert("Audio system not ready. Please wait for connection.");
        return;
      }

      const stream = mixedDestinationRef.current.stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });

      sessionChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          sessionChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(sessionChunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setSessionRecordingUrl(url);
        sessionChunksRef.current = [];
      };

      mediaRecorder.start();
      sessionRecorderRef.current = mediaRecorder;
      setIsSessionRecording(true);
      setSessionRecordingUrl(null);
      console.log("⏺ Session recording started");
    } else {
      // STOP RECORDING
      if (sessionRecorderRef.current && sessionRecorderRef.current.state !== 'inactive') {
        sessionRecorderRef.current.stop();
      }
      setIsSessionRecording(false);
      console.log("⏹ Session recording stopped");
    }
  }, [isSessionRecording]);

  // STABLE: Dependencies don't change often
  const initSession = useCallback(async () => {
    // Prevent double initialization if one is pending
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Only disconnect session, keep camera alive!
      disconnectSession();

      // Reset Intentional flag AFTER cleanup so we can catch real errors
      isIntentionalCloseRef.current = false;

      if (mountedRef.current) setStatus('CONNECTING');

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      // Create destination for mixed recording (User Mic + AI Voice)
      const mixedDest = audioCtx.createMediaStreamDestination();
      mixedDestinationRef.current = mixedDest;

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(mixedDest); // Connect mic to mixed destination for recording

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            if (mountedRef.current) {
              setStatus('ACTIVE');
              retryCountRef.current = 0; // Reset retries on successful connection
            }
            const scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1); // Reduced from 4096 for faster processing

            scriptProcessor.onaudioprocess = (e) => {
              if (!audioCtx || audioCtx.state === 'closed') return;
              const resampled = downsampleBuffer(e.inputBuffer.getChannelData(0), audioCtx.sampleRate, 16000);

              // Use sessionRef.current for near-zero overhead sending
              if (sessionRef.current) {
                try {
                  sessionRef.current.sendRealtimeInput({ media: createGenAIBlob(resampled) });
                } catch (err) {
                  // Ignore send error
                }
              }
            };

            micSource.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (!mountedRef.current) return;

            // Function Call Logic
            if (msg.toolCall) {
              const responses = [];
              for (const call of msg.toolCall.functionCalls) {
                if (call.name === 'requestCamera') {
                  if (!isCameraActiveRef.current && !isCameraPromptActiveRef.current) {
                    setIsCameraPromptActive(true);
                  }
                  responses.push({ id: call.id, name: call.name, response: { result: "ok, permission dialog displayed" } });
                } else if (call.name === 'stopCamera') {
                  if (isCameraActiveRef.current) {
                    handleToggleCamera();
                  }
                  responses.push({ id: call.id, name: call.name, response: { result: "ok, camera stopped" } });
                } else if (call.name === 'rememberThis') {
                  const args = call.args as any;
                  const memoryName = args?.name || 'Unnamed Memory';
                  const memoryDescription = args?.description || '';

                  // Start audio recording
                  await startAudioRecording();

                  // Wait 3 seconds to capture speech
                  await new Promise(resolve => setTimeout(resolve, 3000));

                  // Stop recording and get audio
                  let audioBase64 = '';
                  try {
                    const audioBlob = await stopAudioRecording();
                    audioBase64 = await blobToBase64(audioBlob);
                  } catch (error) {
                    console.error('Error recording audio:', error);
                  }

                  // Capture image if camera is active
                  let imageBase64 = '';
                  if (isCameraActiveRef.current && videoRef.current && canvasRef.current) {
                    const videoEl = videoRef.current;
                    const canvasEl = canvasRef.current;
                    const ctx = canvasEl.getContext('2d');

                    if (ctx && videoEl.readyState >= 2) {
                      canvasEl.width = videoEl.videoWidth;
                      canvasEl.height = videoEl.videoHeight;
                      ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                      imageBase64 = canvasEl.toDataURL('image/jpeg', 0.8);
                    }
                  }

                  // Get text from transcription
                  const text = transcriptionRef.current || memoryDescription;

                  // Save memory with audio, image, and text
                  const imageData: string | undefined = imageBase64 ? imageBase64 : undefined;
                  const audioData: string | undefined = audioBase64 ? audioBase64 : undefined;

                  saveMemory(
                    text,
                    imageData,
                    memoryName,
                    {
                      timestamp: new Date().toISOString(),
                      description: memoryDescription,
                      source: 'voice_command'
                    },
                    undefined,
                    audioData
                  ).then(result => {
                    if (result.success) {
                      console.log('✅ Memory saved with audio:', result);
                    } else {
                      console.error('❌ Failed to save memory:', result.message);
                    }
                  });

                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: {
                      result: `ok, memory saved as "${memoryName}"`
                    }
                  });
                } else if (call.name === 'recognizePerson') {
                  const args = call.args as any;
                  const action = args?.action || 'recall';
                  const personName = args?.name || '';

                  let imageBase64 = '';
                  if (isCameraActiveRef.current && videoRef.current && canvasRef.current) {
                    const videoEl = videoRef.current;
                    const canvasEl = canvasRef.current;
                    const ctx = canvasEl.getContext('2d');

                    if (ctx && videoEl.readyState >= 2) {
                      canvasEl.width = videoEl.videoWidth;
                      canvasEl.height = videoEl.videoHeight;
                      ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                      imageBase64 = canvasEl.toDataURL('image/jpeg', 0.8);
                    }
                  }

                  if (action === 'save' && personName) {
                    const recognitionData = {
                      type: 'person',
                      description: `Person named ${personName}`,
                      analyzed_at: new Date().toISOString()
                    };

                    const imageData: string | undefined = imageBase64 ? imageBase64 : undefined;
                    saveMemory(
                      `Person: ${personName}`,
                      imageData,
                      personName,
                      { timestamp: new Date().toISOString(), source: 'recognition_save' },
                      recognitionData
                    ).then(result => {
                      if (result.success) console.log('✅ Person saved:', result);
                      else console.error('❌ Failed to save person:', result.message);
                    });

                    responses.push({ id: call.id, name: call.name, response: { result: `ok, remembered ${personName}` } });
                  } else if (action === 'recall') {
                    const currentDescription = "person in view";
                    recognizeFromDescription(currentDescription).then(result => {
                      if (result.found && result.name) console.log(`✅ Recognized: ${result.name}`);
                      else console.log('❌ Person not recognized');
                    });

                    responses.push({ id: call.id, name: call.name, response: { result: "ok, checking who this is" } });
                  }
                } else if (call.name === 'rememberVoice') {
                  const args = call.args as any;
                  const action = args?.action || 'save';
                  const personName = args?.name || '';

                  if (action === 'save' && personName) {
                    // SAVE MODE: Remember voice profile using recent transcription
                    const recentSpeech = transcriptionRef.current || 'sample speech';

                    saveVoiceProfile(personName, recentSpeech).then(result => {
                      if (result.success) console.log('✅ Voice profile saved:', result);
                      else console.error('❌ Failed to save voice profile:', result.message);
                    });

                    responses.push({ id: call.id, name: call.name, response: { result: `ok, remembered ${personName}'s voice` } });
                  } else if (action === 'identify') {
                    // IDENTIFY MODE: Recognize speaker from current speech
                    const currentSpeech = transcriptionRef.current || '';

                    if (currentSpeech) {
                      recognizeVoice(currentSpeech).then(result => {
                        if (result.found && result.name) {
                          console.log(`✅ Identified speaker: ${result.name} (confidence: ${result.confidence})`);
                        } else {
                          console.log('❌ Speaker not recognized');
                        }
                      });
                    }

                    responses.push({ id: call.id, name: call.name, response: { result: "ok, identifying speaker" } });
                  }
                }
              }
              if (responses.length > 0) {
                sessionPromise.then(session => session.sendToolResponse({ functionResponses: responses }));
              }
            }

            // TEXT HANDLING LOGIC
            // 1. User Input Transcription
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              if (text) {
                // Check ref to see if we need to clear AI response
                if (aiResponseRef.current) setAiResponse('');
                setTranscription(prev => (prev + " " + text).trim());
              }
            }

            // 2. AI Output Transcription (Dr. Chinki's Response Text)
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              if (text) {
                setAiResponse(prev => (prev + text));
              }
            }

            // Audio Playback
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const ctx = audioContextRef.current;
              if (ctx && ctx.state !== 'closed') {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);

                // Also connect to mixed destination for recording
                if (mixedDestinationRef.current) {
                  source.connect(mixedDestinationRef.current);
                }

                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
            }

            // Interruption
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
              setAiResponse(''); // Clear AI text if interrupted
              setTranscription(''); // Reset user text for new input
            }
          },
          onclose: (e) => {
            if (isIntentionalCloseRef.current || !mountedRef.current || !sessionRef.current) return;
            console.log("Session Closed Unexpectedly", e);
            sessionRef.current = null; // Prevent further sends

            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

            // Retry Logic
            retryCountRef.current += 1;
            if (retryCountRef.current > MAX_RETRIES) {
              setStatus('ERROR');
              return;
            }

            // Use STABILIZING to sound less scary than RECONNECTING
            setStatus('STABILIZING');
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000); // 2s, 4s, 8s...
            reconnectTimeoutRef.current = setTimeout(() => {
              initSession();
            }, delay);
          },
          onerror: (e) => {
            if (isIntentionalCloseRef.current || !mountedRef.current || !sessionRef.current) return;
            console.error("Session Error", e);
            sessionRef.current = null; // Prevent further sends
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

            // Retry Logic
            retryCountRef.current += 1;
            if (retryCountRef.current > MAX_RETRIES) {
              setStatus('ERROR');
              return;
            }

            setStatus('STABILIZING');
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000); // 2s, 4s, 8s...
            reconnectTimeoutRef.current = setTimeout(() => {
              initSession();
            }, delay);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          generationConfig: {
            candidateCount: 1,
            maxOutputTokens: 512, // Faster completion
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},  // Request user text transcription
          tools: [{
            functionDeclarations: [
              {
                name: "requestCamera",
                description: "Call this function when the user wants to turn on the camera, show you something, or says 'dekho', 'camera on', 'see this'.",
              },
              {
                name: "stopCamera",
                description: "Call this function when the user wants to turn off the camera or says 'camera off', 'stop video'.",
              },
              {
                name: "rememberThis",
                description: "Call this function when the user wants you to remember something. Triggers include: 'yaad rakhna', 'ise yaad rakho', 'remember this', 'save this', 'yaad rakh'. Extract the name/label from user's speech.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "The name or label for this memory, extracted from user's speech (e.g., 'medicine bottle', 'my friend', 'this document')"
                    },
                    description: {
                      type: Type.STRING,
                      description: "A brief description of what to remember based on what you see or hear"
                    }
                  },
                  required: ["name"]
                }
              },
              {
                name: "recognizePerson",
                description: "Call this when user wants to recognize someone or asks 'yeh kaun hai', 'who is this', 'isko pehchan lo [naam]'. Use action='save' to remember with name, action='recall' to identify.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "Name of the person/object if user provides it (for saving)"
                    },
                    action: {
                      type: Type.STRING,
                      description: "'save' to remember a new person/object, 'recall' to identify who/what is in view"
                    }
                  },
                  required: ["action"]
                }
              },
              {
                name: "rememberVoice",
                description: "Call when user says 'meri awaz yaad rakho', 'remember my voice', or wants you to learn their voice. Use action='save' to remember voice, action='identify' to recognize who is speaking.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "Person's name (for saving voice profile)"
                    },
                    action: {
                      type: Type.STRING,
                      description: "'save' to remember voice profile, 'identify' to recognize speaker"
                    }
                  },
                  required: ["action"]
                }
              }
            ]
          }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: getSystemPrompt(),
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("Init Error", err);

      retryCountRef.current += 1;
      if (retryCountRef.current > MAX_RETRIES) {
        setStatus('ERROR');
        return;
      }

      setStatus('STABILIZING');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
      reconnectTimeoutRef.current = setTimeout(() => {
        initSession();
      }, delay);
    }
  }, [cleanup, handleToggleCamera]); // REMOVED STATE DEPENDENCIES

  useEffect(() => {
    if (isActive) {
      retryCountRef.current = 0; // Reset retries on first activation
      initSession();
      if (requestCameraOnOpen) setIsCameraPromptActive(true);
    }
    return () => cleanup();
  }, [isActive, initSession, cleanup, requestCameraOnOpen]);

  const handleVisionButtonClick = () => {
    if (isCameraActive) handleToggleCamera();
    else setIsCameraPromptActive(true);
  }

  const handleManualReconnect = () => {
    retryCountRef.current = 0;
    setStatus('CONNECTING');
    initSession();
  }

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-slate-950 overflow-hidden font-sans">
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 medical-grid"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/50 animate-scan"></div>
      </div>

      {/* Top HUD */}
      <div className="absolute top-10 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
        <div className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 pointer-events-auto ${status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : status === 'STABILIZING' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : status === 'STABILIZING' ? 'bg-sky-500 animate-ping' : 'bg-red-500'}`}></div>
          Neural Link: {status}
        </div>
        <button onClick={onClose} className="p-4 rounded-full bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-white transition-all pointer-events-auto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6 text-center">

        {/* Main Avatar / Camera Area */}
        <div className="relative w-72 h-72 md:w-96 md:h-96 mb-8 flex items-center justify-center">

          {/* The Round Container - Holds both Avatar and Camera Feed to ensure Round Shape */}
          <div className={`absolute inset-0 rounded-full overflow-hidden border-4 border-slate-800 transition-all duration-500 ${isSpeaking ? 'ring-8 ring-sky-500/20 scale-105' : ''} shadow-2xl`}>

            {/* 1. Camera Video (Visible only when Active) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isCameraActive ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}
            />

            {/* 2. Avatar Image (Visible only when Camera is INACTIVE) */}
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=600"
              alt="Dr. Chinki"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-0 z-0' : 'opacity-100 z-10'}`}
            />
          </div>

          {/* Overlays for Camera Mode */}
          {isCameraActive && (
            <div className="absolute inset-0 rounded-full pointer-events-none z-30 ring-4 ring-red-500/20 animate-pulse">
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-lg">
                REC • NEURAL VISION
              </div>
            </div>
          )}
        </div>

        {/* HOLOGRAPHIC RESULT PANEL - Always visible if there is content AND panel is enabled */}
        {(transcription || aiResponse) && showResultPanel && (
          <div className="w-full max-w-2xl bg-slate-950/80 border border-sky-500/30 backdrop-blur-xl rounded-[2rem] p-6 mb-8 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col gap-4 text-left relative overflow-hidden ring-1 ring-sky-500/20">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50"></div>

            {/* User Input Section */}
            {transcription && (
              <div className="flex gap-3 items-start opacity-80">
                <div className="min-w-[40px] pt-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-700">YOU</span>
                </div>
                <p className="text-sm md:text-base text-sky-100 font-medium leading-relaxed">
                  {transcription}
                </p>
              </div>
            )}

            {/* Divider if both exist */}
            {transcription && aiResponse && (
              <div className="w-full h-px bg-slate-800"></div>
            )}

            {/* AI Response Section */}
            {aiResponse && (
              <div className="flex gap-3 items-start">
                <div className="min-w-[40px] pt-1">
                  <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest bg-sky-950/30 border border-sky-500/20 px-2 py-1 rounded">CHINKI</span>
                </div>
                <p className="text-base md:text-lg text-white font-semibold leading-relaxed drop-shadow-md">
                  {aiResponse}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State / Listening Indicator (Only if panel is hidden OR no content) */}
        {(!transcription && !aiResponse) && (
          <div className="min-h-[80px] mb-8 w-full px-4 flex justify-center items-center">
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
              Listening to Boss Jaan...
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setShowResultPanel(!showResultPanel)}
            className={`px-6 py-4 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-3 shadow-lg border ${showResultPanel ? 'bg-slate-800 text-sky-400 border-sky-500/30 hover:bg-slate-700' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'}`}
          >
            {showResultPanel ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 1.9 1.9m-4.7 5.3h16.5" /></svg>
                Hide Captions
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.33-7.53a.972.972 0 0 1 1.736 0l4.33 7.53a1.012 1.012 0 0 1 0 .639l-4.33 7.53a.972.972 0 0 1-1.736 0l-4.33-7.53Z" /></svg>
                Show Captions
              </>
            )}
          </button>

          <button
            onClick={handleVisionButtonClick}
            className={`px-8 py-4 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-3 shadow-lg ${isCameraActive
              ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white'
              : 'bg-sky-600 text-white hover:bg-sky-500 glow-cyan'
              } `}
          >
            {isCameraActive ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 1.9 1.9m-4.7 5.3h16.5" /></svg>
                Disable Vision
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.33-7.53a.972.972 0 0 1 1.736 0l4.33 7.53a1.012 1.012 0 0 1 0 .639l-4.33 7.53a.972.972 0 0 1-1.736 0l-4.33-7.53Z" /></svg>
                Enable Neural Vision
              </>
            )}
          </button>

          <button
            onClick={handleToggleSessionRecording}
            className={`px-6 py-4 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-3 shadow-lg border ${isSessionRecording ? 'bg-red-500 text-white border-red-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isSessionRecording ? 'bg-white animate-pulse' : 'bg-red-500'}`}></div>
            {isSessionRecording ? 'Stop Recording' : 'Record Session'}
          </button>

          {sessionRecordingUrl && (
            <a
              href={sessionRecordingUrl}
              download={`DrChinki_Session_${new Date().toLocaleTimeString().replace(/:/g, '-')}.mp3`}
              className="px-6 py-4 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-3 shadow-lg border bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 glow-emerald"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0L16.5 12M12 16.5V3" /></svg>
              Download MP3
            </a>
          )}
        </div>

        {status === 'ERROR' && (
          <button onClick={handleManualReconnect} className="mt-4 px-6 py-2 bg-red-900/50 border border-red-500 text-red-200 rounded-full text-[9px] font-black uppercase hover:bg-red-900 transition-all animate-pulse">
            Connection Failed - Click to Retry
          </button>
        )}
      </div>

      {/* Permission Modal - Triggered by Voice or Click */}
      {isCameraPromptActive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm cyber-glass bg-slate-900 border-sky-500/40 p-8 md:p-10 rounded-[2.5rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent"></div>

            <div className="w-16 h-16 mx-auto bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/30 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.33-7.53a.972.972 0 0 1 1.736 0l4.33 7.53a1.012 1.012 0 0 1 0 .639l-4.33 7.53a.972.972 0 0 1-1.736 0l-4.33-7.53Z" /></svg>
            </div>

            <div>
              <h3 className="text-xl font-black text-white glow-text uppercase mb-2">Allow Neural Vision?</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Boss Jaan, kya main camera on karoon?
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsCameraPromptActive(false)} className="flex-1 py-4 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-700 transition-all">Nahi</button>
              <button onClick={handleToggleCamera} className="flex-1 py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest glow-cyan hover:bg-sky-500 transition-all">Haan, Zaroor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTutor;
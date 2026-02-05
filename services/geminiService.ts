import { GoogleGenAI, Type } from "@google/genai";
import { OrganType, ExamQuestion, GroundingLink } from "../types";
import { getUserProfile } from "./memoryService";
import { getSystemPrompt } from "./promptService";

export interface FileData {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

// System prompt is now loaded dynamically from promptService
// This allows Super Admin to customize it via the admin panel

const cleanJsonResponse = (text: string): string => {
  // Remove common markdown fences first
  let cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Try to isolate the main JSON blob if there is extra explanation text
  const firstCurly = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  if (firstCurly !== -1 && firstBracket !== -1) {
    start = Math.min(firstCurly, firstBracket);
  } else {
    start = firstCurly !== -1 ? firstCurly : firstBracket;
  }

  if (start > 0) {
    cleaned = cleaned.slice(start);
  }

  // Heuristic: trim anything before the last closing brace/bracket
  const lastCurly = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  let end = -1;
  if (lastCurly !== -1 && lastBracket !== -1) {
    end = Math.max(lastCurly, lastBracket);
  } else {
    end = lastCurly !== -1 ? lastCurly : lastBracket;
  }

  if (end !== -1 && end + 1 < cleaned.length) {
    cleaned = cleaned.slice(0, end + 1);
  }

  return cleaned.trim();
};

const repairJson = (jsonString: string): string => {
  let repaired = jsonString.trim();
  // basic fix for cut off strings (common issue)
  if (repaired.match(/"[^"]*$/)) repaired += '"';

  // Close unclosed braces/brackets based on stack count
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;

  repaired += '}'.repeat(Math.max(0, openBraces - closeBraces));
  repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets));

  return repaired;
};

export const getTutorResponse = async (
  userPrompt: string,
  history: { role: string, content: string }[],
  files?: FileData[],
  mode: 'complex' | 'fast' | 'standard' = 'standard'
) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  // DETECT INTENT
  const hasUrl = userPrompt.includes('http') || userPrompt.includes('www') || userPrompt.toLowerCase().includes('.com');
  const isBusiness = userPrompt.toLowerCase().includes('business') || userPrompt.toLowerCase().includes('lead') || userPrompt.toLowerCase().includes('market');
  const isMapRequest = userPrompt.toLowerCase().includes('location') || userPrompt.toLowerCase().includes('nearby') || userPrompt.toLowerCase().includes('map');

  // MODEL SELECTION STRATEGY
  let modelName = 'gemini-3-flash-preview';

  if (hasUrl || isBusiness) {
    // Force 2.5 Flash for Business/URL tasks as it handles Search Grounding best for extraction
    modelName = 'gemini-2.5-flash';
  } else if (isMapRequest) {
    modelName = 'gemini-2.5-flash';
  } else if (mode === 'complex' || (files && files.length > 0)) {
    modelName = 'gemini-3-pro-preview';
  } else if (mode === 'fast') {
    // Only use lite for very simple chat, never for business/urls
    modelName = 'gemini-flash-lite-latest';
  }

  try {
    let finalPrompt = userPrompt || "Aapke liye haazir hoon Boss Jaan!";

    // FETCH MEMORY CONTEXT (gracefully handle if backend is not running)
    try {
      const { profile } = await getUserProfile();
      if (profile) {
        const memoryContext = `
[USER MEMORY]:
- Name: ${profile.name || 'Boss Jaan'}
- Interests: ${profile.interests?.join(', ') || 'N/A'}
- Goals: ${profile.goals?.join(', ') || 'N/A'}
- Level: ${profile.skill_level || 'N/A'}
- Business: ${profile.business_type || 'N/A'}
- Personality: ${profile.personality_type || 'N/A'}
- Preferred Language: ${profile.preferred_language || 'Hinglish'}
`;
        finalPrompt = memoryContext + "\n\n" + finalPrompt;
      }
    } catch (profileError) {
      // Backend not running - continue without profile context
      console.warn('User profile not available (backend may not be running):', profileError);
    }

    // Prompt Engineering for Website Analysis
    if (hasUrl) {
      finalPrompt += " \n\n[INSTRUCTION]: Perform a deep Google Search on this URL. Extract REAL details: USP, Competitors, and Contact Info. Do not guess.";
    }

    const parts: any[] = [{ text: finalPrompt }];
    if (files && files.length > 0) {
      files.forEach(file => parts.push(file));
    }

    const config: any = {
      systemInstruction: getSystemPrompt(),
      // responseMimeType: "application/json", <--- REMOVED
      // Always enable search for better accuracy
      tools: [{ googleSearch: {} }],
      // High token limit to prevent JSON cut-off
      maxOutputTokens: 8192,
      // responseSchema: ... <--- REMOVED
    };


    // Use Maps tool if requested
    if (isMapRequest) {
      config.tools.push({ googleMaps: {} });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: 'user', parts }
      ],
      config
    });

    const rawText = response.text || "";
    // Robust cleaning to handle potential markdown
    let cleanText = cleanJsonResponse(rawText);

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (jsonError) {
      console.warn("JSON Parse failed, attempting repair...");
      // Attempt repair
      try {
        const repaired = repairJson(cleanText);
        parsed = JSON.parse(repaired);
      } catch (repairError) {
        console.error("JSON Repair failed:", repairError);
        // Fallback for completely broken JSON
        return {
          explanation: "Boss Jaan, data extract karte waqt signal weak ho gaya. Please website link dobara check karein.",
          suggestedModel: 'none',
          voiceOutput: "Data packet corrupted, Boss. Retrying is recommended.",
          imagePrompt: ""
        };
      }
    }

    // Extract Grounding (Search/Maps)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      const links: GroundingLink[] = groundingChunks
        .map((chunk: any) => {
          if (chunk.web) return { title: chunk.web.title, url: chunk.web.uri };
          if (chunk.maps) return { title: chunk.maps.title, url: chunk.maps.uri };
          return null;
        })
        .filter(Boolean) as GroundingLink[];
      parsed.groundingLinks = links;
    }

    return parsed;
  } catch (error: any) {
    console.error("Dr. Chinki Logic Error:", error);
    
    // Check for API key errors
    if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('API key')) {
      return {
        explanation: "Boss Jaan, API key me issue hai. Please check karein ki API key valid hai aur leaked nahi hui. Naya API key set karein.",
        suggestedModel: 'none',
        voiceOutput: "API authentication failed. Please update the API key.",
        imagePrompt: "",
        cameraPermissionRequested: false
      };
    }
    
    // Check for network errors
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return {
        explanation: "Boss Jaan, network connection me issue hai. Internet check karein aur phir se try karein.",
        suggestedModel: 'none',
        voiceOutput: "Network connection error. Please check your internet.",
        imagePrompt: "",
        cameraPermissionRequested: false
      };
    }
    
    // Generic error
    return {
      explanation: "Boss Jaan, technical glitch aaya hai. Shayad server busy hai. Thodi der baad phir se try karein.",
      suggestedModel: 'none',
      voiceOutput: "System overload. Please try again.",
      imagePrompt: "",
      cameraPermissionRequested: false
    };
  }
};

export const getQuizQuestions = async (topic: string): Promise<ExamQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate 5 high - quality NEET - style multiple - choice questions for medical revision on the topic: ${topic}. Format the output as a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of 4 options'
              },
              correctIndex: {
                type: Type.INTEGER,
                description: '0-based index of the correct option'
              },
              explanation: { type: Type.STRING }
            },
            required: ['question', 'options', 'correctIndex', 'explanation']
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Quiz Generation Error:", e);
    return [];
  }
};

export const transcribeAudio = async (base64Audio: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType: 'audio/mp3' } },
          { text: "Transcribe this audio accurately. If it is in Hindi/Hinglish, write it as spoken." }
        ]
      }
    });
    return response.text;
  } catch (e) {
    return null;
  }
};

export const generateMedicalImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Hyper - realistic medical scene: ${prompt} ` }] },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data: image / png; base64, ${part.inlineData.data} ` : null;
  } catch (error) { return null; }
};

export const generateVeoVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  base64Image?: string
): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

    const payload: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio,
      },
    };

    if (base64Image) {
      payload.image = {
        imageBytes: base64Image,
        mimeType: 'image/jpeg',
      };
    }

    let operation = await ai.models.generateVideos(payload);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (downloadLink) {
      const response = await fetch(`${downloadLink}& key=${import.meta.env.VITE_API_KEY} `);
      if (response.ok) {
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
      } else {
        console.error("Failed to download video:", response.statusText);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("VEO Video Generation Error:", error);
    return null;
  }
};
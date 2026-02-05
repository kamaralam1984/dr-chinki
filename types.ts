
export type OrganType = 'heart' | 'brain' | 'cell' | 'kidney' | 'skeleton' | 'none';

export interface GroundingLink {
  title: string;
  url: string;
}

export interface BusinessAnalysis {
  companyName: string;
  marketNiche: string;
  usp: string;
  competitors: string[];
  growthStrategy: string;
  potentialLeads: {
    name: string;
    source: string;
    contactStatus: 'Found' | 'Calling' | 'Emailed' | 'Agreed';
    platform: string;
  }[];
}

export interface DocumentAnalysis {
  originalText?: string;
  cleanedHindiText: string;
  title?: string;
  summary: string;
  formattingStyle: string;
}

export interface ParanormalAnalysis {
  emfLevel: number;
  tempCelsius: number;
  soundDb: number;
  motionDetected: boolean;
  scientificVerdict: string;
  possibleSources: string[];
  safetyStatus: 'Safe' | 'Unusual' | 'Anomalous';
}

export interface TreatmentPlan {
  diagnosis: string;
  recommendedMedicine: string[];
  lifestyleAdvice: string[];
  spiritualCure?: string;
  scripturalReference?: string;
  emergencyWarnings?: string[];
  reportAnalysis?: {
    parameter: string;
    value: string;
    status: 'Normal' | 'Critical' | 'Warning';
    symbolDetected?: string;
    insight: string;
  }[];
}

export interface FaceAnalysis {
  personalityTraits: string[];
  healthInsights: string;
  destinyReading: string;
  specialMessageForBoss?: string;
}

export interface StoryScene {
  sceneNumber: number;
  title?: string;
  text: string; 
  visualAction: string; 
  imagePrompt: string;
  videoPrompt: string;
  soundMusicPrompt: string;
  estimatedDurationSeconds: number;
  generatedVideoUrl?: string;
}

export interface StoryBoard {
  title: string;
  genre: 'Horror' | 'Kids' | 'Love' | 'Influencer' | 'Fact' | 'Medical' | 'General';
  targetDurationMinutes: number;
  actualDurationSeconds: number;
  scenes: StoryScene[];
  scriptSummary: string;
}

export interface WebAnalysis {
  siteName: string;
  logicDescription: string;
  primaryFunction: string;
  technicalStructure: string[];
  businessLogic: string;
}

export interface YoutubeAnalysis {
  predictedViews: string;
  viralIndex: number;
  viralHacks: string[];
  thumbnailAdvice: string;
  hookAdvice: string;
  videoTranscript?: string; 
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestedModel?: OrganType;
  groundingLinks?: GroundingLink[];
  youtubeAnalysis?: YoutubeAnalysis;
  webAnalysis?: WebAnalysis;
  storyBoard?: StoryBoard;
  faceAnalysis?: FaceAnalysis;
  treatmentPlan?: TreatmentPlan;
  paranormalAnalysis?: ParanormalAnalysis;
  documentAnalysis?: DocumentAnalysis;
  businessAnalysis?: BusinessAnalysis;
}

export interface OrganDetail {
  id: string;
  name: string;
  function: string;
  neetFact: string;
  position: [number, number, number];
  zoomTarget?: number;
}

export interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

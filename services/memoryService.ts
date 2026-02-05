/**
 * Memory Service
 * Communicates with Python backend to save and retrieve memories
 */

const API_BASE_URL = 'http://localhost:5000/api/memory';

export interface Memory {
    id?: number;
    type: 'text' | 'image' | 'mixed';
    content?: string;
    image_path?: string;
    name: string;
    timestamp?: string;
    metadata?: Record<string, any>;
    recognition_data?: {
        type?: 'person' | 'object';
        description?: string;
        features?: string[];
        analyzed_at?: string;
    };
    voice_data?: {
        speech_patterns?: {
            sample_text?: string;
            word_count?: number;
            common_words?: string[];
            language_style?: string;
        };
        recorded_at?: string;
    };
    audio_path?: string;
}

export interface UserProfile {
    name?: string;
    interests: string[];
    goals: string[];
    skill_level?: string;
    business_type?: string;
    preferred_language?: string;
    personality_type?: string;
}

export interface SaveMemoryResponse {
    success: boolean;
    message: string;
    memory_id?: number;
    name?: string;
}

export interface ListMemoriesResponse {
    success: boolean;
    count: number;
    memories: Memory[];
}

export interface SearchMemoriesResponse {
    success: boolean;
    count: number;
    query: string;
    memories: Memory[];
}

/**
 * Save a new memory to the database
 */
export async function saveMemory(
    text: string,
    imageBase64?: string,
    name?: string,
    metadata?: Record<string, any>,
    recognitionData?: any,
    audioBase64?: string
): Promise<SaveMemoryResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                image: imageBase64,
                audio: audioBase64,
                name: name || 'Unnamed Memory',
                metadata: metadata || {},
                recognition_data: recognitionData,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving memory:', error);
        return {
            success: false,
            message: `Failed to save memory: ${error}`,
        };
    }
}

/**
 * Retrieve all memories from the database
 */
export async function getMemories(): Promise<ListMemoriesResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/list`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error retrieving memories:', error);
        return {
            success: false,
            count: 0,
            memories: [],
        };
    }
}

/**
 * Search memories by text query
 */
export async function searchMemories(query: string): Promise<SearchMemoriesResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error searching memories:', error);
        return {
            success: false,
            count: 0,
            query,
            memories: [],
        };
    }
}

/**
 * Delete a memory by ID
 */
export async function deleteMemory(memoryId: number): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/delete/${memoryId}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting memory:', error);
        return {
            success: false,
            message: `Failed to delete memory: ${error}`,
        };
    }
}

/**
 * Get image URL for a memory
 */
export function getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    const filename = imagePath.split('/').pop();
    return `http://localhost:5000/api/memory/image/${filename}`;
}

/**
 * Recognize a person/object from description
 */
export async function recognizeFromDescription(description: string): Promise<{
    success: boolean;
    found: boolean;
    name?: string;
    similarity?: number;
    message?: string;
}> {
    try {
        const response = await fetch(`${API_BASE_URL}/recognize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error recognizing from description:', error);
        return {
            success: false,
            found: false,
            message: `Failed to recognize: ${error}`,
        };
    }
}

/**
 * Save voice profile for a person
 */
export async function saveVoiceProfile(name: string, speechSample: string): Promise<SaveMemoryResponse> {
    try {
        const response = await fetch('http://localhost:5000/api/voice/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                speech_sample: speechSample,
            }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving voice profile:', error);
        return {
            success: false,
            message: `Failed to save voice profile: ${error}`,
        };
    }
}

/**
 * Recognize speaker from speech sample
 */
export async function recognizeVoice(speechSample: string): Promise<{
    success: boolean;
    found: boolean;
    name?: string;
    similarity?: number;
    confidence?: string;
    message?: string;
}> {
    try {
        const response = await fetch('http://localhost:5000/api/voice/recognize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                speech_sample: speechSample,
            }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error recognizing voice:', error);
        return {
            success: false,
            found: false,
            message: `Failed to recognize voice: ${error}`,
        };
    }
}

/**
 * Get the user profile from the backend
 */
export async function getUserProfile(): Promise<{ success: boolean; profile: UserProfile | null }> {
    try {
        const response = await fetch('http://localhost:5000/api/user/profile');
        if (!response.ok) {
            // Backend not running or error - return gracefully
            return { success: false, profile: null };
        }
        const data = await response.json();
        return data;
    } catch (error) {
        // Backend not running - silently fail and return null profile
        // This is expected if backend is not running
        return { success: false, profile: null };
    }
}

/**
 * Save or update the user profile
 */
export async function saveUserProfile(profile: UserProfile): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch('http://localhost:5000/api/user/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profile),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving user profile:', error);
        return { success: false, message: `Failed to save profile: ${error}` };
    }
}

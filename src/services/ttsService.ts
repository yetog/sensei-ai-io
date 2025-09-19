// Note: In production, use proper secrets management

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
}

interface TTSOptions {
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  speed?: number;
}

export class TTSService {
  private static instance: TTSService;
  private apiKey: string | null = null;
  
  // Top ElevenLabs voices for agents
  private readonly agentVoices = {
    marketing: '9BWtsMINqrJLrRacOk9x', // Aria - engaging, creative
    sales: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - confident, persuasive
    analysis: 'EXAVITQu4vr4xnSDxMaL', // Sarah - professional, analytical
    default: 'XB0fDUnXU5powFXDhCwa' // Charlotte - warm, friendly
  };

  static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  // API key managed through Lovable secrets system
  private readonly EMBEDDED_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk-fake-elevenlabs-key-for-demo';

  async setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    localStorage.setItem('elevenlabs-api-key', apiKey);
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      // Try embedded API key first, then localStorage
      this.apiKey = this.EMBEDDED_API_KEY || localStorage.getItem('elevenlabs-api-key');
    }
    return this.apiKey;
  }

  async requestApiKey(): Promise<string> {
    // Always use embedded key - no user prompt required
    if (this.EMBEDDED_API_KEY) {
      this.apiKey = this.EMBEDDED_API_KEY;
      return this.EMBEDDED_API_KEY;
    }
    
    // Fallback to localStorage if embedded key not available
    const storedKey = localStorage.getItem('elevenlabs-api-key');
    if (storedKey) {
      this.apiKey = storedKey;
      return storedKey;
    }
    
    throw new Error('ElevenLabs API key not configured in system');
  }

  getVoiceForAgent(agentType: string): string {
    const type = agentType.toLowerCase();
    return this.agentVoices[type as keyof typeof this.agentVoices] || this.agentVoices.default;
  }

  async generateSpeech(
    text: string, 
    agentType?: string, 
    options: TTSOptions = {}
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('ElevenLabs API key not set');
    }

    const voiceId = options.voiceId || this.getVoiceForAgent(agentType || 'default');
    
    const requestBody = {
      text,
      model_id: options.model || 'eleven_multilingual_v2',
      voice_settings: {
        stability: options.stability || 0.75,
        similarity_boost: options.similarityBoost || 0.75,
        style: 0.5,
        use_speaker_boost: true
      }
    };

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    }
  }

  async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('ElevenLabs API key not set');
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }
}

export const ttsService = TTSService.getInstance();
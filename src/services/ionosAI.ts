
import { IONOSAIRequest, IONOSAIResponse, IONOSImageRequest, IONOSImageResponse } from '@/types/chat';

const TEXT_ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";
const IMAGE_ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/images/generations";
const MODELS_ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/models";
const TEXT_MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct";

export class IONOSAIService {
  private apiToken: string | null = null;

  constructor() {
    this.apiToken = localStorage.getItem('ionos-api-token');
  }

  setApiToken(token: string) {
    this.apiToken = token;
    localStorage.setItem('ionos-api-token', token);
  }

  getApiToken(): string | null {
    return this.apiToken;
  }

  async getAvailableModels(): Promise<any> {
    if (!this.apiToken) {
      throw new Error('API token not set');
    }

    try {
      const response = await fetch(MODELS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('IONOS AI Models API Error:', error);
      throw error;
    }
  }

  async sendMessage(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> {
    if (!this.apiToken) {
      throw new Error('API token not set');
    }

    const request: IONOSAIRequest = {
      model: TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant specialized in helping with script writing, text-to-speech optimization, and creative writing. You provide concise, actionable advice for improving scripts and content.'
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    try {
      const response = await fetch(TEXT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: IONOSAIResponse = await response.json();
      return data.choices[0]?.message?.content || 'No response received';
    } catch (error) {
      console.error('IONOS AI API Error:', error);
      throw error;
    }
  }

  async generateImage(prompt: string, size: string = "1024x1024"): Promise<string> {
    if (!this.apiToken) {
      throw new Error('API token not set');
    }

    // Try to get available models and use the first image generation model
    let imageModel = "dall-e-3"; // fallback
    try {
      const models = await this.getAvailableModels();
      const imageModels = models.data?.filter((model: any) => 
        model.id.toLowerCase().includes('dall') || 
        model.id.toLowerCase().includes('image') ||
        model.id.toLowerCase().includes('diffusion')
      );
      if (imageModels && imageModels.length > 0) {
        imageModel = imageModels[0].id;
      }
    } catch (error) {
      console.warn('Could not fetch models, using fallback:', error);
    }

    const request: IONOSImageRequest = {
      model: imageModel,
      prompt: prompt,
      size: size
    };

    try {
      const response = await fetch(IMAGE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Image API request failed: ${response.status}`);
      }

      const data: IONOSImageResponse = await response.json();
      const base64Image = data.data[0]?.b64_json;
      
      if (!base64Image) {
        throw new Error('No image data received');
      }

      // Convert base64 to data URL
      return `data:image/png;base64,${base64Image}`;
    } catch (error) {
      console.error('IONOS Image API Error:', error);
      throw error;
    }
  }

  generateImagePromptFromScript(script: string): string {
    const words = script.trim().split(/\s+/).length;
    const excerpt = script.substring(0, 200) + (script.length > 200 ? '...' : '');
    
    return `Create a high-quality, professional image that visually represents this script content: "${excerpt}". Style: cinematic, detailed, professional photography or digital art.`;
  }
}

export const ionosAI = new IONOSAIService();

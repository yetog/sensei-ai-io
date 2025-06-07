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

  async getAvailableModels(): Promise<string[]> {
    const endpoint = 'https://openai.inference.de-txl.ionos.com/v1/models';
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Models API response:', response.status, response.statusText);
        const text = await response.text();
        console.error('Models API error text:', text);
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Available models:', data);
      
      // Filter for image generation models
      const imageModels = data.data?.filter((model: any) => 
        model.id?.includes('dall-e') || 
        model.id?.includes('imagen') || 
        model.id?.includes('image') ||
        model.id?.includes('stable-diffusion')
      ).map((model: any) => model.id) || [];
      
      console.log('Image models found:', imageModels);
      return imageModels;
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
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

  async generateImage(prompt: string, size: string = '1024x1024'): Promise<string> {
    console.log('Starting image generation with prompt:', prompt);
    
    if (!this.apiToken) {
      throw new Error('API token not set');
    }

    // First, try to get available models
    const availableModels = await this.getAvailableModels();
    console.log('Available image models:', availableModels);
    
    // Use the first available image model, or fallback to a common one
    let model = availableModels.length > 0 ? availableModels[0] : 'dall-e-3';
    
    // Try some common IONOS image model names if none found
    if (availableModels.length === 0) {
      const commonModels = ['dall-e-3', 'dall-e-2', 'stable-diffusion-xl', 'imagen'];
      model = commonModels[0];
      console.log('No image models found, trying fallback:', model);
    }

    const endpoint = 'https://openai.inference.de-txl.ionos.com/v1/images/generations';
    
    const requestBody = {
      model: model,
      prompt: prompt,
      size: size,
      n: 1,
      response_format: 'b64_json'
    };

    console.log('Image generation request:', {
      endpoint,
      model,
      prompt: prompt.substring(0, 100) + '...',
      size
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Image API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 404) {
          throw new Error(`Image model "${model}" not found. Please check available models.`);
        } else if (response.status === 401) {
          throw new Error('Invalid API token for image generation');
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${errorText}`);
        } else {
          throw new Error(`Image generation failed: ${response.statusText} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Image generation response:', {
        hasData: !!data.data,
        dataLength: data.data?.length,
        usage: data.usage
      });

      if (!data.data || data.data.length === 0) {
        throw new Error('No image data received from API');
      }

      const base64Image = data.data[0].b64_json;
      if (!base64Image) {
        throw new Error('No base64 image data in response');
      }

      // Convert base64 to data URL
      const imageUrl = `data:image/png;base64,${base64Image}`;
      console.log('Image generated successfully, data URL length:', imageUrl.length);
      
      return imageUrl;
    } catch (error) {
      console.error('Image generation error:', error);
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

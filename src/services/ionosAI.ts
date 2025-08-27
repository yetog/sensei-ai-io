import { IONOSAIRequest, IONOSAIResponse, IONOSImageRequest, IONOSImageResponse } from '@/types/chat';

const TEXT_ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";
const IMAGE_ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/images/generations";
const MODELS_ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/models";
const TEXT_MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct";

export class IONOSAIService {
  private apiToken: string | null = null;
  private defaultToken = "eyJ0eXAiOiJKV1QiLCJraWQiOiI1MThkZmJmYS0zN2QwLTRiNWMtOTEyZC0wNDlkN2JiYWFmODUiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpb25vc2Nsb3VkIiwiaWF0IjoxNzU2MjU5MTAwLCJjbGllbnQiOiJVU0VSIiwiaWRlbnRpdHkiOnsiaXNQYXJlbnQiOmZhbHNlLCJjb250cmFjdE51bWJlciI6MzM5NzEwMzMsInJvbGUiOiJvd25lciIsInJlZ0RvbWFpbiI6Imlvbm9zLmNvbSIsInJlc2VsbGVySWQiOjEsInV1aWQiOiI3YmNiNzg4MS1hZDMxLTQxMDgtOGI3Zi0wOGIyNjdiYTI0ZWUiLCJwcml2aWxlZ2VzIjpbIkRBVEFfQ0VOVEVSX0NSRUFURSIsIlNOQVBTSE9UX0NSRUFURSIsIklQX0JMT0NLX1JFU0VSVkUiLCJNQU5BR0VfREFUQVBMQVRGT1JNIiwiQUNDRVNTX0FDVElWSVRZX0xPRyIsIlBDQ19DUkVBVEUiLCJBQ0NFU1NfUzNfT0JKRUNUX1NUT1JBR0UiLCJCQUNLVVBfVU5JVF9DUkVBVEUiLCJDUkVBVEVfSU5URVJORVRfQUNDRVNTIiwiSzhTX0NMVVNURVJfQ1JFQVRFIiwiRkxPV19MT0dfQ1JFQVRFIiwiQUNDRVNTX0FORF9NQU5BR0VfTU9OSVRPUklORyIsIkFDQ0VTU19BTkRfTUFOQUdFX0NFUlRJRklDQVRFUyIsIkFDQ0VTU19BTkRfTUFOQUdFX0xPR0dJTkciLCJNQU5BR0VfREJBQVMiLCJBQ0NFU1NfQU5EX01BTkFHRV9ETlMiLCJNQU5BR0VfUkVHSVNUUlkiLCJBQ0NFU1NfQU5EX01BTkFHRV9DRE4iLCJBQ0NFU1NfQU5EX01BTkFHRV9WUE4iLCJBQ0NFU1NfQU5EX01BTkFHRV9BUElfR0FURVdBWSIsIkFDQ0VTU19BTkRfTUFOQUdFX05HUyIsIkFDQ0VTU19BTkRfTUFOQUdFX0tBQVMiLCJBQ0NFU1NfQU5EX01BTkFHRV9ORVRXT1JLX0ZJTEVfU1RPUkFHRSIsIkFDQ0VTU19BTkRfTUFOQUdFX0FJX01PREVMX0hVQiIsIkNSRUFURV9ORVRXT1JLX1NFQ1VSSVRZX0dST1VQUyIsIkFDQ0VTU19BTkRfTUFOQUdFX0lBTV9SRVNPVVJDRVMiXX0sImV4cCI6MTc4Nzc5NTEwMH0.JUs7bZrmqZl23L1bFshjoQp9Ny6u4IieenOgUJps0wmrtidVQgpUwdv0jzqnvFw1p-Dx7yBYI4_2hxGTHbnd9kO__MCJPzZK7yYPz3e2z3GbB__KyAcW7XeEXaSNxA1uN4u1rm4XIyptAopqQL-6iEzmJpX2evm1C4663VrRqqmMIeA6JNbFZSf5kFUqGV1VlyO-lz4HSGCr8be6tmJ4UVJIfs678LbKbKteuhWuExJPR3IwprL16YPvT47TeNSkx0f4iRFFd2IjAn4ZeI9h60ZLDhgdH0E5q1FwfEZnVAdunIZJFlhpFTU0G7bPCVvYM5Hloum0cF8LCXmQk6DfLA";

  constructor() {
    this.apiToken = localStorage.getItem('ionos-api-token') || this.defaultToken;
  }

  setApiToken(token: string) {
    this.apiToken = token;
    localStorage.setItem('ionos-api-token', token);
  }

  getApiToken(): string | null {
    return this.apiToken || this.defaultToken;
  }

  async getAvailableModels(): Promise<string[]> {
    const endpoint = 'https://openai.inference.de-txl.ionos.com/v1/models';
    const token = this.apiToken || this.defaultToken;
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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

  async sendMessage(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, agentName?: string): Promise<string> {
    const token = this.apiToken || this.defaultToken;
    if (!token) {
      throw new Error('API token not set');
    }

    const systemPrompt = agentName && agentName !== "AI Assistant" 
      ? `You are ${agentName}, a specialized AI assistant. Maintain your role identity throughout the conversation and respond in a way that's consistent with your expertise. 

Format your responses with proper markdown for better readability:
- Use **bold** for important points and headings
- Use bullet points and numbered lists for organization
- Use proper line breaks and spacing
- Structure information clearly with headers when appropriate

Provide concise, actionable advice based on your specialization.`
      : `You are a helpful AI assistant capable of helping with a wide range of business and professional tasks. You are knowledgeable, professional, and adaptable to any topic or industry.

Format your responses with proper markdown for better readability:
- Use **bold** for important points and headings  
- Use bullet points and numbered lists for organization
- Use proper line breaks and spacing
- Structure information clearly with headers when appropriate

You can assist with:
- Business strategy and planning
- Content creation and editing  
- Analysis and research
- Problem-solving and recommendations
- General professional guidance

Provide clear, actionable advice tailored to the user's specific needs.`;

    const request: IONOSAIRequest = {
      model: TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
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
          'Authorization': `Bearer ${token}`,
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
    
    const token = this.apiToken || this.defaultToken;
    if (!token) {
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
          'Authorization': `Bearer ${token}`,
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

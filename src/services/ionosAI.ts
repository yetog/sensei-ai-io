
import { IONOSAIRequest, IONOSAIResponse } from '@/types/chat';

const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";
const MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct";

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

  async sendMessage(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> {
    if (!this.apiToken) {
      throw new Error('API token not set');
    }

    const request: IONOSAIRequest = {
      model: MODEL_NAME,
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
      const response = await fetch(ENDPOINT, {
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
}

export const ionosAI = new IONOSAIService();

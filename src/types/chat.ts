
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imagePrompt?: string;
  usedFiles?: string[]; // filenames used as context
  suggestions?: string[]; // suggested filenames when none matched
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
}

export interface IONOSAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface IONOSAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export interface IONOSImageRequest {
  model: string;
  prompt: string;
  size: string;
}

export interface IONOSImageResponse {
  data: Array<{
    b64_json: string;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

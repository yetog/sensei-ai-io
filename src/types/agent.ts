export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  temperature?: number; // 0 - 2
  model?: string;
  datasetIds?: string[];
  topK?: number;
  chunkSize?: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  agentType?: 'outbound' | 'retention' | 'telesales';
  specialization?: {
    industry?: string;
    products?: string[];
    expertise?: string[];
  };
}

export interface AgentPersonality {
  greetings: string[];
  responseStyle: 'formal' | 'casual' | 'technical' | 'consultative';
  conversationStarters: string[];
  expertise: string[];
  agentType: 'outbound' | 'retention' | 'telesales';
}

export interface CallContext {
  agentExperience: 'new' | 'intermediate' | 'senior';
  callType: 'inbound' | 'outbound' | 'retention';
  customerProfile?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    industry?: string;
    size?: string;
  };
  currentStage: 'discovery' | 'demo' | 'objection' | 'negotiation' | 'closing';
}

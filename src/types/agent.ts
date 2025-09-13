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
  agentType?: 'sales' | 'retention' | 'technical';
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
  agentType: 'sales' | 'retention' | 'technical';
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

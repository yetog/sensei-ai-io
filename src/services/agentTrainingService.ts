import { AgentConfig } from '@/types/agent';
import { datasetService } from './datasetService';
import { ionosAI } from './ionosAI';

export interface TrainingConversation {
  id: string;
  agentId: string;
  questions: Array<{ question: string; context?: string }>;
  responses: Array<{ response: string; quality: 'high' | 'medium' | 'low' }>;
  createdAt: string;
}

export interface AgentPersonality {
  conversationStarters: string[];
  greetingMessage: string;
  helpTopics: string[];
  responseStyle: {
    formality: 'casual' | 'professional' | 'formal';
    verbosity: 'concise' | 'detailed' | 'comprehensive';
    tone: 'friendly' | 'authoritative' | 'supportive' | 'enthusiastic';
  };
}

class AgentTrainingService {
  private readonly TRAINING_KEY = 'sensei:agentTraining';
  private readonly PERSONALITY_KEY = 'sensei:agentPersonalities';

  // Enhanced system prompts with examples and conversation starters
  getEnhancedSystemPrompt(agent: AgentConfig): string {
    const personality = this.getAgentPersonality(agent.id);
    const datasets = agent.datasetIds ? agent.datasetIds.map(id => datasetService.get(id)).filter(Boolean) : [];
    
    const basePrompt = agent.systemPrompt;
    const enhancedPrompt = `${basePrompt}

CONVERSATION APPROACH:
- Greeting: "${personality.greetingMessage}"
- Response Style: ${personality.responseStyle.tone}, ${personality.responseStyle.formality}, ${personality.responseStyle.verbosity}
- Maintain consistency with your specialized role throughout the conversation

AVAILABLE CONTEXT:
${datasets.length > 0 ? `You have access to ${datasets.length} dataset(s): ${datasets.map(d => d.name).join(', ')}` : 'No specific datasets loaded - use general knowledge'}

CONVERSATION STARTERS:
${personality.conversationStarters.map(starter => `- "${starter}"`).join('\n')}

HELP TOPICS YOU EXCEL AT:
${personality.helpTopics.map(topic => `- ${topic}`).join('\n')}

RESPONSE FORMATTING:
- Use proper markdown formatting
- Include relevant examples when helpful
- Cite sources when referencing uploaded content
- Keep responses focused and actionable
- Ask clarifying questions when needed

Remember: You are ${agent.name} - maintain your specialized expertise and personality throughout our conversation.`;

    return enhancedPrompt;
  }

  // Generate conversation starters based on agent role
  generateConversationStarters(agent: AgentConfig): string[] {
    const baseStarters = [
      "What would you like help with today?",
      "I'm here to assist with your questions.",
      "How can I support your goals?"
    ];

    // Role-specific starters based on agent name/prompt
    const roleSpecificStarters: Record<string, string[]> = {
      'marketing': [
        "Need help with a marketing campaign?",
        "Want to improve your content strategy?",
        "Looking to boost your social media presence?",
        "Ready to optimize your SEO approach?"
      ],
      'sales': [
        "Need help with lead generation?",
        "Want to improve your outreach strategy?",
        "Looking to optimize your sales funnel?",
        "Ready to craft compelling proposals?"
      ],
      'analyst': [
        "Need help analyzing your data?",
        "Want insights from your metrics?",
        "Looking to understand customer behavior?",
        "Ready to optimize your performance?"
      ]
    };

    // Detect role from agent name or prompt
    const agentText = `${agent.name} ${agent.systemPrompt}`.toLowerCase();
    const detectedRole = Object.keys(roleSpecificStarters).find(role => 
      agentText.includes(role)
    );

    return detectedRole ? 
      [...baseStarters, ...roleSpecificStarters[detectedRole]] : 
      baseStarters;
  }

  // Create default personality for agent
  createDefaultPersonality(agent: AgentConfig): AgentPersonality {
    const conversationStarters = this.generateConversationStarters(agent);
    
    return {
      conversationStarters,
      greetingMessage: `Hi! I'm ${agent.name}. I'm here to help you with your specific needs. What would you like to work on today?`,
      helpTopics: this.extractHelpTopics(agent.systemPrompt),
      responseStyle: {
        formality: 'professional',
        verbosity: 'detailed',
        tone: 'friendly'
      }
    };
  }

  // Extract help topics from system prompt
  private extractHelpTopics(systemPrompt: string): string[] {
    const defaultTopics = [
      'Answer questions about your documents',
      'Provide strategic recommendations',
      'Analyze content and data',
      'Generate actionable insights'
    ];

    // Extract topics mentioned in prompt
    const topicKeywords = [
      'marketing', 'sales', 'analysis', 'strategy', 'content',
      'SEO', 'social media', 'campaigns', 'leads', 'customers',
      'metrics', 'optimization', 'research', 'writing'
    ];

    const mentionedTopics = topicKeywords
      .filter(keyword => systemPrompt.toLowerCase().includes(keyword))
      .map(keyword => `Help with ${keyword} tasks`);

    return mentionedTopics.length > 0 ? mentionedTopics : defaultTopics;
  }

  // Get or create agent personality
  getAgentPersonality(agentId: string): AgentPersonality {
    try {
      const stored = localStorage.getItem(this.PERSONALITY_KEY);
      const personalities = stored ? JSON.parse(stored) : {};
      
      if (personalities[agentId]) {
        return personalities[agentId];
      }

      // Create default personality if none exists
      const agents = JSON.parse(localStorage.getItem('sensei:agents') || '[]');
      const agent = agents.find((a: AgentConfig) => a.id === agentId);
      
      if (agent) {
        const personality = this.createDefaultPersonality(agent);
        this.saveAgentPersonality(agentId, personality);
        return personality;
      }

      // Fallback personality
      return {
        conversationStarters: ["How can I help you today?"],
        greetingMessage: "Hi! I'm your AI assistant. How can I help you?",
        helpTopics: ["General assistance"],
        responseStyle: {
          formality: 'professional',
          verbosity: 'detailed',
          tone: 'friendly'
        }
      };
    } catch {
      return {
        conversationStarters: ["How can I help you today?"],
        greetingMessage: "Hi! I'm your AI assistant. How can I help you?",
        helpTopics: ["General assistance"],
        responseStyle: {
          formality: 'professional',
          verbosity: 'detailed',
          tone: 'friendly'
        }
      };
    }
  }

  // Save agent personality
  saveAgentPersonality(agentId: string, personality: AgentPersonality): void {
    try {
      const stored = localStorage.getItem(this.PERSONALITY_KEY);
      const personalities = stored ? JSON.parse(stored) : {};
      personalities[agentId] = personality;
      localStorage.setItem(this.PERSONALITY_KEY, JSON.stringify(personalities));
    } catch (error) {
      console.error('Failed to save agent personality:', error);
    }
  }

  // Pre-load agent context
  async preloadAgentContext(agent: AgentConfig): Promise<string> {
    if (!agent.datasetIds || agent.datasetIds.length === 0) {
      return '';
    }

    try {
      const datasets = agent.datasetIds
        .map(id => datasetService.get(id))
        .filter(Boolean);

      const contextSummary = datasets.map(dataset => {
        const fileCount = dataset.fileIds.length;
        return `Dataset "${dataset.name}" (${fileCount} files)`;
      }).join(', ');

      return `Available datasets: ${contextSummary}`;
    } catch (error) {
      console.error('Failed to preload agent context:', error);
      return '';
    }
  }

  // Get sample questions for agent training
  getSampleQuestions(agent: AgentConfig): string[] {
    const agentType = this.detectAgentType(agent);
    
    const sampleQuestions: Record<string, string[]> = {
      marketing: [
        "How can I improve my social media engagement?",
        "What's the best way to create compelling content?",
        "How do I optimize my SEO strategy?",
        "What are effective lead generation tactics?"
      ],
      sales: [
        "How can I write better cold outreach emails?",
        "What's the best way to handle objections?",
        "How do I qualify leads effectively?",
        "What are proven closing techniques?"
      ],
      analyst: [
        "How do I interpret these conversion metrics?",
        "What insights can you find in this data?",
        "How can I improve customer retention?",
        "What are the key performance indicators I should track?"
      ],
      general: [
        "Can you analyze this document for key insights?",
        "What are the main themes in my content?",
        "How can I improve this proposal?",
        "What recommendations do you have based on this data?"
      ]
    };

    return sampleQuestions[agentType] || sampleQuestions.general;
  }

  // Detect agent type from name/prompt
  private detectAgentType(agent: AgentConfig): string {
    const text = `${agent.name} ${agent.systemPrompt}`.toLowerCase();
    
    if (text.includes('market')) return 'marketing';
    if (text.includes('sales') || text.includes('lead')) return 'sales';
    if (text.includes('analy') || text.includes('data') || text.includes('metric')) return 'analyst';
    
    return 'general';
  }

  // Initialize agent on first use
  async initializeAgent(agent: AgentConfig): Promise<void> {
    try {
      // Ensure personality exists
      this.getAgentPersonality(agent.id);
      
      // Preload context
      await this.preloadAgentContext(agent);
      
      console.log(`Agent ${agent.name} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize agent ${agent.name}:`, error);
    }
  }
}

export const agentTrainingService = new AgentTrainingService();
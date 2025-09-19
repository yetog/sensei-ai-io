import { AgentConfig, AgentPersonality, CallContext } from '@/types/agent';
import { ionosAI } from './ionosAI';

export class SpecializedAgentService {
  private agentPersonalities: Record<string, AgentPersonality> = {
    sales: {
      greetings: [
        "I'm your AI Sales Specialist. Ready to help you close more deals!",
        "Sales AI here! Let's identify opportunities and overcome objections.",
        "Your sales coach is ready. What prospect are we working with today?"
      ],
      responseStyle: 'consultative',
      conversationStarters: [
        "What's the customer's main pain point?",
        "Have you identified their budget and timeline?",
        "What objections are they raising?",
        "Let's work on the value proposition."
      ],
      expertise: [
        'Lead qualification',
        'Value proposition development', 
        'Objection handling',
        'Closing techniques',
        'Upselling strategies',
        'Competitive positioning'
      ],
      agentType: 'outbound'
    },
    retention: {
      greetings: [
        "I'm your Retention Specialist. Let's keep your customers happy!",
        "Retention AI ready! How can we strengthen this customer relationship?",
        "Your retention coach here. What customer concerns are we addressing?"
      ],
      responseStyle: 'consultative',
      conversationStarters: [
        "What's driving the customer's churn risk?",
        "How can we add more value to their experience?",
        "What would make them stay long-term?",
        "Let's explore expansion opportunities."
      ],
      expertise: [
        'Churn prevention',
        'Customer success strategies',
        'Account expansion',
        'Relationship building',
        'Service recovery',
        'Loyalty programs'
      ],
      agentType: 'retention'
    },
    technical: {
      greetings: [
        "Technical Advisor AI at your service. Ready to solve complex problems!",
        "Your technical expert here. What implementation challenges are we tackling?",
        "Technical AI ready! Let's get into the details."
      ],
      responseStyle: 'technical',
      conversationStarters: [
        "What are their technical requirements?",
        "Do they have integration concerns?",
        "What's their current tech stack?",
        "Let's address their implementation questions."
      ],
      expertise: [
        'Technical requirements analysis',
        'Integration planning',
        'Implementation roadmaps',
        'Security and compliance',
        'Performance optimization',
        'Architecture recommendations'
      ],
      agentType: 'telesales'
    }
  };

  async getSpecializedResponse(
    agentType: 'sales' | 'retention' | 'technical',
    message: string,
    context: CallContext,
    conversationHistory: string[] = []
  ): Promise<{
    response: string;
    insights: string[];
    nextActions: string[];
    confidence: number;
  }> {
    const personality = this.agentPersonalities[agentType];
    const recentHistory = conversationHistory.slice(-5).join('\n');
    
    const systemPrompt = this.buildSpecializedPrompt(agentType, personality, context);
    
    const userPrompt = `
Context: ${JSON.stringify(context)}
Recent conversation: ${recentHistory}
Current message: ${message}

Please provide:
1. A specialized response based on my expertise
2. Key insights about the situation
3. Recommended next actions
4. Confidence level (0.0-1.0)

Respond in JSON format:
{
  "response": "Your specialized advice",
  "insights": ["insight1", "insight2"],
  "nextActions": ["action1", "action2"],
  "confidence": 0.85
}`;

    try {
      const aiResponse = await ionosAI.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Specialist`);

      return this.parseSpecializedResponse(aiResponse);
    } catch (error) {
      console.error(`${agentType} agent error:`, error);
      return this.getFallbackResponse(agentType, message);
    }
  }

  private buildSpecializedPrompt(
    agentType: 'sales' | 'retention' | 'technical',
    personality: AgentPersonality,
    context: CallContext
  ): string {
    const basePrompt = `You are a specialized AI ${agentType} assistant with deep expertise in ${personality.expertise.join(', ')}.

Your personality:
- Response style: ${personality.responseStyle}
- Agent type: ${agentType}
- Core expertise areas: ${personality.expertise.join(', ')}

Current context:
- Agent experience level: ${context.agentExperience}
- Call type: ${context.callType}
- Sales stage: ${context.currentStage}
- Customer sentiment: ${context.customerProfile?.sentiment || 'unknown'}

Guidelines:
1. Provide actionable, specific advice based on your specialization
2. Adapt complexity based on agent experience level
3. Focus on immediate next steps and long-term strategy
4. Be confident but acknowledge limitations
5. Use industry best practices and proven methodologies`;

    const specificGuidelines = {
      sales: `
Sales-specific focus:
- Always think about moving the deal forward
- Identify buying signals and objections
- Suggest specific qualifying questions
- Recommend value-based selling approaches
- Focus on ROI and business impact`,
      
      retention: `
Retention-specific focus:
- Prioritize customer success and satisfaction
- Look for expansion and upsell opportunities
- Address churn risks proactively
- Build long-term relationship strategies
- Focus on customer lifetime value`,
      
      technical: `
Technical-specific focus:
- Provide detailed technical guidance
- Address implementation and integration concerns
- Suggest best practices and standards
- Focus on scalability and security
- Bridge technical and business requirements`
    };

    return basePrompt + specificGuidelines[agentType];
  }

  private parseSpecializedResponse(response: string): {
    response: string;
    insights: string[];
    nextActions: string[];
    confidence: number;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response || 'Unable to generate response',
          insights: parsed.insights || [],
          nextActions: parsed.nextActions || [],
          confidence: parsed.confidence || 0.5
        };
      }
    } catch (error) {
      console.error('Failed to parse specialized response:', error);
    }

    // Fallback parsing
    return {
      response: response,
      insights: [],
      nextActions: [],
      confidence: 0.6
    };
  }

  private getFallbackResponse(
    agentType: 'sales' | 'retention' | 'technical',
    message: string
  ): {
    response: string;
    insights: string[];
    nextActions: string[];
    confidence: number;
  } {
    const fallbacks = {
      sales: {
        response: "Focus on understanding the customer's pain points and demonstrating clear ROI. Ask qualifying questions about budget, timeline, and decision-making process.",
        insights: ["Customer needs more qualification", "Focus on value proposition"],
        nextActions: ["Ask about budget", "Schedule demo", "Send case study"],
        confidence: 0.7
      },
      retention: {
        response: "Listen actively to understand their concerns. Focus on the value they're already receiving and explore ways to enhance their experience.",
        insights: ["Customer satisfaction at risk", "Need to reinforce value"],
        nextActions: ["Schedule check-in", "Offer training", "Explore expansion"],
        confidence: 0.7
      },
      technical: {
        response: "Gather detailed technical requirements and current state. Provide clear implementation path and address integration concerns.",
        insights: ["Technical complexity identified", "Need detailed requirements"],
        nextActions: ["Technical discovery call", "Provide documentation", "Architecture review"],
        confidence: 0.7
      }
    };

    return fallbacks[agentType];
  }

  getAgentPersonality(agentType: 'sales' | 'retention' | 'technical'): AgentPersonality {
    return this.agentPersonalities[agentType];
  }

  getRandomGreeting(agentType: 'sales' | 'retention' | 'technical'): string {
    const personality = this.agentPersonalities[agentType];
    const randomIndex = Math.floor(Math.random() * personality.greetings.length);
    return personality.greetings[randomIndex];
  }

  getConversationStarters(agentType: 'sales' | 'retention' | 'technical'): string[] {
    return this.agentPersonalities[agentType].conversationStarters;
  }

  // Agent experience detection based on conversation patterns
  detectAgentExperience(conversationHistory: string[]): 'new' | 'intermediate' | 'senior' {
    if (conversationHistory.length < 3) return 'new';
    
    const recentMessages = conversationHistory.slice(-10).join(' ').toLowerCase();
    
    // Advanced techniques indicate senior agent
    const seniorIndicators = [
      'roi calculation', 'value proposition', 'decision maker', 'competitive advantage',
      'implementation timeline', 'business impact', 'total cost of ownership'
    ];
    
    // Basic sales terms indicate intermediate
    const intermediateIndicators = [
      'pricing', 'features', 'benefits', 'demo', 'trial', 'contract'
    ];
    
    const seniorScore = seniorIndicators.filter(term => recentMessages.includes(term)).length;
    const intermediateScore = intermediateIndicators.filter(term => recentMessages.includes(term)).length;
    
    if (seniorScore >= 2) return 'senior';
    if (intermediateScore >= 3) return 'intermediate';
    return 'new';
  }

  // Dynamic suggestion complexity based on agent experience
  getComplexityLevel(agentExperience: 'new' | 'intermediate' | 'senior'): {
    suggestionDetail: 'basic' | 'detailed' | 'advanced';
    coachingStyle: 'step-by-step' | 'guided' | 'strategic';
  } {
    const complexityMap = {
      new: { suggestionDetail: 'basic' as const, coachingStyle: 'step-by-step' as const },
      intermediate: { suggestionDetail: 'detailed' as const, coachingStyle: 'guided' as const },
      senior: { suggestionDetail: 'advanced' as const, coachingStyle: 'strategic' as const }
    };
    
    return complexityMap[agentExperience];
  }
}

export const specializedAgents = new SpecializedAgentService();
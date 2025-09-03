import { ionosAI } from './ionosAI';

interface ConversationInsight {
  type: 'opportunity' | 'objection' | 'next_step' | 'warning' | 'buying_signal' | 'risk';
  title: string;
  message: string;
  action?: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  salesStage?: 'discovery' | 'demo' | 'objection' | 'negotiation' | 'closing';
  customerProfile?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    engagementLevel: 'low' | 'medium' | 'high';
    decisionStage: 'research' | 'evaluation' | 'consideration' | 'decision';
    personalityType?: 'analytical' | 'driver' | 'expressive' | 'amiable';
  };
}

interface ConversationContext {
  currentTopic: string;
  timeSpentOnTopics: Record<string, number>;
  totalDuration: number;
  customerMentions: {
    budget?: string;
    timeline?: string;
    teamSize?: string;
    currentSolution?: string;
    painPoints: string[];
    decisionMakers: string[];
  };
  salesProgress: {
    stage: string;
    confidence: number;
    nextBestAction: string;
  };
}

export class ConversationAnalyzer {
  private conversationHistory: string[] = [];
  private context: ConversationContext = {
    currentTopic: '',
    timeSpentOnTopics: {},
    totalDuration: 0,
    customerMentions: { painPoints: [], decisionMakers: [] },
    salesProgress: { stage: 'discovery', confidence: 0.5, nextBestAction: 'Ask qualifying questions' }
  };

  async analyzeConversation(transcript: string): Promise<ConversationInsight[]> {
    this.conversationHistory.push(transcript);
    
    // Keep only last 20 messages for context
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    const recentContext = this.conversationHistory.slice(-5).join(' ');
    
    try {
      const analysisPrompt = `
Analyze this sales conversation snippet for real-time insights:

Recent conversation: "${recentContext}"
Latest message: "${transcript}"

Provide analysis in this JSON format:
{
  "insights": [
    {
      "type": "opportunity|objection|next_step|warning|buying_signal|risk",
      "title": "Brief insight title",
      "message": "Detailed analysis",
      "action": "Specific recommended action",
      "confidence": 0.0-1.0,
      "priority": "low|medium|high|critical",
      "salesStage": "discovery|demo|objection|negotiation|closing"
    }
  ],
  "customerProfile": {
    "sentiment": "positive|neutral|negative",
    "engagementLevel": "low|medium|high",
    "decisionStage": "research|evaluation|consideration|decision",
    "personalityType": "analytical|driver|expressive|amiable"
  },
  "contextUpdate": {
    "currentTopic": "main topic being discussed",
    "painPoints": ["extracted pain points"],
    "budget": "budget information if mentioned",
    "timeline": "timeline if mentioned",
    "teamSize": "team size if mentioned"
  },
  "salesProgress": {
    "stage": "current sales stage",
    "confidence": 0.0-1.0,
    "nextBestAction": "recommended next step"
  }
}

Focus on actionable insights that will help the salesperson in real-time.`;

      const response = await ionosAI.sendMessage([
        { role: 'user', content: analysisPrompt }
      ], 'Sales Intelligence Analyst');

      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Conversation analysis error:', error);
      return this.getFallbackInsights(transcript);
    }
  }

  private parseAIResponse(response: string): ConversationInsight[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Update context
      if (analysis.contextUpdate) {
        this.updateContext(analysis.contextUpdate);
      }

      // Update customer profile
      if (analysis.customerProfile) {
        this.context.salesProgress = {
          ...this.context.salesProgress,
          ...analysis.salesProgress
        };
      }

      return analysis.insights || [];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  private updateContext(update: any): void {
    if (update.currentTopic) {
      this.context.currentTopic = update.currentTopic;
    }
    
    if (update.painPoints?.length) {
      this.context.customerMentions.painPoints = [
        ...new Set([...this.context.customerMentions.painPoints, ...update.painPoints])
      ];
    }

    if (update.budget) {
      this.context.customerMentions.budget = update.budget;
    }

    if (update.timeline) {
      this.context.customerMentions.timeline = update.timeline;
    }

    if (update.teamSize) {
      this.context.customerMentions.teamSize = update.teamSize;
    }
  }

  private getFallbackInsights(transcript: string): ConversationInsight[] {
    const insights: ConversationInsight[] = [];
    const lowerText = transcript.toLowerCase();

    // Enhanced keyword detection with context
    if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('expensive')) {
      insights.push({
        type: 'objection',
        title: 'Price Concern Detected',
        message: 'Customer mentioned pricing - focus on value proposition',
        action: 'Discuss ROI and value, not just price',
        confidence: 0.8,
        priority: 'high',
        salesStage: 'objection'
      });
    }

    if (lowerText.includes('when can') || lowerText.includes('timeline') || lowerText.includes('start')) {
      insights.push({
        type: 'buying_signal',
        title: 'Implementation Timeline Interest',
        message: 'Customer asking about timelines - strong buying signal',
        action: 'Provide clear implementation plan',
        confidence: 0.9,
        priority: 'critical',
        salesStage: 'closing'
      });
    }

    if (lowerText.includes('team') || lowerText.includes('people') || lowerText.includes('employees')) {
      insights.push({
        type: 'opportunity',
        title: 'Team Size Discussion',
        message: 'Customer mentioned team - explore enterprise features',
        action: 'Ask about team structure and collaboration needs',
        confidence: 0.7,
        priority: 'medium',
        salesStage: 'discovery'
      });
    }

    return insights;
  }

  getConversationContext(): ConversationContext {
    return this.context;
  }

  getSmartCoachingResponse(insight: ConversationInsight): string {
    const responses = {
      objection: [
        "Acknowledge their concern, then pivot to value: 'I understand price is important. Let me show you the ROI our clients typically see...'",
        "Use the feel-felt-found method: 'I understand how you feel. Other clients felt the same way until they found that our solution actually saved them money by...'",
        "Ask clarifying questions: 'When you mention cost, are you thinking about the upfront investment or the ongoing operational costs?'"
      ],
      buying_signal: [
        "Strike while the iron is hot! Ask for the close: 'It sounds like this solution would work well for you. When would be the best time to get started?'",
        "Create urgency: 'I'm excited you're interested! We have an opening in our implementation schedule next month. Should we reserve that spot?'",
        "Get commitment: 'What would need to happen for us to move forward with this?'"
      ],
      opportunity: [
        "Ask expansive questions: 'Tell me more about how your team currently handles this process...'",
        "Explore pain points: 'What challenges is your team facing with your current approach?'",
        "Position features: 'Given your team size, you'd really benefit from our collaboration features...'"
      ],
      warning: [
        "Address concerns directly: 'I sense some hesitation. What specific concerns can I help address?'",
        "Build confidence: 'Let me share how another client in your situation successfully implemented this...'",
        "Offer support: 'What additional information would help you feel more confident about this decision?'"
      ]
    };

    const categoryResponses = responses[insight.type] || responses.opportunity;
    const randomIndex = Math.floor(Math.random() * categoryResponses.length);
    return categoryResponses[randomIndex];
  }

  reset(): void {
    this.conversationHistory = [];
    this.context = {
      currentTopic: '',
      timeSpentOnTopics: {},
      totalDuration: 0,
      customerMentions: { painPoints: [], decisionMakers: [] },
      salesProgress: { stage: 'discovery', confidence: 0.5, nextBestAction: 'Ask qualifying questions' }
    };
  }
}

export const conversationAnalyzer = new ConversationAnalyzer();

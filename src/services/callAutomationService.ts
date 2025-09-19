import { SpecializedAgentService } from './specializedAgents';
import { ConversationAnalyzer } from './conversationAnalyzer';
import { CallContext } from '@/types/agent';

interface CallData {
  id: string;
  customerInfo: {
    name?: string;
    phone: string;
    email?: string;
    company?: string;
  };
  agentInfo: {
    name: string;
    type: 'outbound' | 'retention' | 'telesales';
  };
  audioTranscript: string;
  customerAudio: string;
  agentAudio: string;
  duration: number;
  timestamp: Date;
  outcome?: 'success' | 'follow_up' | 'no_interest';
}

interface AutomatedFollowUp {
  id: string;
  callId: string;
  summary: string;
  keyPoints: string[];
  customerConcerns: string[];
  nextActions: string[];
  followUpEmail: string;
  caseNotes: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  recommendedTimeline: string;
  priority: 'high' | 'medium' | 'low';
}

export class CallAutomationService {
  private static instance: CallAutomationService;
  private specializedAgent: SpecializedAgentService;
  private conversationAnalyzer: ConversationAnalyzer;

  private constructor() {
    this.specializedAgent = new SpecializedAgentService();
    this.conversationAnalyzer = new ConversationAnalyzer();
  }

  static getInstance(): CallAutomationService {
    if (!CallAutomationService.instance) {
      CallAutomationService.instance = new CallAutomationService();
    }
    return CallAutomationService.instance;
  }

  /**
   * Automatically generates comprehensive follow-up based on call data
   */
  async generateAutomatedFollowUp(callData: CallData): Promise<AutomatedFollowUp> {
    try {
      // Analyze the full conversation transcript
      const analysisInsights = await this.conversationAnalyzer.analyzeConversation(callData.audioTranscript);
      const conversationContext = this.conversationAnalyzer.getConversationContext();

      // Create context for specialized agent analysis
      const context: CallContext = {
        agentExperience: 'intermediate',
        callType: callData.agentInfo.type === 'outbound' ? 'outbound' : 'inbound',
        currentStage: this.determineCallStage(callData.audioTranscript),
        customerProfile: {
          sentiment: this.extractSentiment(analysisInsights),
          industry: callData.customerInfo.company ? 'business' : undefined
        }
      };

      // Get specialized insights based on agent type  
      const mappedAgentType = this.mapAgentType(callData.agentInfo.type);
      const specializedResponse = await this.specializedAgent.getSpecializedResponse(
        mappedAgentType,
        this.buildAnalysisPrompt(callData),
        context,
        [callData.audioTranscript]
      );

      // Generate follow-up email
      const followUpEmail = await this.generateFollowUpEmail(callData, analysisInsights, specializedResponse);

      // Create comprehensive case notes
      const caseNotes = this.generateCaseNotes(callData, analysisInsights, specializedResponse);

      return {
        id: `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callId: callData.id,
        summary: conversationContext.salesProgress.nextBestAction || 'Call summary generated',
        keyPoints: this.extractKeyPoints(analysisInsights),
        customerConcerns: conversationContext.customerMentions.painPoints || [],
        nextActions: specializedResponse.nextActions || [],
        followUpEmail,
        caseNotes,
        sentiment: this.extractSentiment(analysisInsights),
        recommendedTimeline: this.calculateFollowUpTimeline(this.extractSentiment(analysisInsights), conversationContext.salesProgress.confidence),
        priority: this.calculatePriority(this.extractSentiment(analysisInsights), specializedResponse.confidence || 0.5)
      };

    } catch (error) {
      console.error('Failed to generate automated follow-up:', error);
      throw new Error('Automated follow-up generation failed');
    }
  }

  /**
   * Processes real-time audio during call for live insights
   */
  async processRealTimeAudio(audioChunk: string, callContext: CallData): Promise<{
    insights: string[];
    suggestions: string[];
    objectionHandling?: string;
    productInfo?: string;
    technicalInfo?: string;
  }> {
    try {
      const context: CallContext = {
        agentExperience: 'intermediate',
        callType: callContext.agentInfo.type === 'outbound' ? 'outbound' : 'inbound',
        currentStage: this.determineCallStage(audioChunk),
        customerProfile: {
          sentiment: 'neutral'
        }
      };

      // Map agent types correctly
      const mappedAgentType = this.mapAgentType(callContext.agentInfo.type);
      
      const response = await this.specializedAgent.getSpecializedResponse(
        mappedAgentType,
        `Provide real-time coaching for: "${audioChunk}"`,
        context,
        []
      );

      return {
        insights: response.insights || [],
        suggestions: response.nextActions || [],
        objectionHandling: response.response.includes('objection') ? response.response : undefined,
        productInfo: response.response.includes('product') ? response.response : undefined,
        technicalInfo: response.response.includes('technical') ? response.response : undefined
      };

    } catch (error) {
      console.error('Real-time audio processing failed:', error);
      return {
        insights: [],
        suggestions: []
      };
    }
  }

  private mapAgentType(agentType: 'outbound' | 'retention' | 'telesales'): 'sales' | 'retention' | 'technical' {
    switch (agentType) {
      case 'outbound':
        return 'sales';
      case 'retention':
        return 'retention';
      case 'telesales':
        return 'technical';
      default:
        return 'sales';
    }
  }

  private extractSentiment(insights: any[]): 'positive' | 'neutral' | 'negative' {
    if (!insights || !Array.isArray(insights)) return 'neutral';
    
    const buyingSignals = insights.filter(i => i.type === 'buying_signal').length;
    const objections = insights.filter(i => i.type === 'objection').length;
    const warnings = insights.filter(i => i.type === 'warning').length;

    if (buyingSignals > objections + warnings) return 'positive';
    if (objections + warnings > buyingSignals) return 'negative';
    return 'neutral';
  }

  private extractKeyPoints(insights: any[]): string[] {
    if (!insights || !Array.isArray(insights)) return [];
    
    return insights
      .filter(i => i.type === 'opportunity' || i.type === 'buying_signal')
      .map(i => i.title || i.message)
      .slice(0, 5);
  }

  private buildAnalysisPrompt(callData: CallData): string {
    return `
      Analyze this sales call and provide comprehensive insights:
      
      Call Details:
      - Customer: ${callData.customerInfo.name || 'Unknown'} (${callData.customerInfo.phone})
      - Company: ${callData.customerInfo.company || 'Not specified'}
      - Agent: ${callData.agentInfo.name} (${callData.agentInfo.type})
      - Duration: ${Math.floor(callData.duration / 60)} minutes
      
      Full Conversation:
      ${callData.audioTranscript}
      
      Please provide:
      1. Key objections raised and how they were handled
      2. Customer interest level and buying signals
      3. Technical or product questions that came up
      4. Recommended next steps
      5. Areas where the agent could improve
    `;
  }

  private async generateFollowUpEmail(
    callData: CallData, 
    analysis: any[], 
    specializedResponse: any
  ): Promise<string> {
    const emailPrompt = `
      Generate a professional follow-up email based on this call:
      
      Customer: ${callData.customerInfo.name || 'Valued Customer'}
      Company: ${callData.customerInfo.company || ''}
      
      Call Summary: Generated automatically
      Key Points Discussed: ${this.extractKeyPoints(analysis).join(', ') || 'Various topics'}
      Customer Concerns: ${analysis.map(i => i.type === 'objection' ? i.message : '').filter(Boolean).join(', ') || 'None noted'}
      
      Create a personalized, professional email that:
      - References specific points from our conversation
      - Addresses their concerns
      - Provides clear next steps
      - Maintains a consultative tone
    `;

    try {
      const mappedAgentType = this.mapAgentType(callData.agentInfo.type);
      const emailResponse = await this.specializedAgent.getSpecializedResponse(
        mappedAgentType,
        emailPrompt,
        {
          agentExperience: 'senior',
          callType: 'outbound',
          currentStage: 'closing',
          customerProfile: { sentiment: this.extractSentiment(analysis) }
        },
        []
      );

      return emailResponse.response || this.generateDefaultEmail(callData, analysis);
    } catch {
      return this.generateDefaultEmail(callData, analysis);
    }
  }

  private generateDefaultEmail(callData: CallData, analysis: any[]): string {
    return `
Subject: Thank you for your time today - Next steps

Dear ${callData.customerInfo.name || 'Valued Customer'},

Thank you for taking the time to speak with me today. I wanted to follow up on our conversation and provide you with the information we discussed.

Key points from our call:
${this.extractKeyPoints(analysis).map((topic: string) => `• ${topic}`).join('\n') || '• Various topics discussed'}

Next steps:
• I will follow up with additional information

Please don't hesitate to reach out if you have any questions or need clarification on anything we discussed.

Best regards,
${callData.agentInfo.name}
    `.trim();
  }

  private generateCaseNotes(callData: CallData, analysis: any[], specializedResponse: any): string {
    return `
CALL RECORD - ${new Date(callData.timestamp).toLocaleDateString()}

Customer: ${callData.customerInfo.name || 'Unknown'} (${callData.customerInfo.phone})
Company: ${callData.customerInfo.company || 'Not specified'}
Agent: ${callData.agentInfo.name} (${callData.agentInfo.type})
Duration: ${Math.floor(callData.duration / 60)} minutes
Sentiment: ${this.extractSentiment(analysis)}

SUMMARY:
Call completed successfully

KEY DISCUSSION POINTS:
${this.extractKeyPoints(analysis).map((topic: string) => `• ${topic}`).join('\n') || '• No specific topics recorded'}

CUSTOMER CONCERNS:
${analysis.filter(i => i.type === 'objection').map((concern) => `• ${concern.message}`).join('\n') || '• No major concerns raised'}

OBJECTIONS HANDLED:
${analysis.filter(i => i.type === 'objection').length > 0 ? 'Objections addressed during call' : 'No significant objections'}

NEXT ACTIONS:
${specializedResponse.nextActions?.map((action: string) => `• ${action}`).join('\n') || '• Follow up as needed'}

AGENT PERFORMANCE:
• Confidence Level: ${Math.round((specializedResponse.confidence || 0.5) * 100)}%
• Areas for Improvement: Continue current approach

FOLLOW-UP SCHEDULED: ${this.calculateFollowUpTimeline(this.extractSentiment(analysis), specializedResponse.confidence || 0.5)}
    `.trim();
  }

  private determineCallStage(transcript: string): 'discovery' | 'demo' | 'objection' | 'negotiation' | 'closing' {
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('price') || lowerTranscript.includes('cost') || lowerTranscript.includes('budget')) {
      return 'negotiation';
    }
    if (lowerTranscript.includes('concern') || lowerTranscript.includes('but') || lowerTranscript.includes('however')) {
      return 'objection';
    }
    if (lowerTranscript.includes('demo') || lowerTranscript.includes('show') || lowerTranscript.includes('example')) {
      return 'demo';
    }
    if (lowerTranscript.includes('next steps') || lowerTranscript.includes('move forward') || lowerTranscript.includes('decision')) {
      return 'closing';
    }
    
    return 'discovery';
  }

  private calculateFollowUpTimeline(sentiment: string, confidence: number): string {
    if (sentiment === 'positive') {
      return confidence > 0.7 ? 'Within 24 hours' : 'Within 2-3 days';
    }
    if (sentiment === 'negative') {
      return 'Within 1 week (soft approach)';
    }
    return 'Within 3-5 days';
  }

  private calculatePriority(sentiment: string, confidence: number): 'high' | 'medium' | 'low' {
    if (sentiment === 'positive' && confidence > 0.7) return 'high';
    if (sentiment === 'negative' || confidence < 0.3) return 'low';
    return 'medium';
  }
}

export const callAutomationService = CallAutomationService.getInstance();
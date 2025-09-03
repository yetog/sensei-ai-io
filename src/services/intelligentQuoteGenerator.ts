import { gammaAI, GammaAIService } from './gammaAI';
import { conversationAnalyzer } from './conversationAnalyzer';
import { ionosAI } from './ionosAI';

interface EnhancedQuoteRequest {
  conversationContext: string;
  customerInfo?: {
    company?: string;
    industry?: string;
    size?: string;
  };
  callNotes: string;
  detectedNeeds?: string[];
  timeline?: string;
  budget?: string;
}

interface IntelligentQuote {
  id: string;
  type: 'standard' | 'gamma_presentation';
  content: any; // Standard quote or Gamma presentation
  recommendations: string[];
  nextActions: string[];
  confidenceScore: number;
  generatedAt: Date;
}

export class IntelligentQuoteGenerator {
  async generateIntelligentQuote(request: EnhancedQuoteRequest): Promise<IntelligentQuote> {
    // Analyze the conversation context to extract structured data
    const analysis = await this.analyzeQuoteContext(request);
    
    // Determine if we should use Gamma AI or standard quote generation
    const shouldUseGamma = gammaAI.isConfigured() && analysis.complexity > 0.6;
    
    if (shouldUseGamma) {
      return this.generateGammaQuote(request, analysis);
    } else {
      return this.generateStandardQuote(request, analysis);
    }
  }

  private async analyzeQuoteContext(request: EnhancedQuoteRequest): Promise<any> {
    const analysisPrompt = `
Analyze this sales conversation context and extract structured quote information:

Conversation Context: "${request.conversationContext}"
Call Notes: "${request.callNotes}"
Customer: ${request.customerInfo?.company || 'Unknown'}
Industry: ${request.customerInfo?.industry || 'Unknown'}

Extract and provide in JSON format:
{
  "extractedInfo": {
    "painPoints": ["list of pain points mentioned"],
    "requirements": ["specific requirements discussed"],
    "budget": "budget information if mentioned",
    "timeline": "timeline if mentioned",
    "decisionMakers": ["people involved in decision"],
    "competitorsMentioned": ["competing solutions discussed"],
    "urgency": "low|medium|high",
    "teamSize": "size indication if mentioned"
  },
  "recommendedProducts": [
    {
      "product": "product name",
      "reason": "why this fits their needs",
      "priority": "high|medium|low"
    }
  ],
  "pricingStrategy": {
    "approach": "volume|premium|competitive|value-based",
    "suggestedDiscount": 0-25,
    "reasoning": "why this pricing approach"
  },
  "quoteComplexity": 0.0-1.0,
  "nextBestActions": ["recommended follow-up actions"],
  "presentationNeeded": true/false,
  "confidence": 0.0-1.0
}`;

    try {
      const response = await ionosAI.sendMessage([
        { role: 'user', content: analysisPrompt }
      ], 'Sales Analysis Specialist');

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          ...analysis,
          complexity: analysis.quoteComplexity || 0.5
        };
      }
    } catch (error) {
      console.error('Quote analysis error:', error);
    }

    // Fallback analysis
    return {
      extractedInfo: {
        painPoints: ['Business efficiency', 'Cost optimization'],
        requirements: ['Scalable solution'],
        urgency: 'medium',
        budget: request.budget || 'Not specified',
        timeline: request.timeline || 'Not specified'
      },
      recommendedProducts: [
        { product: 'Core Package', reason: 'Meets basic requirements', priority: 'high' }
      ],
      pricingStrategy: {
        approach: 'competitive',
        suggestedDiscount: 10,
        reasoning: 'Standard competitive pricing'
      },
      complexity: 0.5,
      nextBestActions: ['Schedule follow-up demo'],
      presentationNeeded: false,
      confidence: 0.6
    };
  }

  private async generateGammaQuote(request: EnhancedQuoteRequest, analysis: any): Promise<IntelligentQuote> {
    // Create pricing structure
    const baseProducts = [
      { name: 'Professional Package', price: 2500 },
      { name: 'Implementation Services', price: 1500 },
      { name: 'Training Program', price: 1000 }
    ];

    const subtotal = baseProducts.reduce((sum, product) => sum + product.price, 0);
    const discount = Math.round(subtotal * (analysis.pricingStrategy.suggestedDiscount / 100));
    const total = subtotal - discount;

    const gammaRequest = {
      customerInfo: {
        company: request.customerInfo?.company || 'Valued Customer',
        industry: request.customerInfo?.industry || 'Technology',
        size: request.customerInfo?.size || 'medium',
        painPoints: analysis.extractedInfo.painPoints || ['Operational efficiency'],
        budget: analysis.extractedInfo.budget,
        timeline: analysis.extractedInfo.timeline
      },
      proposedSolution: {
        products: analysis.recommendedProducts.map((p: any) => p.product),
        value: this.createValueProposition(analysis),
        pricing: { subtotal, discount, total }
      },
      conversationContext: request.conversationContext
    };

    const presentation = await gammaAI.generateQuotePresentation(gammaRequest);

    return {
      id: presentation.id,
      type: 'gamma_presentation',
      content: presentation,
      recommendations: this.generateRecommendations(analysis),
      nextActions: analysis.nextBestActions || ['Follow up within 24 hours'],
      confidenceScore: analysis.confidence || 0.7,
      generatedAt: new Date()
    };
  }

  private async generateStandardQuote(request: EnhancedQuoteRequest, analysis: any): Promise<IntelligentQuote> {
    // Generate a standard quote structure
    const quote = {
      id: `IQ-${Date.now()}`,
      customerInfo: {
        company: request.customerInfo?.company || 'Valued Customer',
        industry: request.customerInfo?.industry || 'Technology',
        extractedNeeds: analysis.extractedInfo.painPoints || []
      },
      items: analysis.recommendedProducts.map((product: any, index: number) => ({
        name: product.product,
        description: product.reason,
        price: 1000 + (index * 500),
        quantity: 1
      })),
      summary: {
        subtotal: 0,
        discount: 0,
        total: 0
      },
      insights: analysis,
      generatedFrom: 'conversation_analysis'
    };

    // Calculate totals
    quote.summary.subtotal = quote.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    quote.summary.discount = Math.round(quote.summary.subtotal * (analysis.pricingStrategy.suggestedDiscount / 100));
    quote.summary.total = quote.summary.subtotal - quote.summary.discount;

    return {
      id: quote.id,
      type: 'standard',
      content: quote,
      recommendations: this.generateRecommendations(analysis),
      nextActions: analysis.nextBestActions || ['Follow up with detailed proposal'],
      confidenceScore: analysis.confidence || 0.6,
      generatedAt: new Date()
    };
  }

  private createValueProposition(analysis: any): string {
    const painPoints = analysis.extractedInfo.painPoints || [];
    const valueProps = [
      'Streamlined operations and improved efficiency',
      'Cost reduction through automation',
      'Scalable solution that grows with your business',
      'Expert support and training included',
      'Proven ROI within 6 months'
    ];

    return `Our solution addresses your key challenges:\n\n${painPoints.map((point: string) => `• ${point}`).join('\n')}\n\nValue delivered:\n${valueProps.map(prop => `• ${prop}`).join('\n')}`;
  }

  private generateRecommendations(analysis: any): string[] {
    const recommendations = [
      'This quote was generated based on conversation analysis',
      `Pricing strategy: ${analysis.pricingStrategy.approach}`,
      `Confidence level: ${Math.round((analysis.confidence || 0.6) * 100)}%`
    ];

    if (analysis.extractedInfo.urgency === 'high') {
      recommendations.push('Customer shows high urgency - consider expedited timeline');
    }

    if (analysis.presentationNeeded) {
      recommendations.push('Recommend scheduling a formal presentation');
    }

    return recommendations;
  }
}

export const intelligentQuoteGenerator = new IntelligentQuoteGenerator();
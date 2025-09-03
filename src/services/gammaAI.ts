interface GammaQuoteRequest {
  customerInfo: {
    company: string;
    industry: string;
    size: string;
    painPoints: string[];
    budget?: string;
    timeline?: string;
  };
  proposedSolution: {
    products: string[];
    value: string;
    pricing: {
      subtotal: number;
      discount?: number;
      total: number;
    };
  };
  conversationContext: string;
}

interface GammaPresentation {
  id: string;
  title: string;
  slides: GammaSlide[];
  shareUrl?: string;
  embedCode?: string;
}

interface GammaSlide {
  type: 'title' | 'content' | 'pricing' | 'testimonial' | 'cta';
  title: string;
  content: string;
  design?: {
    layout: string;
    colorScheme: string;
    template: string;
  };
}

export class GammaAIService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.gamma.app/v1';

  constructor() {
    this.apiKey = localStorage.getItem('gamma-api-key');
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('gamma-api-key', key);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateQuotePresentation(request: GammaQuoteRequest): Promise<GammaPresentation> {
    if (!this.apiKey) {
      throw new Error('Gamma API key not configured');
    }

    // For now, create a simulated presentation structure
    // In production, this would make actual API calls to Gamma
    const presentation = await this.createMockPresentation(request);
    
    try {
      // This would be the actual API call in production:
      // const response = await this.callGammaAPI(request);
      // return response;
      
      return presentation;
    } catch (error) {
      console.error('Gamma API error:', error);
      return presentation; // Return mock for now
    }
  }

  private async createMockPresentation(request: GammaQuoteRequest): Promise<GammaPresentation> {
    const slides: GammaSlide[] = [
      {
        type: 'title',
        title: `Proposal for ${request.customerInfo.company}`,
        content: `Tailored solution for ${request.customerInfo.industry} industry`,
        design: {
          layout: 'hero',
          colorScheme: 'professional-blue',
          template: 'business-proposal'
        }
      },
      {
        type: 'content',
        title: 'Your Challenges',
        content: `Based on our conversation, we understand your key challenges:\n\n${request.customerInfo.painPoints.map(point => `• ${point}`).join('\n')}`,
        design: {
          layout: 'bullet-points',
          colorScheme: 'warm-orange',
          template: 'problem-statement'
        }
      },
      {
        type: 'content',
        title: 'Our Solution',
        content: `We recommend the following solutions to address your needs:\n\n${request.proposedSolution.products.map(product => `• ${product}`).join('\n')}\n\n${request.proposedSolution.value}`,
        design: {
          layout: 'solution-grid',
          colorScheme: 'success-green',
          template: 'solution-overview'
        }
      },
      {
        type: 'pricing',
        title: 'Investment',
        content: this.formatPricingSlide(request.proposedSolution.pricing),
        design: {
          layout: 'pricing-table',
          colorScheme: 'neutral-gray',
          template: 'pricing-simple'
        }
      },
      {
        type: 'testimonial',
        title: 'Success Stories',
        content: 'Companies like yours have seen amazing results with our solution.',
        design: {
          layout: 'testimonial-card',
          colorScheme: 'trustworthy-blue',
          template: 'social-proof'
        }
      },
      {
        type: 'cta',
        title: 'Next Steps',
        content: `Ready to get started? Let's discuss implementation${request.customerInfo.timeline ? ` targeting your ${request.customerInfo.timeline} timeline` : ''}.`,
        design: {
          layout: 'call-to-action',
          colorScheme: 'action-purple',
          template: 'next-steps'
        }
      }
    ];

    return {
      id: `gamma-${Date.now()}`,
      title: `Proposal for ${request.customerInfo.company}`,
      slides,
      shareUrl: `https://gamma.app/public/proposal-${Date.now()}`,
      embedCode: `<iframe src="https://gamma.app/embed/proposal-${Date.now()}" width="100%" height="600"></iframe>`
    };
  }

  private formatPricingSlide(pricing: GammaQuoteRequest['proposedSolution']['pricing']): string {
    let content = `**Investment Summary**\n\n`;
    content += `Subtotal: $${pricing.subtotal.toLocaleString()}\n`;
    
    if (pricing.discount) {
      content += `Discount: -$${pricing.discount.toLocaleString()}\n`;
    }
    
    content += `**Total Investment: $${pricing.total.toLocaleString()}**\n\n`;
    content += `*Payment terms and implementation timeline available upon request*`;
    
    return content;
  }

  async generateFollowUpMaterials(
    presentationId: string, 
    materialType: 'case-study' | 'roi-calculator' | 'implementation-plan'
  ): Promise<GammaPresentation> {
    const templates = {
      'case-study': {
        title: 'Success Story: Similar Company Results',
        slides: [
          { type: 'title' as const, title: 'Case Study', content: 'How companies like yours succeeded' },
          { type: 'content' as const, title: 'The Challenge', content: 'Similar challenges to yours...' },
          { type: 'content' as const, title: 'The Solution', content: 'How we helped them...' },
          { type: 'content' as const, title: 'The Results', content: 'Measurable outcomes...' }
        ]
      },
      'roi-calculator': {
        title: 'ROI Analysis for Your Company',
        slides: [
          { type: 'title' as const, title: 'ROI Calculator', content: 'Your potential return on investment' },
          { type: 'content' as const, title: 'Current Costs', content: 'Your existing solution costs...' },
          { type: 'content' as const, title: 'Projected Savings', content: 'Expected cost reductions...' },
          { type: 'pricing' as const, title: 'ROI Summary', content: 'Break-even analysis...' }
        ]
      },
      'implementation-plan': {
        title: 'Implementation Roadmap',
        slides: [
          { type: 'title' as const, title: 'Implementation Plan', content: 'Your journey to success' },
          { type: 'content' as const, title: 'Phase 1: Setup', content: 'Initial configuration...' },
          { type: 'content' as const, title: 'Phase 2: Training', content: 'Team onboarding...' },
          { type: 'content' as const, title: 'Phase 3: Launch', content: 'Go-live timeline...' }
        ]
      }
    };

    const template = templates[materialType];
    
    return {
      id: `gamma-${materialType}-${Date.now()}`,
      title: template.title,
      slides: template.slides,
      shareUrl: `https://gamma.app/public/${materialType}-${Date.now()}`,
      embedCode: `<iframe src="https://gamma.app/embed/${materialType}-${Date.now()}" width="100%" height="600"></iframe>`
    };
  }

  // Mock API call structure for future implementation
  private async callGammaAPI(request: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'presentation',
        template: 'sales-proposal',
        content: request,
        options: {
          design: 'professional',
          length: 'standard',
          style: 'business'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const gammaAI = new GammaAIService();
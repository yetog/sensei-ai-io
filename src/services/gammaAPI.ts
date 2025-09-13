import { toast } from 'sonner';

interface GammaGenerationRequest {
  title: string;
  content: string;
  theme?: 'professional' | 'modern' | 'creative' | 'minimal';
  format?: 'presentation' | 'document' | 'webpage';
  pages?: number;
}

interface GammaGenerationResponse {
  id: string;
  url: string;
  title: string;
  status: 'generating' | 'completed' | 'failed';
  thumbnailUrl?: string;
  generatedAt: string;
}

export class GammaAPIService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.gamma.app/v1';

  constructor() {
    // Get API key from localStorage if available
    this.apiKey = localStorage.getItem('gamma_api_key');
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('gamma_api_key', apiKey);
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generatePresentation(request: GammaGenerationRequest): Promise<GammaGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('Gamma API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/presentations/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: request.title,
        content: request.content,
        theme: request.theme || 'professional',
        format: request.format || 'presentation',
        pages: request.pages || 10,
        options: {
          include_images: true,
          include_charts: true,
          auto_design: true
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Gamma API error: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      url: result.url || result.edit_url,
      title: result.title,
      status: result.status || 'completed',
      thumbnailUrl: result.thumbnail_url,
      generatedAt: new Date().toISOString()
    };
  }

  async generateQuoteDocument(quoteData: {
    customerName: string;
    items: Array<{
      product: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    total: number;
    validUntil: string;
    notes?: string;
  }): Promise<GammaGenerationResponse> {
    const content = this.formatQuoteContent(quoteData);
    
    return this.generatePresentation({
      title: `Sales Quote - ${quoteData.customerName}`,
      content,
      theme: 'professional',
      format: 'document',
      pages: 3
    });
  }

  async generateSalesProposal(proposalData: {
    customerName: string;
    industry: string;
    challenges: string[];
    solutions: string[];
    benefits: string[];
    pricing: any;
    timeline: string;
  }): Promise<GammaGenerationResponse> {
    const content = this.formatProposalContent(proposalData);
    
    return this.generatePresentation({
      title: `Sales Proposal - ${proposalData.customerName}`,
      content,
      theme: 'modern',
      format: 'presentation',
      pages: 8
    });
  }

  async generateTrainingMaterial(trainingData: {
    title: string;
    topics: string[];
    objectives: string[];
    content: string;
  }): Promise<GammaGenerationResponse> {
    const content = this.formatTrainingContent(trainingData);
    
    return this.generatePresentation({
      title: `Training: ${trainingData.title}`,
      content,
      theme: 'creative',
      format: 'presentation',
      pages: 12
    });
  }

  private formatQuoteContent(quoteData: any): string {
    return `
# Professional Sales Quote

## Customer Information
**Company:** ${quoteData.customerName}
**Date:** ${new Date().toLocaleDateString()}
**Valid Until:** ${new Date(quoteData.validUntil).toLocaleDateString()}

## Quote Items
${quoteData.items.map((item: any) => `
### ${item.product}
- **Description:** ${item.description}
- **Quantity:** ${item.quantity}
- **Unit Price:** $${item.unitPrice.toLocaleString()}
- **Total:** $${item.total.toLocaleString()}
`).join('\n')}

## Summary
- **Subtotal:** $${quoteData.subtotal.toLocaleString()}
- **Total:** $${quoteData.total.toLocaleString()}

${quoteData.notes ? `## Additional Notes\n${quoteData.notes}` : ''}

## Next Steps
1. Review the proposal details
2. Schedule implementation planning call
3. Finalize contract and pricing
4. Begin onboarding process
`;
  }

  private formatProposalContent(proposalData: any): string {
    return `
# Sales Proposal for ${proposalData.customerName}

## Executive Summary
We understand ${proposalData.customerName}'s unique challenges in the ${proposalData.industry} industry and have tailored a solution to address your specific needs.

## Current Challenges
${proposalData.challenges.map((challenge: string) => `- ${challenge}`).join('\n')}

## Our Solutions
${proposalData.solutions.map((solution: string) => `- ${solution}`).join('\n')}

## Key Benefits
${proposalData.benefits.map((benefit: string) => `- ${benefit}`).join('\n')}

## Investment & Timeline
**Implementation Timeline:** ${proposalData.timeline}
**Investment:** Starting at $${proposalData.pricing.toLocaleString()}

## Why Choose Us
- Proven track record in ${proposalData.industry}
- Dedicated support team
- Scalable solutions
- Strong ROI guarantee

## Next Steps
1. Approval and contract signing
2. Project kickoff meeting
3. Implementation begins
4. Go-live and support
`;
  }

  private formatTrainingContent(trainingData: any): string {
    return `
# ${trainingData.title}

## Learning Objectives
${trainingData.objectives.map((objective: string) => `- ${objective}`).join('\n')}

## Training Topics
${trainingData.topics.map((topic: string) => `### ${topic}\nKey concepts and practical applications`).join('\n\n')}

## Content Overview
${trainingData.content}

## Practical Exercises
- Role-playing scenarios
- Case study analysis
- Interactive discussions
- Skills assessment

## Resources
- Reference materials
- Best practices guide
- Quick reference cards
- Follow-up support
`;
  }

  // Check API status and configuration
  async validateConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Gamma API validation error:', error);
      return false;
    }
  }

  // Get usage stats
  async getUsageStats(): Promise<{
    generationsThisMonth: number;
    generationsRemaining: number;
    planType: string;
  } | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(`${this.baseUrl}/account/usage`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Failed to get Gamma usage stats:', error);
      return null;
    }
  }
}

export const gammaAPI = new GammaAPIService();
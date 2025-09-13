// Enhanced Gamma API v0.2 Service with embedded API key
interface GammaGenerationRequest {
  inputText: string;
  textMode?: 'generate' | 'condense' | 'preserve';
  format?: 'presentation' | 'document' | 'social';
  themeName?: string;
  numCards?: number;
  cardSplit?: 'auto' | 'inputTextBreaks';
  additionalInstructions?: string;
  exportAs?: 'pdf' | 'pptx';
  textOptions?: {
    amount?: 'brief' | 'medium' | 'detailed' | 'extensive';
    tone?: string;
    audience?: string;
    language?: string;
  };
  imageOptions?: {
    source?: 'aiGenerated' | 'pictographic' | 'unsplash' | 'giphy' | 'webAllImages' | 'webFreeToUse' | 'webFreeToUseCommercially' | 'placeholder' | 'noImages';
    model?: string;
    style?: string;
  };
  cardOptions?: {
    dimensions?: string;
  };
  sharingOptions?: {
    workspaceAccess?: 'noAccess' | 'view' | 'comment' | 'edit' | 'fullAccess';
    externalAccess?: 'noAccess' | 'view' | 'comment' | 'edit';
  };
}

interface GammaGenerationResponse {
  id: string;
  url: string;
  title: string;
  status: 'generating' | 'completed' | 'failed';
  thumbnailUrl?: string;
  downloadUrls?: {
    pdf?: string;
    pptx?: string;
  };
  generatedAt: string;
}

export class GammaAPIServiceV2 {
  private readonly apiKey = 'sk-gamma-e123456789abcdef'; // Embedded API key for seamless experience
  private readonly baseUrl = 'https://public-api.gamma.app/v0.2';

  async generateContent(request: GammaGenerationRequest): Promise<GammaGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Gamma API error: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      url: result.url,
      title: result.title || 'Generated Content',
      status: result.status || 'completed',
      thumbnailUrl: result.thumbnailUrl,
      downloadUrls: result.downloadUrls,
      generatedAt: new Date().toISOString()
    };
  }

  // Context-aware generation methods
  async generateQuoteDocument(quoteData: any): Promise<GammaGenerationResponse> {
    const content = this.formatQuoteContent(quoteData);
    
    return this.generateContent({
      inputText: content,
      textMode: 'preserve',
      format: 'document',
      themeName: 'Professional',
      numCards: 4,
      exportAs: 'pdf',
      textOptions: {
        amount: 'detailed',
        tone: 'professional, trustworthy',
        audience: 'business decision makers',
        language: 'en'
      },
      imageOptions: {
        source: 'aiGenerated',
        model: 'imagen-4-pro',
        style: 'professional, clean, business'
      },
      cardOptions: {
        dimensions: 'letter'
      },
      sharingOptions: {
        workspaceAccess: 'view',
        externalAccess: 'view'
      }
    });
  }

  async generateSalesProposal(proposalData: any): Promise<GammaGenerationResponse> {
    const content = this.formatProposalContent(proposalData);
    
    return this.generateContent({
      inputText: content,
      textMode: 'generate',
      format: 'presentation',
      themeName: 'Modern Business',
      numCards: 12,
      cardSplit: 'auto',
      exportAs: 'pptx',
      additionalInstructions: 'Make slides visually engaging with clear value propositions',
      textOptions: {
        amount: 'detailed',
        tone: 'persuasive, professional, solution-focused',
        audience: 'executives, decision makers',
        language: 'en'
      },
      imageOptions: {
        source: 'aiGenerated',
        model: 'flux-1-pro',
        style: 'professional, modern, business graphics'
      },
      cardOptions: {
        dimensions: '16x9'
      }
    });
  }

  async generateTrainingMaterial(trainingData: any): Promise<GammaGenerationResponse> {
    const content = this.formatTrainingContent(trainingData);
    
    return this.generateContent({
      inputText: content,
      textMode: 'generate',
      format: 'presentation',
      themeName: 'Educational',
      numCards: 15,
      additionalInstructions: 'Include interactive elements and practical exercises',
      textOptions: {
        amount: 'extensive',
        tone: 'educational, engaging, practical',
        audience: 'sales professionals, trainees',
        language: 'en'
      },
      imageOptions: {
        source: 'aiGenerated',
        model: 'imagen-4-pro',
        style: 'educational, infographic, clear diagrams'
      }
    });
  }

  async generateCallAnalysisReport(callData: any): Promise<GammaGenerationResponse> {
    const content = this.formatCallAnalysisContent(callData);
    
    return this.generateContent({
      inputText: content,
      textMode: 'condense',
      format: 'document',
      themeName: 'Analytics',
      numCards: 6,
      exportAs: 'pdf',
      textOptions: {
        amount: 'detailed',
        tone: 'analytical, objective, insightful',
        audience: 'sales managers, performance analysts',
        language: 'en'
      },
      imageOptions: {
        source: 'aiGenerated',
        style: 'charts, graphs, data visualization'
      }
    });
  }

  // Content formatting methods
  private formatQuoteContent(quoteData: any): string {
    return `# Professional Sales Quote\n\n## Customer Information\n**Company:** ${quoteData.customerName}\n**Date:** ${new Date().toLocaleDateString()}\n**Valid Until:** ${new Date(quoteData.validUntil).toLocaleDateString()}\n\n---\n\n## Quote Items\n${quoteData.items?.map((item: any) => `### ${item.product}\n- **Description:** ${item.description}\n- **Quantity:** ${item.quantity}\n- **Unit Price:** $${item.unitPrice?.toLocaleString()}\n- **Total:** $${item.total?.toLocaleString()}`).join('\n\n')}\n\n---\n\n## Investment Summary\n- **Subtotal:** $${quoteData.subtotal?.toLocaleString()}\n- **Total:** $${quoteData.total?.toLocaleString()}\n\n${quoteData.notes ? `## Additional Notes\n${quoteData.notes}\n\n---\n\n` : ''}## Next Steps\n1. Review proposal details\n2. Schedule implementation call\n3. Finalize contract\n4. Begin onboarding`;
  }

  private formatProposalContent(proposalData: any): string {
    return `# Sales Proposal for ${proposalData.customerName}\n\n## Executive Summary\nTailored solution for ${proposalData.customerName} in the ${proposalData.industry} industry.\n\n---\n\n## Current Challenges\n${proposalData.challenges?.map((c: string) => `- ${c}`).join('\n')}\n\n---\n\n## Our Solutions\n${proposalData.solutions?.map((s: string) => `- ${s}`).join('\n')}\n\n---\n\n## Key Benefits\n${proposalData.benefits?.map((b: string) => `- ${b}`).join('\n')}\n\n---\n\n## Investment & Timeline\n**Timeline:** ${proposalData.timeline}\n**Investment:** $${proposalData.pricing?.toLocaleString()}\n\n---\n\n## Why Choose Us\n- Proven track record\n- Dedicated support\n- Scalable solutions\n- Strong ROI guarantee\n\n---\n\n## Next Steps\n1. Approval and signing\n2. Project kickoff\n3. Implementation\n4. Go-live and support`;
  }

  private formatTrainingContent(trainingData: any): string {
    return `# ${trainingData.title}\n\n## Learning Objectives\n${trainingData.objectives?.map((o: string) => `- ${o}`).join('\n')}\n\n---\n\n## Training Topics\n${trainingData.topics?.map((t: string) => `### ${t}\nKey concepts and practical applications`).join('\n\n---\n\n')}\n\n---\n\n## Content Overview\n${trainingData.content}\n\n---\n\n## Practical Exercises\n- Role-playing scenarios\n- Case study analysis\n- Interactive discussions\n- Skills assessment\n\n---\n\n## Resources\n- Reference materials\n- Best practices guide\n- Quick reference cards\n- Follow-up support`;
  }

  private formatCallAnalysisContent(callData: any): string {
    return `# Call Analysis Report\n\n## Call Overview\n**Date:** ${new Date().toLocaleDateString()}\n**Duration:** ${callData.duration || 'N/A'}\n**Participant:** ${callData.participant || 'Sales Rep'}\n\n---\n\n## Key Metrics\n- **Talk Time Ratio:** ${callData.talkTimeRatio || 'N/A'}\n- **Questions Asked:** ${callData.questionsAsked || 'N/A'}\n- **Objections Raised:** ${callData.objections?.length || 0}\n\n---\n\n## Conversation Summary\n${callData.summary || callData.transcript || 'No summary available'}\n\n---\n\n## Performance Insights\n${callData.insights?.map((i: any) => `### ${i.title}\n${i.description}`).join('\n\n')}\n\n---\n\n## Recommendations\n${callData.recommendations?.map((r: string) => `- ${r}`).join('\n') || '- Follow up within 24 hours\n- Address key objections\n- Send proposal'}\n\n---\n\n## Next Actions\n${callData.nextActions?.map((a: string) => `- ${a}`).join('\n') || '- Schedule follow-up\n- Prepare materials\n- Update CRM'}`;
  }

  // Usage analytics
  async getUsageStats(): Promise<any> {
    // Mock usage stats since API might not have this endpoint yet
    return {
      generationsThisMonth: 12,
      generationsRemaining: 88,
      planType: 'Pro'
    };
  }
}

export const gammaAPIv2 = new GammaAPIServiceV2();
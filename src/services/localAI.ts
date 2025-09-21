import { pipeline, env } from '@huggingface/transformers';

// Configure environment for local inference
env.allowRemoteModels = true;
env.allowLocalModels = true;

interface CoachingSuggestion {
  id: string;
  type: 'objection' | 'product_pitch' | 'closing' | 'retention' | 'general';
  title: string;
  suggestion: string;
  context: string;
  confidence: number;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  isDismissed?: boolean;
  rating?: 'helpful' | 'not_helpful';
  ratingReason?: string;
}

class LocalAIService {
  private model: any = null;
  private isInitialized = false;
  private device: 'webgpu' | 'cpu' = 'cpu';
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.detectDevice();
  }

  private async detectDevice(): Promise<void> {
    try {
      // Check for WebGPU support
      if ('gpu' in navigator) {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          this.device = 'webgpu';
          console.log('🚀 WebGPU detected - using GPU acceleration for local AI');
        }
      }
    } catch (error) {
      console.log('📱 WebGPU not available - falling back to CPU');
      this.device = 'cpu';
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log(`🔄 Initializing local AI model on ${this.device}...`);
      
      // Use a lightweight model optimized for coaching tasks
      const modelName = 'microsoft/DialoGPT-small'; // Fast, good for conversational tasks
      
      this.model = await pipeline(
        'text-generation',
        modelName,
        {
          device: this.device,
          dtype: this.device === 'webgpu' ? 'fp16' : 'fp32',
          model_file_name: 'onnx/model.onnx'
        }
      );

      this.isInitialized = true;
      console.log(`✅ Local AI model initialized successfully on ${this.device}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize local AI model:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async generateCoachingSuggestion(
    transcript: string, 
    callType: string,
    conversationHistory: string[] = []
  ): Promise<CoachingSuggestion | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const startTime = performance.now();
      
      // Create coaching prompt based on transcript and call type
      const prompt = this.createCoachingPrompt(transcript, callType, conversationHistory);
      
      const result = await this.model(prompt, {
        max_new_tokens: 150,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      console.log(`⚡ Local AI processing time: ${processingTime.toFixed(2)}ms`);

      if (result && result[0] && result[0].generated_text) {
        const suggestion = this.parseCoachingSuggestion(
          result[0].generated_text,
          transcript,
          callType,
          processingTime
        );
        
        return suggestion;
      }

      return null;
    } catch (error) {
      console.error('🚨 Local AI generation error:', error);
      return null;
    }
  }

  private createCoachingPrompt(
    transcript: string, 
    callType: string, 
    conversationHistory: string[]
  ): string {
    const context = conversationHistory.slice(-3).join('\n');
    
    const prompts = {
      cold_call: `You are an expert sales coach. Based on this cold call transcript: "${transcript}", provide coaching feedback. Focus on building rapport, handling objections, or moving to next steps.`,
      demo: `You are a demo expert coach. For this demo transcript: "${transcript}", provide coaching feedback for product presentation, feature highlighting, or customer engagement.`,
      closing: `You are a closing specialist coach. Based on: "${transcript}", provide coaching feedback for overcoming hesitation, creating urgency, or securing commitment.`,
      retention: `You are a customer success coach. For this retention call: "${transcript}", provide coaching feedback for addressing concerns, reinforcing value, or strengthening the relationship.`,
      discovery: `You are a discovery call expert. Based on: "${transcript}", provide coaching feedback for better questioning, uncovering needs, or qualifying the prospect.`,
      general: `You are a sales coach. Based on: "${transcript}", provide coaching feedback to improve the conversation.`
    };

    const basePrompt = prompts[callType as keyof typeof prompts] || prompts.general;
    
    return `${basePrompt}

Context from conversation:
${context}

Please provide your response in this exact format:

Summary & Analysis:
[Brief analysis of what happened in the conversation]

Suggestion:
[ONE specific, actionable coaching tip in 1-2 sentences]`;
  }

  private parseCoachingSuggestion(
    response: string,
    transcript: string,
    callType: string,
    processingTime: number
  ): CoachingSuggestion {
    // Parse the structured response with Summary & Analysis and Suggestion sections
    const summaryAnalysisMatch = response.match(/Summary & Analysis:\s*\n?(.*?)(?=\n\s*Suggestion:|$)/is);
    const suggestionMatch = response.match(/Suggestion:\s*\n?(.*?)$/is);
    
    const summaryAnalysis = summaryAnalysisMatch ? summaryAnalysisMatch[1].trim() : '';
    const suggestionText = suggestionMatch ? suggestionMatch[1].trim() : '';
    
    // Combine both sections for the suggestion field with proper formatting
    let combinedSuggestion = '';
    if (summaryAnalysis && suggestionText) {
      combinedSuggestion = `Summary & Analysis:\n${this.cleanMarkdownFormatting(summaryAnalysis)}\n\nSuggestion:\n${this.cleanMarkdownFormatting(suggestionText)}`;
    } else {
      // Fallback to original parsing if format is not followed
      const fallbackMatch = response.match(/SUGGESTION:\s*(.+?)(?:\n|$)/i);
      combinedSuggestion = fallbackMatch ? this.cleanMarkdownFormatting(fallbackMatch[1].trim()) : this.cleanMarkdownFormatting(response.trim());
    }
    
    // Determine suggestion type and priority based on content
    const type = this.classifySuggestionType(combinedSuggestion, callType);
    const priority = this.determinePriority(combinedSuggestion, transcript);
    const confidence = this.calculateConfidence(combinedSuggestion, processingTime);

    return {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: this.generateTitle(type, callType),
      suggestion: combinedSuggestion,
      context: transcript.substring(0, 100) + '...',
      confidence,
      timestamp: Date.now(),
      priority
    };
  }

  private cleanMarkdownFormatting(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
      .replace(/__(.*?)__/g, '$1')     // Remove __underline__
      .replace(/_(.*?)_/g, '$1')       // Remove _underscore_
      .replace(/`(.*?)`/g, '$1')       // Remove `code`
      .replace(/#{1,6}\s*/g, '')       // Remove # headers
      .replace(/\n\s*[-*+]\s*/g, '\n• ') // Convert bullets to bullet points
      .replace(/^\s*\d+\.\s*/gm, '• ') // Convert numbered lists to bullets
      .trim();
  }

  private classifySuggestionType(suggestion: string, callType: string): CoachingSuggestion['type'] {
    const lowerSuggestion = suggestion.toLowerCase();
    
    if (lowerSuggestion.includes('objection') || lowerSuggestion.includes('concern') || lowerSuggestion.includes('hesitation')) {
      return 'objection';
    }
    if (lowerSuggestion.includes('feature') || lowerSuggestion.includes('benefit') || lowerSuggestion.includes('product')) {
      return 'product_pitch';
    }
    if (lowerSuggestion.includes('close') || lowerSuggestion.includes('commit') || lowerSuggestion.includes('decision')) {
      return 'closing';
    }
    if (lowerSuggestion.includes('retain') || lowerSuggestion.includes('relationship') || lowerSuggestion.includes('value')) {
      return 'retention';
    }
    
    return 'general';
  }

  private determinePriority(suggestion: string, transcript: string): 'high' | 'medium' | 'low' {
    const urgentKeywords = ['urgent', 'immediate', 'now', 'quickly', 'asap'];
    const importantKeywords = ['important', 'critical', 'key', 'essential', 'must'];
    
    const lowerSuggestion = suggestion.toLowerCase();
    const lowerTranscript = transcript.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerSuggestion.includes(keyword) || lowerTranscript.includes(keyword))) {
      return 'high';
    }
    if (importantKeywords.some(keyword => lowerSuggestion.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  private calculateConfidence(suggestion: string, processingTime: number): number {
    // Base confidence on suggestion length and processing time
    let confidence = 0.7;
    
    // Longer suggestions with specific advice tend to be more confident
    if (suggestion.length > 50) confidence += 0.1;
    if (suggestion.length > 100) confidence += 0.1;
    
    // Faster processing might indicate cached/confident responses
    if (processingTime < 200) confidence += 0.05;
    
    // Check for specific coaching keywords
    const qualityKeywords = ['specifically', 'try', 'consider', 'focus on', 'ask about'];
    if (qualityKeywords.some(keyword => suggestion.toLowerCase().includes(keyword))) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 0.95);
  }

  private generateTitle(type: CoachingSuggestion['type'], callType: string): string {
    const titles = {
      objection: '🛡️ Handle Objection',
      product_pitch: '🎯 Product Focus',
      closing: '🤝 Close Opportunity',
      retention: '💎 Strengthen Relationship',
      general: '💡 Coaching Tip'
    };
    
    return titles[type] || titles.general;
  }

  // Method to check if local AI is available
  isAvailable(): boolean {
    return this.isInitialized;
  }

  // Method to get device info
  getDeviceInfo(): { device: string; initialized: boolean } {
    return {
      device: this.device,
      initialized: this.isInitialized
    };
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    if (this.model) {
      try {
        // Cleanup model resources if available
        if (typeof this.model.dispose === 'function') {
          await this.model.dispose();
        }
      } catch (error) {
        console.error('Error during model cleanup:', error);
      }
      
      this.model = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const localAI = new LocalAIService();
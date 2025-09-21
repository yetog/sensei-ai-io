import { localAI } from './localAI';
import { ionosAI } from './ionosAI';

interface CoachingSuggestion {
  id: string;
  type: 'objection' | 'product_pitch' | 'closing' | 'retention' | 'general';
  title: string;
  suggestion: string;
  context: string;
  confidence: number;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  source: 'local' | 'cloud';
  processingTime?: number;
}

interface HybridAIConfig {
  localFirst: boolean;
  cloudFallback: boolean;
  localTimeout: number;
  maxRetries: number;
}

class HybridAIService {
  private config: HybridAIConfig = {
    localFirst: true,
    cloudFallback: true,
    localTimeout: 2000, // 2 seconds max for local processing
    maxRetries: 2
  };

  private localAttempts = 0;
  private cloudAttempts = 0;
  private lastLocalSuccess = 0;
  private lastCloudSuccess = 0;

  async generateCoachingSuggestion(
    transcript: string,
    callType: string,
    conversationHistory: string[] = []
  ): Promise<CoachingSuggestion | null> {
    const startTime = performance.now();
    
    console.log('🔄 Starting hybrid AI coaching suggestion generation...');

    // Try local AI first if enabled and available
    if (this.config.localFirst && localAI.isAvailable()) {
      console.log('🏠 Attempting local AI generation...');
      
      try {
        const localResult = await this.tryLocalGeneration(transcript, callType, conversationHistory);
        if (localResult) {
          this.lastLocalSuccess = Date.now();
          this.localAttempts++;
          
          const totalTime = performance.now() - startTime;
          console.log(`✅ Local AI success in ${totalTime.toFixed(2)}ms`);
          
          return {
            ...localResult,
            source: 'local' as const,
            processingTime: totalTime
          };
        }
      } catch (error) {
        console.warn('⚠️ Local AI failed, falling back to cloud:', error);
      }
    }

    // Fallback to cloud AI if local failed or not available
    if (this.config.cloudFallback) {
      console.log('☁️ Attempting cloud AI generation...');
      
      try {
        const cloudResult = await this.tryCloudGeneration(transcript, callType, conversationHistory);
        if (cloudResult) {
          this.lastCloudSuccess = Date.now();
          this.cloudAttempts++;
          
          const totalTime = performance.now() - startTime;
          console.log(`✅ Cloud AI success in ${totalTime.toFixed(2)}ms`);
          
          return {
            ...cloudResult,
            source: 'cloud' as const,
            processingTime: totalTime
          };
        }
      } catch (error) {
        console.error('❌ Cloud AI also failed:', error);
      }
    }

    console.log('💥 Both local and cloud AI failed');
    return null;
  }

  private async tryLocalGeneration(
    transcript: string,
    callType: string,
    conversationHistory: string[]
  ): Promise<Omit<CoachingSuggestion, 'source'> | null> {
    return new Promise(async (resolve, reject) => {
      // Set timeout for local processing
      const timeout = setTimeout(() => {
        reject(new Error('Local AI timeout'));
      }, this.config.localTimeout);

      try {
        const result = await localAI.generateCoachingSuggestion(transcript, callType, conversationHistory);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private async tryCloudGeneration(
    transcript: string,
    callType: string,
    conversationHistory: string[]
  ): Promise<Omit<CoachingSuggestion, 'source'> | null> {
    try {
      // Create coaching prompt for cloud AI
      const prompt = this.createCloudPrompt(transcript, callType, conversationHistory);
      
      const messages = [
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const response = await ionosAI.sendMessage(messages, 'Sales Coach');
      
      if (response) {
        return this.parseCloudResponse(response, transcript, callType);
      }
      
      return null;
    } catch (error) {
      console.error('Cloud AI generation error:', error);
      throw error;
    }
  }

  private createCloudPrompt(
    transcript: string,
    callType: string,
    conversationHistory: string[]
  ): string {
    const context = conversationHistory.slice(-3).join('\n');
    
    return `As an expert sales coach, analyze this ${callType} conversation transcript and provide ONE specific, actionable coaching tip:

Transcript: "${transcript}"

Recent conversation context:
${context}

Please provide:
1. A brief coaching suggestion (1-2 sentences)
2. The suggestion type (objection, product_pitch, closing, retention, or general)
3. Priority level (high, medium, low)

Format your response as:
SUGGESTION: [your coaching tip]
TYPE: [suggestion type]
PRIORITY: [priority level]`;
  }

  private parseCloudResponse(
    response: string,
    transcript: string,
    callType: string
  ): Omit<CoachingSuggestion, 'source'> {
    // Parse the structured response
    const suggestionMatch = response.match(/SUGGESTION:\s*(.+?)(?:\n|TYPE:|$)/i);
    const typeMatch = response.match(/TYPE:\s*(\w+)/i);
    const priorityMatch = response.match(/PRIORITY:\s*(\w+)/i);

    const suggestion = suggestionMatch ? suggestionMatch[1].trim() : response.trim();
    const type = this.validateType(typeMatch ? typeMatch[1].toLowerCase() : 'general');
    const priority = this.validatePriority(priorityMatch ? priorityMatch[1].toLowerCase() : 'medium');

    return {
      id: `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: this.generateTitle(type, callType),
      suggestion,
      context: transcript.substring(0, 100) + '...',
      confidence: 0.85, // Cloud AI typically more confident
      timestamp: Date.now(),
      priority
    };
  }

  private validateType(type: string): CoachingSuggestion['type'] {
    const validTypes: CoachingSuggestion['type'][] = ['objection', 'product_pitch', 'closing', 'retention', 'general'];
    return validTypes.includes(type as any) ? type as CoachingSuggestion['type'] : 'general';
  }

  private validatePriority(priority: string): 'high' | 'medium' | 'low' {
    const validPriorities = ['high', 'medium', 'low'];
    return validPriorities.includes(priority) ? priority as any : 'medium';
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

  // Configuration methods
  setConfig(config: Partial<HybridAIConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 Hybrid AI config updated:', this.config);
  }

  getConfig(): HybridAIConfig {
    return { ...this.config };
  }

  // Statistics methods
  getStats() {
    const now = Date.now();
    const localUptime = this.lastLocalSuccess ? (now - this.lastLocalSuccess) / 1000 : null;
    const cloudUptime = this.lastCloudSuccess ? (now - this.lastCloudSuccess) / 1000 : null;

    return {
      localAttempts: this.localAttempts,
      cloudAttempts: this.cloudAttempts,
      localUptime,
      cloudUptime,
      localAvailable: localAI.isAvailable(),
      localDevice: localAI.getDeviceInfo()
    };
  }

  // Initialize both services
  async initialize(): Promise<void> {
    console.log('🚀 Initializing hybrid AI system...');
    
    try {
      // Initialize local AI in background
      localAI.initialize().catch(error => {
        console.warn('⚠️ Local AI initialization failed:', error);
      });
      
      console.log('✅ Hybrid AI system ready');
    } catch (error) {
      console.error('❌ Hybrid AI initialization error:', error);
      throw error;
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    await localAI.cleanup();
  }
}

// Export singleton instance
export const hybridAI = new HybridAIService();
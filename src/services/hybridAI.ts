import { localAI } from './localAI';
import { ionosAI } from './ionosAI';
import { feedbackLearning } from './feedbackLearning';

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
    conversationHistory: string[] = [],
    fileContext?: string
  ): Promise<CoachingSuggestion | null> {
    const startTime = performance.now();
    
    console.log('🔄 Starting hybrid AI coaching suggestion generation...');

    // Try local AI first if enabled and available
    if (this.config.localFirst && localAI.isAvailable()) {
      console.log('🏠 Attempting local AI generation...');
      
      try {
        const localResult = await this.tryLocalGeneration(transcript, callType, conversationHistory, fileContext);
        if (localResult) {
          this.lastLocalSuccess = Date.now();
          this.localAttempts++;
          
          const totalTime = performance.now() - startTime;
          console.log(`✅ Local AI success in ${totalTime.toFixed(2)}ms`);
          
          // CRITICAL: Apply feedback learning to improve suggestion
          const improvedSuggestion = feedbackLearning.improveSuggestion(
            localResult.suggestion, 
            localResult.context || transcript
          );
          
          return {
            ...localResult,
            suggestion: improvedSuggestion,
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
        const cloudResult = await this.tryCloudGeneration(transcript, callType, conversationHistory, fileContext);
        if (cloudResult) {
          this.lastCloudSuccess = Date.now();
          this.cloudAttempts++;
          
          const totalTime = performance.now() - startTime;
          
          // CRITICAL: Apply feedback learning to improve suggestion
          const improvedSuggestion = feedbackLearning.improveSuggestion(
            cloudResult.suggestion, 
            cloudResult.context || transcript
          );
          
          return {
            ...cloudResult,
            suggestion: improvedSuggestion,
            source: 'cloud' as const,
            processingTime: totalTime
          };
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
    conversationHistory: string[],
    fileContext?: string
  ): Promise<Omit<CoachingSuggestion, 'source'> | null> {
    return new Promise(async (resolve, reject) => {
      // Set timeout for local processing
      const timeout = setTimeout(() => {
        reject(new Error('Local AI timeout'));
      }, this.config.localTimeout);

      try {
        const result = await localAI.generateCoachingSuggestion(transcript, callType, conversationHistory, fileContext);
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
    conversationHistory: string[],
    fileContext?: string
  ): Promise<Omit<CoachingSuggestion, 'source'> | null> {
    try {
      // Extract domain-relevant products from file context
      const relevantProducts = this.extractRelevantProducts(transcript, fileContext);
      
      // Create coaching prompt for cloud AI with prioritized product context
      const prompt = this.createCloudPrompt(transcript, callType, conversationHistory, relevantProducts);
      
      const messages = [
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const response = await ionosAI.sendCoachingMessage(messages, 'Sales Coach');
      
      if (response) {
        return this.parseCloudResponse(response, transcript, callType);
      }
      
      return null;
    } catch (error) {
      console.error('Cloud AI generation error:', error);
      throw error;
    }
  }

  private extractRelevantProducts(transcript: string, fileContext?: string): string {
    if (!fileContext || fileContext.trim().length < 100) return '';
    
    // Keywords to identify conversation topics
    const transcriptLower = transcript.toLowerCase();
    const keywords = {
      domain: ['domain', 'website', 'url', 'site', '.com', '.de', '.net'],
      email: ['email', 'mail', 'inbox', 'mailbox'],
      security: ['security', 'ssl', 'certificate', 'https', 'secure', 'protection', 'guard'],
      hosting: ['host', 'hosting', 'server', 'managed'],
      website: ['website', 'web', 'builder', 'design', 'online']
    };
    
    // Determine conversation topic
    const topics: string[] = [];
    for (const [topic, words] of Object.entries(keywords)) {
      if (words.some(word => transcriptLower.includes(word))) {
        topics.push(topic);
      }
    }
    
    if (topics.length === 0) return fileContext; // Return all context if no specific topic detected
    
    console.log('🎯 Detected conversation topics:', topics);
    
    // Extract only products relevant to detected topics
    const lines = fileContext.split('\n');
    const relevantLines: string[] = [];
    let currentProductBlock = '';
    let isRelevantProduct = false;
    
    for (const line of lines) {
      // Start of a new product
      if (line.startsWith('### ')) {
        // Save previous product if it was relevant
        if (isRelevantProduct && currentProductBlock) {
          relevantLines.push(currentProductBlock);
        }
        currentProductBlock = line + '\n';
        
        // Check if this product matches any detected topics
        const lineLower = line.toLowerCase();
        isRelevantProduct = topics.some(topic => 
          keywords[topic as keyof typeof keywords].some(word => lineLower.includes(word))
        );
      } else if (currentProductBlock) {
        currentProductBlock += line + '\n';
      } else {
        // Header lines (file names, etc.)
        relevantLines.push(line);
      }
    }
    
    // Don't forget the last product
    if (isRelevantProduct && currentProductBlock) {
      relevantLines.push(currentProductBlock);
    }
    
    const filteredContext = relevantLines.join('\n').trim();
    
    if (filteredContext.length < 100) {
      console.log('⚠️ Topic filtering too aggressive, using full context');
      return fileContext;
    }
    
    console.log(`✅ Filtered context: ${fileContext.length} → ${filteredContext.length} chars for topics:`, topics);
    return filteredContext;
  }

  private createCloudPrompt(
    transcript: string,
    callType: string,
    conversationHistory: string[],
    fileContext?: string
  ): string {
    const context = conversationHistory.slice(-3).join('\n');
    const hasProductKnowledge = fileContext && fileContext.trim().length > 100;
    
    let prompt = `You are an expert sales coach providing REAL-TIME guidance during ${callType} calls.

🎯 YOUR MISSION: Provide ONE specific, immediately actionable coaching suggestion that moves this conversation toward a successful outcome.

📞 CURRENT MOMENT:
Agent just said: "${transcript}"

📋 CONVERSATION SO FAR:
${context || 'Beginning of conversation'}

${hasProductKnowledge ? `
💡 RELEVANT PRODUCTS FOR THIS CONVERSATION (PRIORITIZE THESE):
${fileContext}

🎯 CRITICAL RULES:
1. Your suggestion MUST reference SPECIFIC products by name from the list above
2. Include ACTUAL product features, pricing, or benefits when available
3. Match products to the customer's stated needs or interests
4. DO NOT suggest generic "managed hosting" or vague services - use EXACT product names
5. If customer mentions domain/security → suggest Domain Guard, SSL certificates, etc.
6. If customer needs email → suggest specific email hosting products by name
` : ''}

🎓 COACHING FRAMEWORK:
1. WHAT specific product should the agent pitch? (Name the exact product)
2. WHY is this product relevant to what the customer just said?
3. WHAT are the key features/benefits to mention?

⚡ PRIORITY SITUATIONS (with product examples):
- Customer mentions "domain" → Suggest Domain Guard (security), SSL certificates, or specific domain extensions
- Customer has objection → Counter with specific product features and benefits from the list
- Customer is engaged → Suggest complementary products by name (e.g., if they want domain, suggest email hosting)
- Conversation stalling → Ask about specific needs that match available products

📊 RESPOND IN THIS EXACT FORMAT:

Summary & Analysis:
[Brief analysis of what just happened and key observations - 1-2 sentences max]

Suggestion:
[ONE specific action with product details if available - be concrete and actionable - 2-3 sentences max]

TYPE: [product_pitch, objection_handling, closing, retention, or general]
PRIORITY: [high, medium, low]

🚫 NEVER DO:
- Generic advice like "suggest managed hosting" - NAME THE SPECIFIC PRODUCT
- Vague features - use ACTUAL product details from the list
- Long explanations - be concise and actionable
- Multiple suggestions - pick ONE best product/action
- Suggesting products not in the available list`;

    return prompt;
  }

  private parseCloudResponse(
    response: string,
    transcript: string,
    callType: string
  ): Omit<CoachingSuggestion, 'source'> {
    // Parse the structured response with Summary & Analysis and Suggestion sections
    const summaryAnalysisMatch = response.match(/Summary & Analysis:\s*\n?(.*?)(?=\n\s*Suggestion:|$)/is);
    const suggestionMatch = response.match(/Suggestion:\s*\n?(.*?)(?=\n\s*TYPE:|$)/is);
    const typeMatch = response.match(/TYPE:\s*(\w+)/i);
    const priorityMatch = response.match(/PRIORITY:\s*(\w+)/i);

    const summaryAnalysis = summaryAnalysisMatch ? summaryAnalysisMatch[1].trim() : '';
    const suggestionText = suggestionMatch ? suggestionMatch[1].trim() : '';
    
    // Combine both sections for the suggestion field with proper formatting
    let combinedSuggestion = '';
    if (summaryAnalysis && suggestionText) {
      combinedSuggestion = `Summary & Analysis:\n${this.cleanMarkdownFormatting(summaryAnalysis)}\n\nSuggestion:\n${this.cleanMarkdownFormatting(suggestionText)}`;
    } else {
      // Fallback to original parsing if format is not followed
      const fallbackMatch = response.match(/SUGGESTION:\s*(.+?)(?:\n|TYPE:|$)/i);
      combinedSuggestion = fallbackMatch ? this.cleanMarkdownFormatting(fallbackMatch[1].trim()) : this.cleanMarkdownFormatting(response.trim());
    }
    
    const type = this.validateType(typeMatch ? typeMatch[1].toLowerCase() : 'general');
    const priority = this.validatePriority(priorityMatch ? priorityMatch[1].toLowerCase() : 'medium');

    return {
      id: `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: this.generateTitle(type, callType),
      suggestion: combinedSuggestion,
      context: transcript.substring(0, 100) + '...',
      confidence: 0.85, // Cloud AI typically more confident
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
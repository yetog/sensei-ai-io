interface SuggestionFeedback {
  suggestionId: string;
  rating: 'helpful' | 'not_helpful';
  suggestionType: string;
  suggestionText: string;
  context: string;
  timestamp: number;
  reason?: string;
}

interface LearningPattern {
  keywords: string[];
  positivePatterns: string[];
  negativePatterns: string[];
  confidence: number;
  frequency: number;
}

class FeedbackLearningService {
  private readonly STORAGE_KEY = 'suggestion_feedback';
  private readonly PATTERNS_KEY = 'learning_patterns';
  
  // Store feedback and update learning patterns
  storeFeedback(feedback: SuggestionFeedback): void {
    try {
      // Store individual feedback
      const existingFeedback = this.getAllFeedback();
      existingFeedback.push(feedback);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFeedback));
      
      // Update learning patterns
      this.updateLearningPatterns(feedback);
      
      console.log('✅ Feedback stored and patterns updated:', feedback.rating);
    } catch (error) {
      console.error('❌ Failed to store feedback:', error);
    }
  }
  
  // Get all stored feedback
  getAllFeedback(): SuggestionFeedback[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  // Update learning patterns based on feedback
  private updateLearningPatterns(feedback: SuggestionFeedback): void {
    const patterns = this.getLearningPatterns();
    const keywords = this.extractKeywords(feedback.context + ' ' + feedback.suggestionText);
    
    // Find or create pattern for this suggestion type
    let pattern = patterns.find(p => p.keywords.some(k => keywords.includes(k)));
    
    if (!pattern) {
      pattern = {
        keywords: keywords.slice(0, 3), // Top 3 keywords
        positivePatterns: [],
        negativePatterns: [],
        confidence: 0.5,
        frequency: 0
      };
      patterns.push(pattern);
    }
    
    // Update patterns based on feedback
    if (feedback.rating === 'helpful') {
      pattern.positivePatterns.push(feedback.suggestionText);
      pattern.confidence = Math.min(pattern.confidence + 0.1, 1.0);
    } else {
      pattern.negativePatterns.push(feedback.suggestionText);
      pattern.confidence = Math.max(pattern.confidence - 0.1, 0.1);
    }
    
    pattern.frequency++;
    
    // Keep only recent patterns (max 100)
    if (patterns.length > 100) {
      patterns.sort((a, b) => b.frequency - a.frequency);
      patterns.splice(50); // Keep top 50
    }
    
    localStorage.setItem(this.PATTERNS_KEY, JSON.stringify(patterns));
  }
  
  // Get learning patterns for suggestion improvement
  getLearningPatterns(): LearningPattern[] {
    try {
      const stored = localStorage.getItem(this.PATTERNS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  // Extract keywords from text
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    return text
      .toLowerCase()
      .replace(/[^\\w\\s]/g, '')
      .split(/\\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }
  
  // Get feedback statistics
  getFeedbackStats(): { totalFeedback: number; helpfulRate: number; commonIssues: string[] } {
    const feedback = this.getAllFeedback();
    const helpful = feedback.filter(f => f.rating === 'helpful').length;
    const total = feedback.length;
    
    // Get common negative feedback reasons
    const negativeReasons = feedback
      .filter(f => f.rating === 'not_helpful' && f.reason)
      .map(f => f.reason!)
      .filter(Boolean);
    
    const reasonCounts = negativeReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonIssues = Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason]) => reason);
    
    return {
      totalFeedback: total,
      helpfulRate: total > 0 ? helpful / total : 0,
      commonIssues
    };
  }
  
  // Improve suggestion based on learned patterns
  improveSuggestion(suggestion: string, context: string): string {
    const patterns = this.getLearningPatterns();
    const contextKeywords = this.extractKeywords(context);
    
    // Find relevant patterns
    const relevantPatterns = patterns.filter(pattern => 
      pattern.keywords.some(keyword => contextKeywords.includes(keyword))
    );
    
    if (relevantPatterns.length === 0) return suggestion;
    
    // Apply improvements based on successful patterns
    const positivePatterns = relevantPatterns
      .filter(p => p.confidence > 0.7)
      .flatMap(p => p.positivePatterns);
    
    if (positivePatterns.length > 0) {
      // Use elements from successful patterns
      const successfulElements = positivePatterns
        .map(p => this.extractKeywords(p))
        .flat()
        .filter(keyword => !this.extractKeywords(suggestion).includes(keyword))
        .slice(0, 2);
      
      if (successfulElements.length > 0) {
        console.log('🎯 Applying learned improvements to suggestion');
        return `${suggestion} Consider also: ${successfulElements.join(', ')}`;
      }
    }
    
    return suggestion;
  }
  
  // Clear all learning data
  clearLearningData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.PATTERNS_KEY);
    console.log('🧹 Learning data cleared');
  }
}

export const feedbackLearning = new FeedbackLearningService();
export type { SuggestionFeedback, LearningPattern };

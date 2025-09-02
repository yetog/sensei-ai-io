interface AnalyticsEvent {
  type: 'chat_start' | 'quote_generated' | 'podcast_generated' | 'file_uploaded' | 'agent_switch';
  timestamp: number;
  userId?: string;
  agentType?: string;
  metadata?: Record<string, any>;
}

interface UserMetrics {
  totalChats: number;
  quotesGenerated: number;
  podcastsGenerated: number;
  filesUploaded: number;
  avgResponseTime: number;
  lastActive: number;
  preferredAgent: string;
}

interface BetaMetrics {
  responseTime: number[];
  pitchQuality: number[];
  quotesPerDay: number[];
  conversionRate: number;
  userSatisfaction: number[];
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];
  private userId: string;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  constructor() {
    this.userId = this.getOrCreateUserId();
    this.loadEvents();
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('analytics-user-id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics-user-id', userId);
    }
    return userId;
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem('analytics-events');
      this.events = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading analytics events:', error);
      this.events = [];
    }
  }

  private saveEvents(): void {
    try {
      // Keep only last 1000 events to prevent storage bloat
      const recentEvents = this.events.slice(-1000);
      localStorage.setItem('analytics-events', JSON.stringify(recentEvents));
      this.events = recentEvents;
    } catch (error) {
      console.error('Error saving analytics events:', error);
    }
  }

  trackEvent(type: AnalyticsEvent['type'], metadata?: Record<string, any>, agentType?: string): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      userId: this.userId,
      agentType,
      metadata
    };

    this.events.push(event);
    this.saveEvents();

    // In production, you'd send this to your analytics backend
    console.log('Analytics Event:', event);
  }

  // Beta Testing KPIs
  trackResponseTime(timeMs: number): void {
    this.trackEvent('chat_start', { responseTime: timeMs });
  }

  trackPitchQuality(rating: number): void {
    this.trackEvent('chat_start', { pitchQuality: rating });
  }

  trackQuoteGenerated(quoteValue: number, conversionStatus?: 'pending' | 'won' | 'lost'): void {
    this.trackEvent('quote_generated', { 
      quoteValue, 
      conversionStatus,
      date: new Date().toISOString().split('T')[0]
    });
  }

  getUserMetrics(): UserMetrics {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp > thirtyDaysAgo);

    const chatEvents = recentEvents.filter(e => e.type === 'chat_start');
    const quoteEvents = recentEvents.filter(e => e.type === 'quote_generated');
    const podcastEvents = recentEvents.filter(e => e.type === 'podcast_generated');
    const fileEvents = recentEvents.filter(e => e.type === 'file_uploaded');
    const agentSwitches = recentEvents.filter(e => e.type === 'agent_switch');

    // Calculate average response time
    const responseTimes = chatEvents
      .map(e => e.metadata?.responseTime)
      .filter(t => typeof t === 'number');
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Find preferred agent
    const agentCounts: Record<string, number> = {};
    chatEvents.forEach(e => {
      if (e.agentType) {
        agentCounts[e.agentType] = (agentCounts[e.agentType] || 0) + 1;
      }
    });
    const preferredAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'AI Assistant';

    return {
      totalChats: chatEvents.length,
      quotesGenerated: quoteEvents.length,
      podcastsGenerated: podcastEvents.length,
      filesUploaded: fileEvents.length,
      avgResponseTime,
      lastActive: Math.max(...recentEvents.map(e => e.timestamp), 0),
      preferredAgent
    };
  }

  getBetaMetrics(): BetaMetrics {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp > sevenDaysAgo);

    // Response times (in milliseconds)
    const responseTimes = recentEvents
      .filter(e => e.type === 'chat_start' && e.metadata?.responseTime)
      .map(e => e.metadata!.responseTime);

    // Pitch quality ratings (1-5 scale)
    const pitchQuality = recentEvents
      .filter(e => e.type === 'chat_start' && e.metadata?.pitchQuality)
      .map(e => e.metadata!.pitchQuality);

    // Quotes per day
    const quotesByDay: Record<string, number> = {};
    recentEvents
      .filter(e => e.type === 'quote_generated')
      .forEach(e => {
        const date = new Date(e.timestamp).toISOString().split('T')[0];
        quotesByDay[date] = (quotesByDay[date] || 0) + 1;
      });
    const quotesPerDay = Object.values(quotesByDay);

    // Conversion rate (quotes won / quotes generated)
    const quoteEvents = recentEvents.filter(e => e.type === 'quote_generated');
    const wonQuotes = quoteEvents.filter(e => e.metadata?.conversionStatus === 'won').length;
    const conversionRate = quoteEvents.length > 0 ? wonQuotes / quoteEvents.length : 0;

    // User satisfaction (mock data for now)
    const userSatisfaction = pitchQuality.length > 0 ? pitchQuality : [4, 4, 5, 4, 5];

    return {
      responseTime: responseTimes,
      pitchQuality,
      quotesPerDay,
      conversionRate,
      userSatisfaction
    };
  }

  exportBetaReport(): string {
    const metrics = this.getBetaMetrics();
    const userMetrics = this.getUserMetrics();
    
    const report = `
SENSEI AI BETA TEST REPORT
Generated: ${new Date().toLocaleDateString()}
User ID: ${this.userId}

=== KEY PERFORMANCE INDICATORS ===
1. Response Time: ${metrics.responseTime.length > 0 ? `${Math.round(metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length)}ms avg` : 'No data'}
2. Pitch Quality: ${metrics.pitchQuality.length > 0 ? `${(metrics.pitchQuality.reduce((a, b) => a + b, 0) / metrics.pitchQuality.length).toFixed(1)}/5 avg` : 'No data'}
3. Quotes Generated: ${userMetrics.quotesGenerated} total, ${metrics.quotesPerDay.reduce((a, b) => a + b, 0)} this week

=== USAGE METRICS ===
- Total Conversations: ${userMetrics.totalChats}
- Files Uploaded: ${userMetrics.filesUploaded}
- Podcasts Generated: ${userMetrics.podcastsGenerated}
- Preferred Agent: ${userMetrics.preferredAgent}
- Conversion Rate: ${(metrics.conversionRate * 100).toFixed(1)}%

=== ENGAGEMENT ===
- Last Active: ${new Date(userMetrics.lastActive).toLocaleDateString()}
- Average Session Quality: ${metrics.userSatisfaction.length > 0 ? (metrics.userSatisfaction.reduce((a, b) => a + b, 0) / metrics.userSatisfaction.length).toFixed(1) : 'N/A'}/5

=== RECOMMENDATIONS ===
${this.generateRecommendations(metrics, userMetrics)}
    `.trim();

    return report;
  }

  private generateRecommendations(betaMetrics: BetaMetrics, userMetrics: UserMetrics): string {
    const recommendations: string[] = [];

    if (betaMetrics.responseTime.length > 0) {
      const avgResponseTime = betaMetrics.responseTime.reduce((a, b) => a + b, 0) / betaMetrics.responseTime.length;
      if (avgResponseTime > 3000) {
        recommendations.push('- Consider optimizing API response times for better user experience');
      }
    }

    if (userMetrics.quotesGenerated < 5) {
      recommendations.push('- Explore the Quote Generator feature for automated sales proposals');
    }

    if (userMetrics.podcastsGenerated < 2) {
      recommendations.push('- Try the Podcast Generator for meeting preparation');
    }

    if (betaMetrics.conversionRate < 0.3) {
      recommendations.push('- Focus on objection handling and value proposition refinement');
    }

    if (recommendations.length === 0) {
      recommendations.push('- Great usage patterns! Continue leveraging all available features');
    }

    return recommendations.join('\n');
  }

  clearData(): void {
    this.events = [];
    localStorage.removeItem('analytics-events');
    console.log('Analytics data cleared');
  }
}

export const analyticsService = AnalyticsService.getInstance();

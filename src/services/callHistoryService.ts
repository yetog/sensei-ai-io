interface CallHistoryItem {
  id: string;
  timestamp: number;
  duration: string;
  customerName?: string;
  callType: string;
  keyPoints: string[];
  objections: string[];
  nextSteps: string[];
  outcome: 'follow_up' | 'quote_needed' | 'closed' | 'no_interest' | 'demo_scheduled';
  transcriptHighlights: string[];
  followUpEmail?: string;
  notes?: string;
}

interface CallAnalytics {
  totalCalls: number;
  averageDuration: string;
  successRate: number;
  commonObjections: { objection: string; count: number }[];
  outcomesBreakdown: Record<string, number>;
  monthlyTrends: { month: string; calls: number; success: number }[];
}

class CallHistoryService {
  private readonly STORAGE_KEY = 'wolf_ai_call_history';
  private readonly MAX_HISTORY_ITEMS = 100;

  /**
   * Save a call to history
   */
  saveCall(callData: Omit<CallHistoryItem, 'id' | 'timestamp'>): CallHistoryItem {
    const call: CallHistoryItem = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...callData
    };

    const history = this.getCallHistory();
    history.unshift(call);

    // Keep only the most recent calls
    if (history.length > this.MAX_HISTORY_ITEMS) {
      history.splice(this.MAX_HISTORY_ITEMS);
    }

    this.saveToStorage(history);
    return call;
  }

  /**
   * Get all call history
   */
  getCallHistory(): CallHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load call history:', error);
      return [];
    }
  }

  /**
   * Get call history filtered by date range
   */
  getCallHistoryByDateRange(startDate: Date, endDate: Date): CallHistoryItem[] {
    const history = this.getCallHistory();
    return history.filter(call => {
      const callDate = new Date(call.timestamp);
      return callDate >= startDate && callDate <= endDate;
    });
  }

  /**
   * Get call history filtered by outcome
   */
  getCallHistoryByOutcome(outcome: CallHistoryItem['outcome']): CallHistoryItem[] {
    const history = this.getCallHistory();
    return history.filter(call => call.outcome === outcome);
  }

  /**
   * Update a call in history
   */
  updateCall(callId: string, updates: Partial<CallHistoryItem>): boolean {
    const history = this.getCallHistory();
    const index = history.findIndex(call => call.id === callId);
    
    if (index === -1) return false;

    history[index] = { ...history[index], ...updates };
    this.saveToStorage(history);
    return true;
  }

  /**
   * Delete a call from history
   */
  deleteCall(callId: string): boolean {
    const history = this.getCallHistory();
    const filteredHistory = history.filter(call => call.id !== callId);
    
    if (filteredHistory.length === history.length) return false;

    this.saveToStorage(filteredHistory);
    return true;
  }

  /**
   * Get call analytics
   */
  getCallAnalytics(): CallAnalytics {
    const history = this.getCallHistory();
    
    if (history.length === 0) {
      return {
        totalCalls: 0,
        averageDuration: '0:00',
        successRate: 0,
        commonObjections: [],
        outcomesBreakdown: {},
        monthlyTrends: []
      };
    }

    // Calculate success rate (closed + demo_scheduled)
    const successfulCalls = history.filter(call => 
      call.outcome === 'closed' || call.outcome === 'demo_scheduled'
    ).length;
    const successRate = (successfulCalls / history.length) * 100;

    // Calculate average duration
    const totalMinutes = history.reduce((sum, call) => {
      const [minutes, seconds] = call.duration.split(':').map(Number);
      return sum + minutes + (seconds / 60);
    }, 0);
    const avgMinutes = Math.floor(totalMinutes / history.length);
    const avgSeconds = Math.floor(((totalMinutes / history.length) % 1) * 60);
    const averageDuration = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;

    // Count common objections
    const objectionCounts: Record<string, number> = {};
    history.forEach(call => {
      call.objections.forEach(objection => {
        objectionCounts[objection] = (objectionCounts[objection] || 0) + 1;
      });
    });
    const commonObjections = Object.entries(objectionCounts)
      .map(([objection, count]) => ({ objection, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Outcomes breakdown
    const outcomesBreakdown: Record<string, number> = {};
    history.forEach(call => {
      outcomesBreakdown[call.outcome] = (outcomesBreakdown[call.outcome] || 0) + 1;
    });

    // Monthly trends (last 6 months)
    const monthlyTrends = this.getMonthlyTrends(history);

    return {
      totalCalls: history.length,
      averageDuration,
      successRate: Math.round(successRate),
      commonObjections,
      outcomesBreakdown,
      monthlyTrends
    };
  }

  /**
   * Search call history
   */
  searchCalls(query: string): CallHistoryItem[] {
    const history = this.getCallHistory();
    const lowerQuery = query.toLowerCase();

    return history.filter(call => 
      call.customerName?.toLowerCase().includes(lowerQuery) ||
      call.keyPoints.some(point => point.toLowerCase().includes(lowerQuery)) ||
      call.objections.some(objection => objection.toLowerCase().includes(lowerQuery)) ||
      call.nextSteps.some(step => step.toLowerCase().includes(lowerQuery)) ||
      call.notes?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Export call history to CSV
   */
  exportToCSV(): string {
    const history = this.getCallHistory();
    const headers = [
      'Date',
      'Duration',
      'Customer',
      'Call Type',
      'Outcome',
      'Key Points',
      'Objections',
      'Next Steps'
    ];

    const rows = history.map(call => [
      new Date(call.timestamp).toLocaleDateString(),
      call.duration,
      call.customerName || 'Unknown',
      call.callType,
      call.outcome,
      call.keyPoints.join('; '),
      call.objections.join('; '),
      call.nextSteps.join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `\"${field}\"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Clear all call history
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Private helper methods
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private saveToStorage(history: CallHistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save call history:', error);
    }
  }

  private getMonthlyTrends(history: CallHistoryItem[]): { month: string; calls: number; success: number }[] {
    const now = new Date();
    const trends: { month: string; calls: number; success: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthCalls = history.filter(call => {
        const callDate = new Date(call.timestamp);
        return callDate.getMonth() === date.getMonth() && callDate.getFullYear() === date.getFullYear();
      });

      const successfulCalls = monthCalls.filter(call => 
        call.outcome === 'closed' || call.outcome === 'demo_scheduled'
      ).length;

      trends.push({
        month: monthKey,
        calls: monthCalls.length,
        success: successfulCalls
      });
    }

    return trends;
  }
}

export const callHistoryService = new CallHistoryService();
export type { CallHistoryItem, CallAnalytics };

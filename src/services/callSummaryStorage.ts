interface StoredCallSummary {
  id: string;
  timestamp: number;
  customerName?: string;
  companyName?: string;
  keyPain?: string;
  desiredOutcome?: string;
  callType: string;
  duration: string;
  keyPoints: string[];
  objections: string[];
  nextSteps: string[];
  outcome: string;
  transcriptHighlights: string[];
  followUpEmail?: string;
}

class CallSummaryStorage {
  private readonly STORAGE_KEY = 'coaching_call_summaries';

  saveCallSummary(summary: Omit<StoredCallSummary, 'id' | 'timestamp'>): string {
    const summaries = this.getAllSummaries();
    const id = Date.now().toString();
    const storedSummary: StoredCallSummary = {
      ...summary,
      id,
      timestamp: Date.now()
    };
    
    summaries.push(storedSummary);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(summaries));
    
    return id;
  }

  getAllSummaries(): StoredCallSummary[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading call summaries:', error);
      return [];
    }
  }

  getSummaryById(id: string): StoredCallSummary | undefined {
    const summaries = this.getAllSummaries();
    return summaries.find(summary => summary.id === id);
  }

  deleteSummary(id: string): boolean {
    const summaries = this.getAllSummaries();
    const filteredSummaries = summaries.filter(summary => summary.id !== id);
    
    if (filteredSummaries.length !== summaries.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSummaries));
      return true;
    }
    
    return false;
  }

  updateSummary(id: string, updates: Partial<StoredCallSummary>): boolean {
    const summaries = this.getAllSummaries();
    const summaryIndex = summaries.findIndex(summary => summary.id === id);
    
    if (summaryIndex >= 0) {
      summaries[summaryIndex] = { ...summaries[summaryIndex], ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(summaries));
      return true;
    }
    
    return false;
  }

  getRecentSummaries(limit: number = 10): StoredCallSummary[] {
    return this.getAllSummaries()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

export const callSummaryStorage = new CallSummaryStorage();
export type { StoredCallSummary };
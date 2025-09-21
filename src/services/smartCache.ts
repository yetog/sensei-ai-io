interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  lastAccess: number;
  pattern?: string;
}

interface CoachingPattern {
  keywords: string[];
  context: string;
  response: string;
  frequency: number;
  lastUsed: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private patterns: CoachingPattern[] = [];
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly PATTERN_THRESHOLD = 3; // Minimum frequency for pattern recognition

  // IndexedDB setup for persistent storage
  private dbName = 'CoachingCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize() {
    try {
      this.db = await this.openDB();
      await this.loadFromPersistent();
      console.log('💾 Smart cache initialized with persistent storage');
    } catch (error) {
      console.warn('⚠️ Smart cache fallback to memory-only mode:', error);
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('coaching_responses')) {
          db.createObjectStore('coaching_responses', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('conversation_patterns')) {
          db.createObjectStore('conversation_patterns', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  private async loadFromPersistent() {
    if (!this.db) return;

    const transaction = this.db.transaction(['coaching_responses', 'conversation_patterns'], 'readonly');
    
    // Load cached responses
    const responseStore = transaction.objectStore('coaching_responses');
    const responseRequest = responseStore.getAll();
    
    responseRequest.onsuccess = () => {
      responseRequest.result.forEach(item => {
        if (this.isValidCacheEntry(item.value)) {
          this.cache.set(item.key, item.value);
        }
      });
    };

    // Load patterns
    const patternStore = transaction.objectStore('conversation_patterns');
    const patternRequest = patternStore.getAll();
    
    patternRequest.onsuccess = () => {
      this.patterns = patternRequest.result
        .filter(item => item.frequency >= this.PATTERN_THRESHOLD)
        .sort((a, b) => b.frequency - a.frequency);
    };
  }

  private isValidCacheEntry(entry: any): boolean {
    const now = Date.now();
    return entry && 
           entry.timestamp && 
           (now - entry.timestamp) < this.DEFAULT_TTL;
  }

  // Get cached coaching response
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || !this.isValidCacheEntry(entry)) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    entry.lastAccess = Date.now();
    return entry.data;
  }

  // Store coaching response with pattern recognition
  async set<T>(key: string, data: T, context?: string): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      hits: 1,
      lastAccess: now,
      pattern: context
    };

    this.cache.set(key, entry);
    
    // Update conversation patterns
    if (context) {
      await this.updatePattern(key, context, data as any);
    }

    // Cleanup if cache too large
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    // Persist to IndexedDB
    await this.persistEntry(key, entry);
  }

  private async updatePattern(key: string, context: string, response: any) {
    const keywords = this.extractKeywords(context);
    const existingPattern = this.patterns.find(p => 
      p.keywords.some(k => keywords.includes(k))
    );

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastUsed = Date.now();
      existingPattern.response = response.suggestion || response;
    } else {
      this.patterns.push({
        keywords,
        context: context.substring(0, 200),
        response: response.suggestion || response,
        frequency: 1,
        lastUsed: Date.now()
      });
    }

    // Persist pattern updates
    await this.persistPatterns();
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were'].includes(word))
      .slice(0, 5);
  }

  // Predict coaching response based on patterns
  predictResponse(context: string): string | null {
    const keywords = this.extractKeywords(context);
    const matchingPattern = this.patterns.find(pattern => 
      pattern.keywords.some(k => keywords.includes(k)) &&
      pattern.frequency >= this.PATTERN_THRESHOLD
    );

    if (matchingPattern) {
      console.log('🎯 Cache hit: Pattern-based prediction used');
      return matchingPattern.response;
    }

    return null;
  }

  // Pre-cache common responses
  async preCacheCommonResponses() {
    const commonScenarios = [
      { context: "customer price objection expensive cost budget", response: "I understand price is a concern. Let's look at the ROI and value proposition..." },
      { context: "customer needs time to think decide", response: "That's completely reasonable. What specific information would help you make this decision?" },
      { context: "customer interested but needs approval", response: "Great! What's the typical approval process at your company? I'd be happy to provide materials..." },
      { context: "customer technical questions features", response: "Excellent question! Let me walk you through exactly how that works..." },
      { context: "customer competitor comparison", response: "I appreciate you doing your research. Here's how we compare and what makes us unique..." }
    ];

    for (const scenario of commonScenarios) {
      const key = `pattern_${scenario.context.replace(/\s+/g, '_')}`;
      await this.set(key, { suggestion: scenario.response, type: 'pattern_based' }, scenario.context);
    }

    console.log('🚀 Pre-cached common coaching responses');
  }

  private async persistEntry(key: string, entry: CacheEntry<any>) {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['coaching_responses'], 'readwrite');
      const store = transaction.objectStore('coaching_responses');
      await store.put({ key, value: entry });
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  private async persistPatterns() {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['conversation_patterns'], 'readwrite');
      const store = transaction.objectStore('conversation_patterns');
      
      // Clear existing patterns
      await store.clear();
      
      // Store updated patterns
      for (const pattern of this.patterns) {
        await store.add(pattern);
      }
    } catch (error) {
      console.warn('Failed to persist patterns:', error);
    }
  }

  private cleanup() {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last access time and hits (LRU + frequency)
    entries.sort((a, b) => {
      const aScore = a[1].hits + (a[1].lastAccess / 1000000);
      const bScore = b[1].hits + (b[1].lastAccess / 1000000);
      return aScore - bScore;
    });

    // Remove bottom 20%
    const removeCount = Math.floor(entries.length * 0.2);
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`🧹 Cache cleanup: Removed ${removeCount} entries`);
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const averageAge = entries.length > 0 
      ? (Date.now() - entries.reduce((sum, entry) => sum + entry.timestamp, 0) / entries.length) / 1000 / 60
      : 0;

    return {
      size: this.cache.size,
      totalHits,
      hitRate: totalHits > 0 ? (totalHits / this.cache.size) : 0,
      averageAgeMinutes: Math.round(averageAge),
      patternCount: this.patterns.length,
      topPatterns: this.patterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map(p => ({ keywords: p.keywords, frequency: p.frequency }))
    };
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.patterns = [];
    
    if (this.db) {
      const transaction = this.db.transaction(['coaching_responses', 'conversation_patterns'], 'readwrite');
      transaction.objectStore('coaching_responses').clear();
      transaction.objectStore('conversation_patterns').clear();
    }
  }
}

export const smartCache = new SmartCache();
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'product_info' | 'objection_handling' | 'pricing' | 'process' | 'competitor' | 'general';
  tags: string[];
  lastUpdated: number;
  searchableText: string;
}

interface SearchResult {
  document: KnowledgeDocument;
  relevanceScore: number;
  matchedContent: string;
}

class KnowledgeBaseService {
  private documents: KnowledgeDocument[] = [];
  private readonly storageKey = 'sensei-knowledge-base';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultKnowledge();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.documents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.documents));
    } catch (error) {
      console.error('Error saving knowledge base:', error);
    }
  }

  private initializeDefaultKnowledge(): void {
    if (this.documents.length === 0) {
      const defaultDocs: Omit<KnowledgeDocument, 'id' | 'lastUpdated' | 'searchableText'>[] = [
        {
          title: "Price Objection Handling",
          content: `When customers say "It's too expensive":
          
1. **Acknowledge & Understand**: "I understand price is an important consideration. Can you help me understand what specifically concerns you about the investment?"

2. **Reframe Value**: "Let me show you how this actually saves you money in the long run..."

3. **Break Down Costs**: "When we break this down to daily cost, it's less than a cup of coffee..."

4. **Social Proof**: "Many of our clients initially had the same concern, but they found..."

5. **Alternative Options**: "We do have different packages that might better fit your budget..."`,
          type: 'objection_handling',
          tags: ['price', 'objections', 'cost', 'budget']
        },
        {
          title: "Product Benefits & Features",
          content: `Key Product Strengths:

**Core Features:**
- Real-time coaching and suggestions
- AI-powered conversation analysis  
- Customizable knowledge base
- GDPR-compliant data handling
- Multi-scenario support (sales, retention, outbound)

**Unique Value Propositions:**
- Increases sales conversion by 25-40%
- Reduces training time for new reps
- Provides consistent messaging across team
- Real-time objection handling support
- Improves customer satisfaction scores

**ROI Drivers:**
- Faster onboarding of new sales reps
- Higher close rates on existing opportunities
- Better retention through improved customer interactions
- Reduced coaching overhead for managers`,
          type: 'product_info',
          tags: ['features', 'benefits', 'roi', 'value']
        },
        {
          title: "Competitor Comparison",
          content: `How We Compare to Competitors:

**vs. Traditional Training:**
- Our Solution: Real-time, in-the-moment coaching
- Traditional: Periodic training sessions, no real-time support

**vs. Call Recording Solutions:**
- Our Solution: Live coaching during calls + post-call analysis
- Recording Tools: Only post-call review, no live assistance

**vs. Other AI Coaching Tools:**
- Our Solution: GDPR compliant, customizable knowledge base
- Others: Often cloud-based with data privacy concerns

**Key Differentiators:**
- Privacy-first approach (local processing)
- Industry-specific customization
- Real-time suggestions, not just analysis
- Integration with existing workflows`,
          type: 'competitor',
          tags: ['competition', 'comparison', 'differentiation']
        },
        {
          title: "Closing Techniques",
          content: `Effective Closing Strategies:

**1. Assumptive Close:**
"When would you like to start the onboarding process?"

**2. Alternative Close:**
"Would you prefer to start with the basic package or go with the full suite?"

**3. Urgency Close:**
"We have a special implementation rate this month for new clients..."

**4. Trial Close:**
"How does this sound so far? Any concerns I can address?"

**5. Benefits Summary Close:**
"So you'll get real-time coaching, improved conversion rates, and faster team training. Shall we move forward?"

**Buying Signals to Watch For:**
- Asking about implementation timeline
- Inquiring about pricing details
- Questions about team training
- Discussing internal approval process`,
          type: 'process',
          tags: ['closing', 'techniques', 'sales', 'buying signals']
        }
      ];

      defaultDocs.forEach(doc => this.addDocument(doc));
    }
  }

  addDocument(doc: Omit<KnowledgeDocument, 'id' | 'lastUpdated' | 'searchableText'>): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const searchableText = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
    
    const newDoc: KnowledgeDocument = {
      ...doc,
      id,
      lastUpdated: Date.now(),
      searchableText
    };

    this.documents.push(newDoc);
    this.saveToStorage();
    return id;
  }

  updateDocument(id: string, updates: Partial<Omit<KnowledgeDocument, 'id'>>): boolean {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index === -1) return false;

    const updatedDoc = { ...this.documents[index], ...updates, lastUpdated: Date.now() };
    updatedDoc.searchableText = `${updatedDoc.title} ${updatedDoc.content} ${updatedDoc.tags.join(' ')}`.toLowerCase();
    
    this.documents[index] = updatedDoc;
    this.saveToStorage();
    return true;
  }

  deleteDocument(id: string): boolean {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(doc => doc.id !== id);
    
    if (this.documents.length < initialLength) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  search(query: string, limit: number = 5): SearchResult[] {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    this.documents.forEach(doc => {
      let relevanceScore = 0;
      let matchedContent = '';

      // Check title matches (higher weight)
      searchTerms.forEach(term => {
        if (doc.title.toLowerCase().includes(term)) {
          relevanceScore += 3;
        }
      });

      // Check content matches
      searchTerms.forEach(term => {
        const contentLower = doc.content.toLowerCase();
        const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
        relevanceScore += matches;

        // Extract context around matches
        const termIndex = contentLower.indexOf(term);
        if (termIndex !== -1) {
          const start = Math.max(0, termIndex - 50);
          const end = Math.min(doc.content.length, termIndex + 100);
          matchedContent = doc.content.substring(start, end);
        }
      });

      // Check tag matches
      searchTerms.forEach(term => {
        if (doc.tags.some(tag => tag.toLowerCase().includes(term))) {
          relevanceScore += 2;
        }
      });

      if (relevanceScore > 0) {
        results.push({
          document: doc,
          relevanceScore,
          matchedContent: matchedContent || doc.content.substring(0, 100)
        });
      }
    });

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  getDocumentsByType(type: KnowledgeDocument['type']): KnowledgeDocument[] {
    return this.documents.filter(doc => doc.type === type);
  }

  getAllDocuments(): KnowledgeDocument[] {
    return [...this.documents];
  }

  getDocumentById(id: string): KnowledgeDocument | null {
    return this.documents.find(doc => doc.id === id) || null;
  }

  importFromFile(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let imported = 0;

          if (file.type === 'application/json') {
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
              data.forEach(doc => {
                if (doc.title && doc.content) {
                  this.addDocument({
                    title: doc.title,
                    content: doc.content,
                    type: doc.type || 'general',
                    tags: doc.tags || []
                  });
                  imported++;
                }
              });
            }
          } else {
            // Import as single text document
            this.addDocument({
              title: file.name.replace(/\.[^/.]+$/, ''),
              content: content,
              type: 'general',
              tags: ['imported']
            });
            imported = 1;
          }

          resolve(imported);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  exportToJson(): string {
    return JSON.stringify(this.documents, null, 2);
  }
}

export const knowledgeBase = new KnowledgeBaseService();
export type { KnowledgeDocument, SearchResult };
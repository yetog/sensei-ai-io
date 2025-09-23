// Enhanced duplicate detection utilities for transcript processing

export interface TranscriptEntry {
  content: string;
  timestamp: number;
  hash: string;
}

export interface PhraseData {
  count: number;
  lastSeen: number;
}

// Generate a simple but effective hash for content
export function generateContentHash(text: string): string {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  return btoa(cleanText).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

// Check for exact content duplicates within time window
export function detectExactDuplicate(
  text: string, 
  recentTranscripts: TranscriptEntry[],
  timeWindow: number = 10000
): boolean {
  const now = Date.now();
  const textHash = generateContentHash(text);
  
  return recentTranscripts.some(recent => 
    recent.hash === textHash && 
    (now - recent.timestamp) < timeWindow
  );
}

// Detect repetitive patterns in speech
export function detectRepetitivePattern(
  text: string,
  phraseFrequency: Map<string, PhraseData>,
  maxOccurrences: number = 2,
  timeWindow: number = 30000
): boolean {
  const now = Date.now();
  const words = text.toLowerCase().split(' ');
  
  // Check for 3+ word sequences
  for (let i = 0; i <= words.length - 3; i++) {
    const phrase = words.slice(i, i + 3).join(' ');
    const phraseData = phraseFrequency.get(phrase);
    
    if (phraseData) {
      // Reset count if outside time window
      if (now - phraseData.lastSeen > timeWindow) {
        phraseData.count = 0;
      }
      
      phraseData.count++;
      phraseData.lastSeen = now;
      
      if (phraseData.count > maxOccurrences) {
        return true; // Repetitive pattern detected
      }
    } else {
      phraseFrequency.set(phrase, { count: 1, lastSeen: now });
    }
  }
  
  return false;
}

// Check if text is largely a substring of recent content
export function isSubstringDuplicate(
  text: string,
  recentTranscripts: TranscriptEntry[],
  threshold: number = 0.9
): boolean {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  return recentTranscripts.some(recent => {
    const recentClean = recent.content.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (recentClean.length > 0 && cleanText.length > 0) {
      const containmentRatio = recentClean.includes(cleanText) ? 1 : 
        cleanText.includes(recentClean) ? 1 : 0;
      return containmentRatio >= threshold;
    }
    return false;
  });
}

// Clean up old tracking data
export function cleanupOldData(
  recentTranscripts: TranscriptEntry[],
  phraseFrequency: Map<string, PhraseData>,
  contentHashSet: Set<string>,
  maxAge: number = 60000
) {
  const now = Date.now();
  
  // Clean recent transcripts
  const validTranscripts = recentTranscripts.filter(t => (now - t.timestamp) < maxAge);
  recentTranscripts.length = 0;
  recentTranscripts.push(...validTranscripts);
  
  // Clean phrase frequency
  for (const [phrase, data] of phraseFrequency.entries()) {
    if (now - data.lastSeen > maxAge) {
      phraseFrequency.delete(phrase);
    }
  }
  
  // Clean content hash set
  const validHashes = new Set(validTranscripts.map(t => t.hash));
  contentHashSet.clear();
  validHashes.forEach(hash => contentHashSet.add(hash));
}
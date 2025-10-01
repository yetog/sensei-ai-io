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

// Detect if we're in a preview/iframe environment
function isPreviewEnvironment(): boolean {
  try {
    return window.self !== window.top || 
           window.location.hostname.includes('lovable.app') ||
           window.location.hostname.includes('lovable.dev');
  } catch {
    return true; // Assume preview if we can't check
  }
}

// Get storage mechanism based on environment
function getStorage(): Storage {
  return isPreviewEnvironment() ? sessionStorage : localStorage;
}

// Generate a simple but effective hash for content
export function generateContentHash(text: string): string {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  return btoa(cleanText).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

// Check for exact content duplicates within time window
// Preview environments get STRICTER thresholds due to iframe speech recognition issues
export function detectExactDuplicate(
  text: string, 
  recentTranscripts: TranscriptEntry[],
  timeWindow?: number
): boolean {
  // Use MUCH stricter time window in preview environments to catch iframe duplicates
  const effectiveTimeWindow = timeWindow ?? (isPreviewEnvironment() ? 2000 : 10000);
  const now = Date.now();
  const textHash = generateContentHash(text);
  
  // In preview mode, be much more aggressive about blocking duplicates
  if (isPreviewEnvironment()) {
    // Check for ANY occurrence in recent history (not just within time window)
    const recentMatch = recentTranscripts.slice(-10).some(recent => recent.hash === textHash);
    if (recentMatch) return true;
  }
  
  return recentTranscripts.some(recent => 
    recent.hash === textHash && 
    (now - recent.timestamp) < effectiveTimeWindow
  );
}

// Detect repetitive patterns in speech
// Preview environments get STRICTER thresholds to prevent massive duplication
export function detectRepetitivePattern(
  text: string,
  phraseFrequency: Map<string, PhraseData>,
  maxOccurrences?: number,
  timeWindow?: number
): boolean {
  // Preview environments: MUCH stricter (iframe speech recognition creates massive duplicates)
  const isPrev = isPreviewEnvironment();
  const effectiveMaxOccurrences = maxOccurrences ?? (isPrev ? 2 : 2);
  const effectiveTimeWindow = timeWindow ?? (isPrev ? 10000 : 30000);
  
  const now = Date.now();
  const words = text.toLowerCase().split(' ');
  
  // Check for 3+ word sequences
  for (let i = 0; i <= words.length - 3; i++) {
    const phrase = words.slice(i, i + 3).join(' ');
    const phraseData = phraseFrequency.get(phrase);
    
    if (phraseData) {
      // Reset count if outside time window
      if (now - phraseData.lastSeen > effectiveTimeWindow) {
        phraseData.count = 0;
      }
      
      phraseData.count++;
      phraseData.lastSeen = now;
      
      if (phraseData.count > effectiveMaxOccurrences) {
        return true; // Repetitive pattern detected
      }
    } else {
      phraseFrequency.set(phrase, { count: 1, lastSeen: now });
    }
  }
  
  return false;
}

// Check if text is largely a substring of recent content
// Preview environments get STRICTER substring matching to catch iframe duplicates
export function isSubstringDuplicate(
  text: string,
  recentTranscripts: TranscriptEntry[],
  threshold?: number
): boolean {
  // Preview: MUCH LOWER threshold = MORE strict (catch more duplicates)
  // Reduced from 0.75 to 0.7 for even stricter matching
  const effectiveThreshold = threshold ?? (isPreviewEnvironment() ? 0.7 : 0.9);
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  return recentTranscripts.some(recent => {
    const recentClean = recent.content.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (recentClean.length > 0 && cleanText.length > 0) {
      const containmentRatio = recentClean.includes(cleanText) ? 1 : 
        cleanText.includes(recentClean) ? 1 : 0;
      return containmentRatio >= effectiveThreshold;
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
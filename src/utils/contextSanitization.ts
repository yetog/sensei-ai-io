// Context sanitization utilities to clean corrupted transcripts before AI processing

export interface SanitizationResult {
  cleanedText: string;
  duplicatesRemoved: number;
  quality: number; // 0-1 score
  isValid: boolean;
}

// Remove obvious duplicate patterns from text
export function sanitizeTranscript(text: string): SanitizationResult {
  const original = text;
  let cleaned = text;
  let duplicatesRemoved = 0;

  // Remove consecutive duplicate words (e.g., "hello hello hello" -> "hello")
  const words = cleaned.split(/\s+/);
  const dedupedWords: string[] = [];
  let consecutiveCount = 1;

  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i].toLowerCase();
    const prevWord = i > 0 ? words[i - 1].toLowerCase() : '';

    if (currentWord === prevWord) {
      consecutiveCount++;
      if (consecutiveCount > 3) {
        // Skip this word if it's repeated more than 3 times
        duplicatesRemoved++;
        continue;
      }
    } else {
      consecutiveCount = 1;
    }

    dedupedWords.push(words[i]);
  }

  cleaned = dedupedWords.join(' ');

  // Remove repeated phrases (e.g., "I need help I need help" -> "I need help")
  const phrases = cleaned.split(/[.!?]+/).filter(p => p.trim());
  const dedupedPhrases: string[] = [];
  const seenPhrases = new Set<string>();

  for (const phrase of phrases) {
    const normalized = phrase.trim().toLowerCase();
    if (normalized && !seenPhrases.has(normalized)) {
      dedupedPhrases.push(phrase.trim());
      seenPhrases.add(normalized);
    } else if (normalized) {
      duplicatesRemoved++;
    }
  }

  cleaned = dedupedPhrases.join('. ');

  // Calculate quality score
  const quality = calculateQuality(cleaned, original, duplicatesRemoved);
  const isValid = quality > 0.3 && cleaned.length > 10;

  return {
    cleanedText: cleaned,
    duplicatesRemoved,
    quality,
    isValid
  };
}

// Calculate quality score based on various factors
function calculateQuality(cleaned: string, original: string, duplicatesRemoved: number): number {
  if (!cleaned || cleaned.length === 0) return 0;

  // Factor 1: Reduction ratio (how much we reduced the text)
  const reductionRatio = cleaned.length / Math.max(original.length, 1);
  
  // Factor 2: Duplicate removal impact
  const duplicateImpact = Math.max(0, 1 - (duplicatesRemoved / 100));
  
  // Factor 3: Meaningful content (word diversity)
  const words = cleaned.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversity = words.length > 0 ? uniqueWords.size / words.length : 0;
  
  // Factor 4: Length appropriateness (not too short, not too long)
  const lengthScore = Math.min(1, cleaned.length / 100) * Math.max(0, 1 - cleaned.length / 5000);

  // Weighted combination
  const quality = (
    reductionRatio * 0.2 +
    duplicateImpact * 0.3 +
    diversity * 0.3 +
    lengthScore * 0.2
  );

  return Math.max(0, Math.min(1, quality));
}

// Check if conversation context is corrupted
export function isContextCorrupted(transcripts: string[]): boolean {
  if (transcripts.length === 0) return false;

  // Check for excessive duplication
  const allText = transcripts.join(' ');
  const result = sanitizeTranscript(allText);
  
  return !result.isValid || result.quality < 0.4;
}

// Merge and clean multiple transcript segments
export function cleanConversationContext(transcripts: string[]): string {
  if (transcripts.length === 0) return '';

  // Remove duplicates at the transcript level
  const uniqueTranscripts = Array.from(new Set(transcripts));

  // Sanitize each transcript
  const cleaned = uniqueTranscripts
    .map(t => sanitizeTranscript(t))
    .filter(r => r.isValid)
    .map(r => r.cleanedText)
    .join('\n');

  return cleaned;
}

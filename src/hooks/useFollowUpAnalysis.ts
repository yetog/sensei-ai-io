import { useState, useRef, useCallback } from 'react';
import { VoiceInput } from '@/utils/voiceInput';
import { ionosAI } from '@/services/ionosAI';
import { toast } from 'sonner';

export interface TranscriptionSegment {
  id: string;
  speaker: 'user' | 'customer';
  text: string;
  timestamp: number;
  confidence: number;
}

export interface CoachingSuggestion {
  id: string;
  type: 'objection' | 'product_pitch' | 'closing' | 'retention' | 'general';
  title: string;
  suggestion: string;
  context: string;
  confidence: number;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  isDismissed?: boolean;
}

export const useFollowUpAnalysis = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([]);
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string } | null>(null);
  
  const voiceInputRef = useRef<VoiceInput | null>(null);
  const lastSuggestionTime = useRef<number>(0);
  const isListeningRef = useRef(false);

  // Initialize VoiceInput once
  if (!voiceInputRef.current) {
    voiceInputRef.current = new VoiceInput();
  }

  // Generate coaching suggestion (rate-limited to 1 per 10 seconds)
  const generateCoachingSuggestion = useCallback(async (transcript: string, currentTranscription: TranscriptionSegment[]) => {
    const now = Date.now();
    if (now - lastSuggestionTime.current < 10000) return; // Rate limit
    if (transcript.length < 15) return; // Too short

    lastSuggestionTime.current = now;

    try {
      const response = await ionosAI.sendCoachingMessage([
        {
          role: 'system',
          content: 'You are an AI sales coach. Provide a concise, actionable coaching suggestion (2-3 sentences max).',
        },
        {
          role: 'user',
          content: `Recent conversation:\n${currentTranscription
            .slice(-3)
            .map((t) => t.text)
            .join('\n')}\n\nLatest: ${transcript}\n\nProvide ONE brief coaching tip.`,
        },
      ]);

      if (response) {
        const newSuggestion: CoachingSuggestion = {
          id: Date.now().toString(),
          type: 'general',
          title: 'Coaching Tip',
          suggestion: response,
          context: transcript.substring(0, 100),
          confidence: 0.8,
          timestamp: Date.now(),
          priority: 'medium',
        };

        setSuggestions((prev) => [...prev, newSuggestion]);
      }
    } catch (error) {
      console.error('Error generating coaching suggestion:', error);
    }
  }, []);

  const restartRecognition = useCallback(() => {
    if (!voiceInputRef.current || !isListeningRef.current) return;

    voiceInputRef.current.start({
      language: 'en-US',
      continuous: true,
      onStart: () => {},
      onResult: (text, isFinal) => {
        if (!isFinal) return;
        
        const segment: TranscriptionSegment = {
          id: `seg_${Date.now()}`,
          speaker: 'user',
          text: text.trim(),
          timestamp: Date.now(),
          confidence: 0.95,
        };

        setTranscription((prev) => {
          const updated = [...prev, segment];
          generateCoachingSuggestion(text, updated);
          return updated;
        });
      },
      onError: (errorMsg) => {
        setIsListening(false);
        isListeningRef.current = false;
        setError({ message: errorMsg });
        toast.error(errorMsg);
      },
      onEnd: () => {
        // Auto-restart if still supposed to be listening
        if (isListeningRef.current) {
          setTimeout(() => {
            restartRecognition();
          }, 100);
        }
      },
    });
  }, [generateCoachingSuggestion]);

  const startListening = useCallback(() => {
    if (!voiceInputRef.current || isListening) return;

    isListeningRef.current = true;

    const started = voiceInputRef.current.start({
      language: 'en-US',
      continuous: true,
      onStart: () => {
        setIsListening(true);
        setSessionStartTime(Date.now());
        setError(null);
        toast.success('Analysis started - speak naturally');
      },
      onResult: (text, isFinal) => {
        if (!isFinal) return;

        const segment: TranscriptionSegment = {
          id: `seg_${Date.now()}`,
          speaker: 'user',
          text: text.trim(),
          timestamp: Date.now(),
          confidence: 0.95,
        };

        setTranscription((prev) => {
          const updated = [...prev, segment];
          generateCoachingSuggestion(text, updated);
          return updated;
        });
      },
      onError: (errorMsg) => {
        setIsListening(false);
        isListeningRef.current = false;
        setError({ message: errorMsg });
        toast.error(errorMsg);
      },
      onEnd: () => {
        // Auto-restart if still supposed to be listening
        if (isListeningRef.current) {
          setTimeout(() => {
            restartRecognition();
          }, 100);
        }
      },
    });

    if (!started) {
      isListeningRef.current = false;
      setError({ message: 'Failed to start voice recognition' });
      toast.error('Failed to start voice recognition');
    }
  }, [isListening, generateCoachingSuggestion, restartRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (voiceInputRef.current) {
      voiceInputRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setTranscription([]);
    setSuggestions([]);
    setSessionStartTime(null);
    setError(null);
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, isDismissed: true } : s))
    );
  }, []);

  return {
    isListening,
    transcription,
    suggestions: suggestions.filter((s) => !s.isDismissed),
    sessionStartTime,
    error,
    startListening,
    stopListening,
    clearSession,
    dismissSuggestion,
    isAvailable: voiceInputRef.current?.isSupported() ?? false,
  };
};

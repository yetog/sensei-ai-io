import { useState, useEffect, useRef, useCallback } from 'react';
import { ionosAI } from '@/services/ionosAI';

// Extend window interface for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
    confidence: number;
  };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

interface CoachingSuggestion {
  id: string;
  type: 'objection' | 'product_pitch' | 'closing' | 'retention' | 'general';
  context: string;
  suggestion: string;
  confidence: number;
  sourceDocument?: string;
  timestamp: number;
}

interface TranscriptionSegment {
  id: string;
  speaker: 'user' | 'customer';
  text: string;
  timestamp: number;
  confidence: number;
}

interface CoachingState {
  isListening: boolean;
  isProcessing: boolean;
  transcription: TranscriptionSegment[];
  suggestions: CoachingSuggestion[];
  currentTurn: 'user' | 'customer' | null;
  callType: 'incoming_sales' | 'retention' | 'outbound' | 'general';
}

export function useRealTimeCoaching() {
  const [state, setState] = useState<CoachingState>({
    isListening: false,
    isProcessing: false,
    transcription: [],
    suggestions: [],
    currentTurn: null,
    callType: 'general'
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognitionClass() as SpeechRecognition;
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setState(prev => ({ ...prev, isListening: true }));
      };

      recognition.onresult = (event) => {
        const results = Array.from(event.results);
        const latestResult = results[results.length - 1];
        
        if (latestResult.isFinal) {
          const transcript = latestResult[0].transcript.trim();
          const confidence = latestResult[0].confidence;
          
          if (transcript.length > 0) {
            const newSegment: TranscriptionSegment = {
              id: Date.now().toString(),
              speaker: state.currentTurn || 'user',
              text: transcript,
              timestamp: Date.now(),
              confidence: confidence || 0.8
            };

            setState(prev => ({
              ...prev,
              transcription: [...prev.transcription, newSegment]
            }));

            // Process the transcription for coaching suggestions
            processTranscriptionForCoaching(transcript, state.callType);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setState(prev => ({ ...prev, isListening: false }));
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };
    }
  }, [state.currentTurn, state.callType]);

  const processTranscriptionForCoaching = useCallback(async (text: string, callType: string) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Create coaching prompt based on call type and context
      const coachingPrompt = createCoachingPrompt(text, callType, state.transcription);
      
      const response = await ionosAI.sendMessage([
        { role: 'user', content: coachingPrompt }
      ], 'Sales Coach');

      // Parse AI response for suggestions
      const suggestions = parseCoachingResponse(response, text);
      
      setState(prev => ({
        ...prev,
        suggestions: [...prev.suggestions, ...suggestions],
        isProcessing: false
      }));

    } catch (error) {
      console.error('Error processing coaching suggestions:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.transcription]);

  const createCoachingPrompt = (currentText: string, callType: string, history: TranscriptionSegment[]): string => {
    const context = history.slice(-5).map(seg => `${seg.speaker}: ${seg.text}`).join('\n');
    
    const callTypeInstructions = {
      incoming_sales: "Focus on identifying buying signals, objections, and opportunities to present product benefits.",
      retention: "Focus on understanding cancellation reasons and providing retention offers or solutions.",
      outbound: "Focus on building rapport, qualifying prospects, and moving toward a sales conversation.",
      general: "Provide general sales coaching and conversation guidance."
    };

    return `You are a real-time sales coaching assistant analyzing a live ${callType} call. Analyze this conversation and provide specific, actionable coaching suggestions.

Call Type: ${callType}
Instructions: ${callTypeInstructions[callType as keyof typeof callTypeInstructions]}

Recent Conversation History:
${context}

Current Customer Statement: "${currentText}"

ANALYSIS FOCUS:
- Detect objections, buying signals, hesitation, pricing concerns
- Identify opportunities for product demos, features, benefits
- Recognize closing moments and urgency indicators
- Note emotional state and rapport-building opportunities

Provide 1-3 immediate coaching suggestions in this JSON format:
{
  "suggestions": [
    {
      "type": "objection|product_pitch|closing|retention|general",
      "context": "What customer behavior/words triggered this suggestion",
      "suggestion": "Exact phrase or approach the sales rep should use RIGHT NOW",
      "confidence": 0.9
    }
  ]
}

Make suggestions conversational, natural, and ready to use immediately. Focus on what to say next, not general advice.`;
  };

  const parseCoachingResponse = (response: string, context: string): CoachingSuggestion[] => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.suggestions?.map((suggestion: any, index: number) => ({
          id: `${Date.now()}_${index}`,
          type: suggestion.type || 'general',
          context: suggestion.context || context,
          suggestion: suggestion.suggestion || '',
          confidence: suggestion.confidence || 0.7,
          timestamp: Date.now()
        })) || [];
      }
    } catch (error) {
      console.error('Error parsing coaching response:', error);
    }

    // Fallback: create a general suggestion from the response
    return [{
      id: Date.now().toString(),
      type: 'general',
      context: context.substring(0, 100),
      suggestion: response.substring(0, 200),
      confidence: 0.6,
      timestamp: Date.now()
    }];
  };

  const startListening = useCallback((callType: CoachingState['callType'] = 'general') => {
    if (recognitionRef.current) {
      setState(prev => ({ 
        ...prev, 
        callType,
        transcription: [],
        suggestions: [],
        currentTurn: 'customer'
      }));
      recognitionRef.current.start();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
      setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
    }
  }, [state.isListening]);

  const toggleSpeaker = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentTurn: prev.currentTurn === 'user' ? 'customer' : 'user' 
    }));
  }, []);

  const clearSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcription: [],
      suggestions: [],
      currentTurn: null
    }));
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleSpeaker,
    clearSession,
    dismissSuggestion,
    isAvailable: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
}
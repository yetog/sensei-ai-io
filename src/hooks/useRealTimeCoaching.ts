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
  conversationLength: number;
  lastSuggestionTime: number;
  isDemoMode: boolean;
}

export function useRealTimeCoaching() {
  const [state, setState] = useState<CoachingState>({
    isListening: false,
    isProcessing: false,
    transcription: [],
    suggestions: [],
    currentTurn: null,
    callType: 'general',
    conversationLength: 0,
    lastSuggestionTime: 0,
    isDemoMode: false
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
            setState(prev => {
              const lastSegment = prev.transcription[prev.transcription.length - 1];
              const currentSpeaker = prev.currentTurn || 'user';
              
          // Smart consolidation: merge with previous segment if same speaker and within 2 seconds
          if (lastSegment && 
              lastSegment.speaker === currentSpeaker && 
              Date.now() - lastSegment.timestamp < 2000) {
                
                // Update the last segment instead of creating new one
                const updatedTranscription = [...prev.transcription];
                updatedTranscription[updatedTranscription.length - 1] = {
                  ...lastSegment,
                  text: lastSegment.text + ' ' + transcript,
                  confidence: Math.max(lastSegment.confidence, confidence || 0.8)
                };
                
                return {
                  ...prev,
                  transcription: updatedTranscription,
                  conversationLength: prev.conversationLength + transcript.length
                };
              } else {
                // Create new segment
                const newSegment: TranscriptionSegment = {
                  id: Date.now().toString(),
                  speaker: currentSpeaker,
                  text: transcript,
                  timestamp: Date.now(),
                  confidence: confidence || 0.8
                };

                return {
                  ...prev,
                  transcription: [...prev.transcription, newSegment],
                  conversationLength: prev.conversationLength + transcript.length
                };
              }
            });

            // Smart suggestion filtering - only process if conditions are met
            if (shouldGenerateSuggestion(transcript, state)) {
              processTranscriptionForCoaching(transcript, state.callType);
            }
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

  // Smart filtering function to prevent suggestion overload
  const shouldGenerateSuggestion = (transcript: string, currentState: CoachingState): boolean => {
    // Skip if in demo mode and user is talking about the system
    if (currentState.isDemoMode && transcript.toLowerCase().includes('coaching')) {
      return false;
    }

    // Minimum conversation length threshold (at least 100 characters)
    if (currentState.conversationLength < 100) {
      return false;
    }

    // Time throttling - wait at least 15 seconds between suggestions
    const timeSinceLastSuggestion = Date.now() - currentState.lastSuggestionTime;
    if (timeSinceLastSuggestion < 15000) {
      return false;
    }

    // Limit total active suggestions to 2 for better readability
    if (currentState.suggestions.length >= 2) {
      return false;
    }

    // Only suggest on customer statements longer than 20 characters
    if (transcript.length < 20) {
      return false;
    }

    // Look for trigger words/phrases that indicate coaching opportunities
    const triggers = [
      'price', 'cost', 'expensive', 'budget', 'think about it', 'not sure',
      'maybe', 'hesitant', 'compare', 'competition', 'other options',
      'decision', 'when', 'timeline', 'ready', 'interested'
    ];
    
    const hasCoachingTrigger = triggers.some(trigger => 
      transcript.toLowerCase().includes(trigger)
    );

    return hasCoachingTrigger;
  };

  const detectConversationPhase = (history: TranscriptionSegment[], currentText: string): string => {
    const fullConversation = history.map(h => h.text).join(' ') + ' ' + currentText;
    const text = fullConversation.toLowerCase();
    
    if (text.includes('price') || text.includes('cost') || text.includes('budget')) {
      return 'pricing_discussion';
    } else if (text.includes('when') || text.includes('timeline') || text.includes('start')) {
      return 'closing_phase';
    } else if (text.includes('feature') || text.includes('demo') || text.includes('how')) {
      return 'product_discussion';
    } else if (history.length < 3) {
      return 'opening_phase';
    } else {
      return 'discovery_phase';
    }
  };

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
      
      // Filter high-confidence suggestions only
      const filteredSuggestions = suggestions.filter(s => s.confidence >= 0.8);
      
      setState(prev => ({
        ...prev,
        suggestions: [...prev.suggestions, ...filteredSuggestions],
        isProcessing: false,
        lastSuggestionTime: Date.now()
      }));

      // Auto-cleanup old suggestions after 3 minutes
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          suggestions: prev.suggestions.filter(s => 
            Date.now() - s.timestamp < 180000
          )
        }));
      }, 180000);

    } catch (error) {
      console.error('Error processing coaching suggestions:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.transcription]);

  const createCoachingPrompt = (currentText: string, callType: string, history: TranscriptionSegment[]): string => {
    const context = history.slice(-3).map(seg => `${seg.speaker}: ${seg.text}`).join('\n');
    
    // Detect conversation phase
    const conversationPhase = detectConversationPhase(history, currentText);
    
    const callTypeInstructions = {
      incoming_sales: "Focus ONLY on clear buying signals, direct objections, and urgent closing opportunities.",
      retention: "Focus ONLY on cancellation reasons and immediate retention opportunities.",
      outbound: "Focus ONLY on qualification questions and scheduling opportunities.",
      general: "Focus ONLY on clear coaching moments - objections, buying signals, or closing."
    };

    return `You are an expert sales coach providing CONSERVATIVE, high-value coaching suggestions for a live ${callType} call.

CRITICAL INSTRUCTIONS:
- ONLY provide suggestions for CLEAR coaching moments (objections, buying signals, pricing concerns)
- DO NOT coach on casual conversation, system discussions, or general chat
- Maximum 1 suggestion per analysis
- Confidence must be 85% or higher
- Focus on immediate, actionable responses

Call Phase: ${conversationPhase}
Call Type: ${callType}
Focus: ${callTypeInstructions[callType as keyof typeof callTypeInstructions]}

Recent Context (last 3 exchanges):
${context}

Current Customer Statement: "${currentText}"

ONLY suggest if you detect:
1. Direct objection to price/features/timing
2. Clear buying signal or interest
3. Request for information/demo
4. Closing opportunity
5. Retention risk indicator

Response format (ONLY if clear trigger detected):
{
  "suggestions": [
    {
      "type": "objection|product_pitch|closing|retention|general",
      "analysis": "Brief 1-2 line analysis of what customer said",
      "suggestion1": "First actionable response",
      "suggestion2": "Second actionable response", 
      "confidence": 0.9
    }
  ]
}

If no clear trigger, respond with: {"suggestions": []}`;
  };

  const parseCoachingResponse = (response: string, context: string): CoachingSuggestion[] => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.suggestions?.map((suggestion: any) => {
          // Build suggestion text with only valid parts
          const suggestionParts = [
            suggestion.suggestion1,
            suggestion.suggestion2
          ].filter(part => part && part !== 'undefined' && part.trim().length > 0);
          
          if (suggestionParts.length === 0) return null;
          
          return {
            id: `${Date.now()}_${Math.random()}`,
            type: suggestion.type || 'general',
            context: suggestion.analysis || context,
            suggestion: suggestionParts.join('\n\n'),
            confidence: suggestion.confidence || 0.7,
            timestamp: Date.now()
          };
        }).filter((s: any) => s !== null) || [];
      }
    } catch (error) {
      console.error('Error parsing coaching response:', error);
    }

    // Return empty array if no clear suggestions
    return [];
  };

  const saveTranscript = useCallback(() => {
    const transcript = state.transcription.map(seg => 
      `[${new Date(seg.timestamp).toLocaleTimeString()}] ${seg.speaker === 'user' ? 'You' : 'Customer'}: ${seg.text}`
    ).join('\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coaching-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.transcription]);

  const exportTranscriptData = useCallback(() => {
    const data = {
      transcript: state.transcription,
      suggestions: state.suggestions,
      callType: state.callType,
      duration: state.conversationLength,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coaching-session-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.transcription, state.suggestions, state.callType, state.conversationLength]);

  const startListening = useCallback((callType: CoachingState['callType'] = 'general') => {
    if (recognitionRef.current) {
      setState(prev => ({ 
        ...prev, 
        callType,
        transcription: [],
        suggestions: [],
        currentTurn: 'customer',
        conversationLength: 0,
        lastSuggestionTime: 0
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
      currentTurn: null,
      conversationLength: 0,
      lastSuggestionTime: 0
    }));
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }));
  }, []);

  const toggleDemoMode = useCallback(() => {
    setState(prev => ({ ...prev, isDemoMode: !prev.isDemoMode }));
  }, []);

  const requestCoaching = useCallback(() => {
    if (state.transcription.length > 0) {
      const lastSegment = state.transcription[state.transcription.length - 1];
      processTranscriptionForCoaching(lastSegment.text, state.callType);
    }
  }, [state.transcription, state.callType]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleSpeaker,
    clearSession,
    dismissSuggestion,
    toggleDemoMode,
    requestCoaching,
    saveTranscript,
    exportTranscriptData,
    isAvailable: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
}
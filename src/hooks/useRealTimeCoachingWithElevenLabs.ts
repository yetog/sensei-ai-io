import { useState, useCallback } from 'react';
import { useElevenLabsVoiceAgent } from './useElevenLabsVoiceAgent';
import { ionosAI } from '@/services/ionosAI';
import { knowledgeBase } from '@/services/knowledgeBase';
import { toast } from 'sonner';

// Types
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
  rating?: 'helpful' | 'not_helpful';
  ratingReason?: string;
}

export interface TranscriptionSegment {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: number;
  confidence: number;
}

interface CoachingState {
  transcription: TranscriptionSegment[];
  suggestions: CoachingSuggestion[];
  sessionStartTime: number | null;
  sessionDuration: number;
}

export const useRealTimeCoachingWithElevenLabs = () => {
  const [state, setState] = useState<CoachingState>({
    transcription: [],
    suggestions: [],
    sessionStartTime: null,
    sessionDuration: 0,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Process transcriptions from ElevenLabs for coaching suggestions
  const processTranscriptionForCoaching = useCallback(async (transcript: string) => {
    if (transcript.length < 10 || isProcessing) return;

    setIsProcessing(true);
    try {
      // Search playbook for relevant context
      const playbookResults = knowledgeBase.search(transcript, 3);
      const playbookContext = playbookResults.length > 0 
        ? `\n\nRELEVANT PLAYBOOK GUIDANCE:\n${playbookResults.map(r => 
            `- ${r.document.title}: ${r.matchedContent.substring(0, 150)}...`
          ).join('\n')}`
        : '';

      // Use IONOS AI to generate coaching suggestions
      const response = await ionosAI.sendCoachingMessage([
        {
          role: 'system',
          content: `You are an AI sales coach. Provide concise, actionable coaching suggestions based on the conversation and IONOS playbook guidance.${playbookContext}`,
        },
        {
          role: 'user',
          content: `Conversation so far:\n${state.transcription
            .slice(-5)
            .map((t) => `${t.speaker}: ${t.text}`)
            .join('\n')}\n\nLatest: ${transcript}\n\nProvide a brief coaching suggestion.`,
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

        setState((prev) => ({
          ...prev,
          suggestions: [...prev.suggestions, newSuggestion],
        }));
      }
    } catch (error) {
      console.error('Error generating coaching suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [state.transcription, isProcessing]);

  // ElevenLabs Voice Agent Integration
  const voiceAgent = useElevenLabsVoiceAgent({
    onConnect: () => {
      console.log('✅ ElevenLabs Voice Agent connected');
      setState((prev) => ({ ...prev, sessionStartTime: Date.now() }));
      toast.success('Voice coaching started');
    },
    onDisconnect: () => {
      console.log('❌ ElevenLabs Voice Agent disconnected');
      toast.info('Voice coaching ended');
    },
    onTranscript: (transcript: string, speaker: 'user' | 'assistant') => {
      const segment: TranscriptionSegment = {
        id: `seg_${Date.now()}`,
        speaker,
        text: transcript,
        timestamp: Date.now(),
        confidence: 0.95,
      };

      setState((prev) => ({
        ...prev,
        transcription: [...prev.transcription, segment],
      }));

      // Generate coaching suggestions for user speech
      if (speaker === 'user') {
        processTranscriptionForCoaching(transcript);
      }
    },
    onCoachingSuggestion: (suggestion: any) => {
      // Handle tool-based coaching from ElevenLabs agent
      console.log('📨 Coaching suggestion from ElevenLabs:', suggestion);
      
      const newSuggestion: CoachingSuggestion = {
        id: Date.now().toString(),
        type: 'general',
        title: 'ElevenLabs Suggestion',
        suggestion: suggestion.message || JSON.stringify(suggestion),
        context: 'From voice agent',
        confidence: 0.9,
        timestamp: Date.now(),
        priority: 'high',
      };

      setState((prev) => ({
        ...prev,
        suggestions: [...prev.suggestions, newSuggestion],
      }));
    },
    onError: (error: Error) => {
      console.error('❌ Voice agent error:', error);
      toast.error(`Voice agent error: ${error.message}`);
    },
  });

  const startListening = useCallback(async () => {
    try {
      await voiceAgent.start();
    } catch (error) {
      console.error('Failed to start voice agent:', error);
      toast.error('Failed to start voice coaching');
    }
  }, [voiceAgent]);

  const stopListening = useCallback(async () => {
    await voiceAgent.stop();
  }, [voiceAgent]);

  const clearSession = useCallback(() => {
    setState({
      transcription: [],
      suggestions: [],
      sessionStartTime: null,
      sessionDuration: 0,
    });
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((s) =>
        s.id === suggestionId ? { ...s, isDismissed: true } : s
      ),
    }));
  }, []);

  const rateSuggestion = useCallback(
    (suggestionId: string, rating: 'helpful' | 'not_helpful', reason?: string) => {
      setState((prev) => ({
        ...prev,
        suggestions: prev.suggestions.map((s) =>
          s.id === suggestionId ? { ...s, rating, ratingReason: reason } : s
        ),
      }));
    },
    []
  );

  return {
    isListening: voiceAgent.isConnected,
    isSpeaking: voiceAgent.isSpeaking,
    isProcessing,
    transcription: state.transcription,
    suggestions: state.suggestions.filter((s) => !s.isDismissed),
    sessionStartTime: state.sessionStartTime,
    error: voiceAgent.error ? { message: voiceAgent.error } : null,
    startListening,
    stopListening,
    clearSession,
    dismissSuggestion,
    rateSuggestion,
    isAvailable: true,
  };
};

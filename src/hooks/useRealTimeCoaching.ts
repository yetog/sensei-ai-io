import { useState, useCallback, useEffect, useRef } from 'react';
import { useElevenLabs } from './useElevenLabs';
import { useConversationalAI } from './useConversationalAI';
import { useGenesysIntegration } from '@/services/genesysIntegration';
import { SpecializedAgentService } from '@/services/specializedAgents';

interface CoachingInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'opportunity' | 'objection';
  message: string;
  confidence: number;
  timestamp: Date;
  spoken?: boolean;
}

interface RealTimeCoachingOptions {
  agentType: 'sales' | 'retention' | 'technical';
  enableVoiceCoaching: boolean;
  whisperMode: boolean;
  autoRespond: boolean;
}

export const useRealTimeCoaching = (options: RealTimeCoachingOptions) => {
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  
  const { speakCoaching, isPlaying, stopSpeaking } = useElevenLabs();
  const { startConversation, endConversation, isActive: voiceAgentActive } = useConversationalAI({
    agentConfig: {
      id: options.agentType,
      agentType: options.agentType,
      name: `${options.agentType} Coach`,
      systemPrompt: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    onMessage: (message, role) => {
      if (role === 'assistant') {
        addInsight({
          type: 'suggestion',
          message,
          confidence: 0.9
        });
      }
    }
  });
  
  const { currentCall, audioLevel, isListening } = useGenesysIntegration();
  const specializedService = useRef(new SpecializedAgentService());
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-analyze conversation segments
  useEffect(() => {
    if (!isActive || !transcription) return;

    // Debounce analysis - wait for pause in conversation
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      analyzeConversationSegment(transcription);
    }, 3000);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [transcription, isActive]);

  const addInsight = useCallback((insight: Omit<CoachingInsight, 'id' | 'timestamp'>) => {
    const newInsight: CoachingInsight = {
      ...insight,
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setInsights(prev => [...prev.slice(-9), newInsight]); // Keep last 10 insights

    // Auto-speak if enabled and not already speaking
    if (options.enableVoiceCoaching && !isPlaying && insight.type !== 'warning') {
      // Map agent type for TTS service
      const ttsAgentType = options.agentType === 'retention' ? 'marketing' : 
                          options.agentType === 'technical' ? 'analysis' : 'sales';
      
      speakCoaching(insight.message, {
        agentType: ttsAgentType,
        whisperMode: options.whisperMode
      }).then(() => {
        setInsights(prev => 
          prev.map(i => i.id === newInsight.id ? { ...i, spoken: true } : i)
        );
      }).catch(console.error);
    }
  }, [options.enableVoiceCoaching, options.whisperMode, options.agentType, isPlaying, speakCoaching]);

  const analyzeConversationSegment = useCallback(async (text: string) => {
    try {
      const context = {
        agentExperience: 'intermediate' as const,
        callType: currentCall?.participantData.direction || 'outbound' as const,
        currentStage: 'discovery' as const,
        customerProfile: {
          sentiment: 'neutral' as const
        }
      };

      // Map agent types correctly
      const mappedAgentType = options.agentType === 'retention' ? 'technical' : options.agentType;
      
      const analysis = await specializedService.current.getSpecializedResponse(
        mappedAgentType,
        `Analyze this conversation segment and provide real-time coaching: "${text}"`,
        context,
        conversationContext
      );

      if (analysis.response) {
        addInsight({
          type: 'suggestion',
          message: analysis.response,
          confidence: analysis.confidence || 0.8
        });
      }

      // Add specific insights
      if (analysis.insights?.length > 0) {
        analysis.insights.forEach(insight => {
          addInsight({
            type: 'opportunity',
            message: insight,
            confidence: 0.85
          });
        });
      }

      // Add next actions as coaching suggestions
      if (analysis.nextActions?.length > 0) {
        analysis.nextActions.forEach(action => {
          addInsight({
            type: 'suggestion',
            message: `Next: ${action}`,
            confidence: 0.9
          });
        });
      }

    } catch (error) {
      console.error('Failed to analyze conversation:', error);
    }
  }, [options.agentType, currentCall, conversationContext, addInsight]);

  const startCoaching = useCallback(async () => {
    try {
      setIsActive(true);
      setInsights([]);
      setConversationContext([]);
      
      if (options.enableVoiceCoaching) {
        await startConversation(options.agentType);
      }

      addInsight({
        type: 'suggestion',
        message: `${options.agentType.charAt(0).toUpperCase() + options.agentType.slice(1)} coaching activated. I'm listening and ready to help!`,
        confidence: 1.0
      });

    } catch (error) {
      console.error('Failed to start coaching:', error);
      setIsActive(false);
    }
  }, [options.agentType, options.enableVoiceCoaching, startConversation, addInsight]);

  const stopCoaching = useCallback(async () => {
    setIsActive(false);
    stopSpeaking();
    
    if (voiceAgentActive) {
      await endConversation();
    }

    addInsight({
      type: 'suggestion',
      message: 'Coaching session ended. Great job!',
      confidence: 1.0
    });
  }, [stopSpeaking, voiceAgentActive, endConversation, addInsight]);

  const clearInsights = useCallback(() => {
    setInsights([]);
  }, []);

  const simulateTranscription = useCallback((text: string) => {
    setTranscription(prev => prev + ' ' + text);
    setConversationContext(prev => [...prev, text].slice(-10)); // Keep last 10 exchanges
  }, []);

  // Mock transcription for demo purposes
  const triggerTestInsight = useCallback((type: CoachingInsight['type'] = 'suggestion') => {
    const testMessages = {
      suggestion: [
        "Try asking about their current pain points",
        "This is a great time to mention ROI benefits",
        "Ask about their decision timeline",
        "Share a relevant success story"
      ],
      opportunity: [
        "They mentioned budget concerns - perfect for value discussion",
        "Customer seems interested in technical details",
        "Great moment to ask for the next meeting"
      ],
      warning: [
        "Customer sounds hesitant - slow down and listen",
        "Pricing objection detected - focus on value",
        "They're asking about competitors"
      ],
      objection: [
        "Price objection: Focus on ROI and value proposition",
        "Timeline concern: Ask about urgency and decision process",
        "Authority question: Identify the decision maker"
      ]
    };

    const messages = testMessages[type];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    addInsight({
      type,
      message: randomMessage,
      confidence: 0.8 + Math.random() * 0.2
    });
  }, [addInsight]);

  return {
    insights,
    isActive,
    transcription,
    conversationContext,
    audioLevel,
    isListening,
    currentCall,
    startCoaching,
    stopCoaching,
    clearInsights,
    simulateTranscription,
    triggerTestInsight,
    isVoiceAgentActive: voiceAgentActive,
    isSpeaking: isPlaying
  };
};
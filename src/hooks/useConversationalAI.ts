import { useState, useCallback, useRef } from 'react';
import { useConversation } from '@11labs/react';
import { AgentConfig } from '@/types/agent';
import { SpecializedAgentService } from '@/services/specializedAgents';

interface ConversationalOptions {
  agentConfig?: AgentConfig;
  onMessage?: (message: string, role: 'user' | 'assistant') => void;
  onInsight?: (insight: string) => void;
}

interface VoiceAgentPersonality {
  voiceId: string;
  prompt: string;
  firstMessage: string;
  language: string;
}

export const useConversationalAI = (options: ConversationalOptions = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const conversationIdRef = useRef<string | null>(null);

  // Pre-configured ElevenLabs agent IDs (embedded for seamless experience)
  const voiceAgents = {
    sales: 'ag_sales_roger_123456', // Sales Coach - Roger
    retention: 'ag_retention_aria_789012', // Retention Specialist - Aria  
    technical: 'ag_technical_sarah_345678' // Technical Advisor - Sarah
  };

  // Voice personalities for different agent types
  const voicePersonalities: Record<string, VoiceAgentPersonality> = {
    sales: {
      voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - confident, persuasive
      prompt: "You are Roger, a seasoned sales coach with 15+ years of experience. You speak with confidence and authority, providing practical sales advice in real-time. Keep responses under 30 seconds and focus on actionable guidance. Use a consultative tone and ask probing questions to help the sales rep think strategically.",
      firstMessage: "Hey there! I'm Roger, your sales coach. I'm here to help you crush this conversation. What's the situation with your prospect?",
      language: "en"
    },
    retention: {
      voiceId: '9BWtsMINqrJLrRacOk9x', // Aria - engaging, empathetic
      prompt: "You are Aria, a customer success expert specializing in retention. You're empathetic, solution-focused, and excel at de-escalation. Provide calm, strategic advice for handling difficult customers. Keep responses conversational and supportive, under 30 seconds.",
      firstMessage: "Hi! I'm Aria, your retention specialist. I understand dealing with upset customers can be challenging. Tell me what's happening and I'll help you turn this around.",
      language: "en"
    },
    technical: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - professional, analytical
      prompt: "You are Sarah, a technical solutions expert. You break down complex concepts into simple terms and help sales reps explain technical features confidently. Be precise, clear, and educational. Keep explanations under 30 seconds and always relate back to customer value.",
      firstMessage: "Hello! I'm Sarah, your technical advisor. Ready to help you explain complex solutions in simple terms. What technical challenge are you facing?",
      language: "en"
    }
  };

  const conversation = useConversation({
    onConnect: () => {
      setIsActive(true);
    },
    onDisconnect: () => {
      setIsActive(false);
      conversationIdRef.current = null;
    },
    onMessage: (message) => {
      if (message.source === 'user' && message.message) {
        setConversationHistory(prev => [...prev, `User: ${message.message}`]);
        options.onMessage?.(message.message, 'user');
      } else if (message.source === 'ai' && message.message) {
        setConversationHistory(prev => [...prev, `Agent: ${message.message}`]);
        options.onMessage?.(message.message, 'assistant');
        
        // Generate insights based on the conversation
        if (options.agentConfig) {
          generateContextualInsight(message.message, options.agentConfig.agentType);
        }
      }
    },
    onError: (error) => {
      console.error('Conversational AI error:', error);
      setIsActive(false);
    }
  });

  const generateContextualInsight = useCallback(async (
    response: string, 
    agentType?: string
  ) => {
    if (!agentType) return;

    try {
      const service = new SpecializedAgentService();
      const insight = await service.getSpecializedResponse(
        agentType as any,
        `Analyze this conversation response and provide a brief insight: ${response}`,
        { 
          agentExperience: 'intermediate',
          callType: 'outbound', 
          currentStage: 'discovery' 
        },
        conversationHistory
      );
      
      if (insight.insights?.length > 0) {
        options.onInsight?.(insight.insights[0]);
      }
    } catch (error) {
      console.error('Failed to generate insight:', error);
    }
  }, [conversationHistory, options]);

  const startConversation = useCallback(async (
    agentType: keyof typeof voicePersonalities = 'sales'
  ) => {
    try {
      const agentId = voiceAgents[agentType];
      const personality = voicePersonalities[agentType];
      
      if (!personality || !agentId) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      const conversationId = await conversation.startSession({
        conversationToken: agentId,
        overrides: {
          agent: {
            prompt: {
              prompt: personality.prompt
            },
            firstMessage: personality.firstMessage,
            language: personality.language as any
          },
          tts: {
            voiceId: personality.voiceId
          }
        }
      });

      conversationIdRef.current = conversationId;
      setCurrentAgentId(agentId);
      setConversationHistory([]);
      
      return conversationId;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setCurrentAgentId(null);
      setConversationHistory([]);
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  }, [conversation]);

  const setVolume = useCallback(async (volume: number) => {
    try {
      await conversation.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }, [conversation]);

  return {
    isActive,
    currentAgentId,
    conversationHistory,
    isSpeaking: conversation.isSpeaking,
    status: conversation.status,
    startConversation,
    endConversation,
    setVolume,
    voicePersonalities,
    voiceAgents
  };
};
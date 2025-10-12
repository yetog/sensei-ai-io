import { useState, useRef, useCallback } from 'react';
import { Conversation } from '@elevenlabs/client';

interface VoiceAgentOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onModeChange?: (mode: { mode: 'speaking' | 'listening' }) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: { role: 'user' | 'assistant'; message: string }) => void;
  onTranscript?: (transcript: string, speaker: 'user' | 'assistant') => void;
  onCoachingSuggestion?: (suggestion: any) => void;
}

export const useElevenLabsVoiceAgent = (options: VoiceAgentOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<any>(null);

  const agentId = 'agent_0501k7bc2n30fw7v2b71p1rym317'; // Your ElevenLabs Agent ID (safe to expose - public agent)

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      setError('Microphone permission denied');
      console.error('Microphone permission error:', err);
      return false;
    }
  };

  const getSignedUrl = async (): Promise<string> => {
    if (!agentId) {
      throw new Error('Agent ID not configured');
    }

    // Get signed URL from ElevenLabs API
    // Note: API key is hardcoded here for development. Move to backend for production.
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': 'sk_8e01678d62936838bc440a754e187457811e36b93613dca6',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get signed URL: ${errorData.detail?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.signed_url;
  };

  const start = useCallback(async () => {
    if (conversationRef.current) {
      console.warn('Voice agent already connected');
      return;
    }

    try {
      setError(null);

      if (!agentId) {
        throw new Error('ElevenLabs Agent ID not configured. Please set VITE_ELEVEN_LABS_AGENT_ID in .env file');
      }

      // Request microphone permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        throw new Error('Microphone permission required');
      }

      // Get signed URL for public agent
      const signedUrl = await getSignedUrl();

      // Start ElevenLabs conversation
      conversationRef.current = await Conversation.startSession({
        signedUrl,

        onConnect: () => {
          console.log('✅ ElevenLabs Voice Agent connected');
          setIsConnected(true);
          options.onConnect?.();
        },

        onDisconnect: () => {
          console.log('❌ ElevenLabs Voice Agent disconnected');
          setIsConnected(false);
          setIsSpeaking(false);
          conversationRef.current = null;
          options.onDisconnect?.();
        },

        onError: (err: any) => {
          console.error('❌ Voice agent error:', err);
          setError(err.message || 'Voice agent error');
          options.onError?.(err);
        },

        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          const speaking = mode.mode === 'speaking';
          setIsSpeaking(speaking);
          console.log(`🎙️ Mode: ${mode.mode}`);
          options.onModeChange?.(mode);
        },

        onMessage: (message: any) => {
          console.log('📨 Message received:', message);
          
          // Handle transcriptions
          if (message.type === 'transcript') {
            const speaker = message.role === 'user' ? 'user' : 'assistant';
            options.onTranscript?.(message.message, speaker);
          }
          
          // Handle tool calls (coaching suggestions)
          if (message.type === 'tool_call') {
            options.onCoachingSuggestion?.(message);
          }
          
          options.onMessage?.(message);
        }
      });

      console.log('✅ Voice agent session started successfully');
    } catch (err: any) {
      console.error('Failed to start voice agent:', err);
      setError(err.message || 'Failed to start voice conversation');
      throw err;
    }
  }, [agentId, options]);

  const stop = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
      setIsConnected(false);
      setIsSpeaking(false);
      console.log('🛑 Voice agent stopped');
    }
  }, []);

  return {
    start,
    stop,
    isConnected,
    isSpeaking,
    error
  };
};

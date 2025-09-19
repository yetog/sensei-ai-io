import { useState, useCallback } from 'react';
import { ttsService } from '@/services/ttsService';

interface VoiceCoachingOptions {
  agentType?: 'sales' | 'marketing' | 'analysis' | 'default';
  whisperMode?: boolean; // For quiet coaching during calls
}

export const useElevenLabs = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const initializeElevenLabs = useCallback(async () => {
    try {
      // Auto-initialize with system API key
      const userApiKey = await ttsService.requestApiKey();
      if (userApiKey) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize ElevenLabs:', error);
      // Fallback to localStorage or user input
      const savedKey = localStorage.getItem('elevenlabs-api-key');
      if (savedKey) {
        await ttsService.setApiKey(savedKey);
        setIsInitialized(true);
      } else {
        throw error;
      }
    }
  }, []);

  const speakCoaching = useCallback(async (
    message: string, 
    options: VoiceCoachingOptions = {}
  ) => {
    try {
      if (!isInitialized) {
        await initializeElevenLabs();
      }

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audioUrl = await ttsService.generateSpeech(
        message,
        options.agentType || 'sales',
        {
          stability: options.whisperMode ? 0.9 : 0.75,
          similarityBoost: options.whisperMode ? 0.8 : 0.75,
          speed: options.whisperMode ? 0.8 : 1.0
        }
      );

      const audio = new Audio(audioUrl);
      
      // Set volume for whisper mode
      audio.volume = options.whisperMode ? 0.3 : 0.7;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };

      setCurrentAudio(audio);
      await audio.play();

    } catch (error) {
      console.error('Failed to speak coaching message:', error);
      throw error;
    }
  }, [isInitialized, currentAudio]);

  const stopSpeaking = useCallback(() => {
    if (currentAudio && isPlaying) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  }, [currentAudio, isPlaying]);

  const generateQuickResponse = useCallback(async (
    context: string,
    agentType: 'sales' | 'marketing' | 'analysis' | 'default' = 'sales'
  ) => {
    const responses = {
      sales: [
        "Based on what they just said, try asking about their current solution and pain points.",
        "This sounds like a perfect fit for our premium package. Mention the ROI benefits.",
        "They seem hesitant about price. Pivot to value and ask about their budget timeline.",
        "Great opportunity to share a success story from a similar client."
      ],
      marketing: [
        "Focus on the emotional benefits and how this solves their core problem.",
        "This is a great time to mention our unique differentiator in the market.",
        "Ask about their decision-making process and timeline.",
        "Share some social proof or case studies that match their situation."
      ],
      analysis: [
        "Let's break down their requirements systematically.",
        "Ask for specific metrics they're trying to improve.",
        "This needs a more technical approach - dive into the data.",
        "Request more details about their current process and bottlenecks."
      ],
      default: [
        "Ask a clarifying question to understand their needs better.",
        "This is a good moment to listen and gather more information.",
        "Try to identify their main concern and address it directly.",
        "Build rapport by finding common ground or shared experiences."
      ]
    };

    const suggestions = responses[agentType];
    const randomResponse = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    await speakCoaching(randomResponse, { agentType, whisperMode: true });
    
    return randomResponse;
  }, [speakCoaching]);

  return {
    isInitialized,
    isPlaying,
    initializeElevenLabs,
    speakCoaching,
    stopSpeaking,
    generateQuickResponse,
  };
};
import { useState, useCallback } from 'react';
import { callAutomationService } from '@/services/callAutomationService';
import { useAudioCapture } from './useAudioCapture';

interface CallData {
  id: string;
  customerInfo: {
    name?: string;
    phone: string;
    email?: string;
    company?: string;
  };
  agentInfo: {
    name: string;
    type: 'outbound' | 'retention' | 'telesales';
  };
  audioTranscript: string;
  customerAudio: string;
  agentAudio: string;
  duration: number;
  timestamp: Date;
  outcome?: 'success' | 'follow_up' | 'no_interest';
}

interface AutomatedFollowUp {
  id: string;
  callId: string;
  summary: string;
  keyPoints: string[];
  customerConcerns: string[];
  nextActions: string[];
  followUpEmail: string;
  caseNotes: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  recommendedTimeline: string;
  priority: 'high' | 'medium' | 'low';
}

interface RealTimeInsights {
  insights: string[];
  suggestions: string[];
  objectionHandling?: string;
  productInfo?: string;
  technicalInfo?: string;
}

export const useCallAutomation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCallData, setCurrentCallData] = useState<CallData | null>(null);
  const [realTimeInsights, setRealTimeInsights] = useState<RealTimeInsights>({
    insights: [],
    suggestions: []
  });
  const [followUps, setFollowUps] = useState<AutomatedFollowUp[]>([]);

  // Audio capture for real-time processing
  const { startRecording, stopRecording, isRecording } = useAudioCapture({
    onTranscript: (transcript) => {
      if (currentCallData) {
        handleRealTimeTranscript(transcript);
      }
    },
    includeSystemAudio: true
  });

  const startAutomatedCall = useCallback(async (callInfo: Partial<CallData>) => {
    const newCallData: CallData = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerInfo: callInfo.customerInfo || { phone: 'Unknown' },
      agentInfo: callInfo.agentInfo || { name: 'Agent', type: 'outbound' },
      audioTranscript: '',
      customerAudio: '',
      agentAudio: '',
      duration: 0,
      timestamp: new Date(),
      ...callInfo
    };

    setCurrentCallData(newCallData);
    
    // Start audio capture for real-time insights
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start audio capture:', error);
    }
  }, [startRecording]);

  const endAutomatedCall = useCallback(async () => {
    if (!currentCallData) return;

    setIsProcessing(true);

    try {
      // Stop audio recording
      await stopRecording();

      // Calculate final duration
      const finalCallData = {
        ...currentCallData,
        duration: Date.now() - currentCallData.timestamp.getTime()
      };

      // Generate automated follow-up
      const followUp = await callAutomationService.generateAutomatedFollowUp(finalCallData);
      
      setFollowUps(prev => [followUp, ...prev]);
      setCurrentCallData(null);
      setRealTimeInsights({ insights: [], suggestions: [] });

      return followUp;

    } catch (error) {
      console.error('Failed to process call automation:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [currentCallData, stopRecording]);

  const handleRealTimeTranscript = useCallback(async (transcript: string) => {
    if (!currentCallData) return;

    // Update current call transcript
    setCurrentCallData(prev => prev ? {
      ...prev,
      audioTranscript: prev.audioTranscript + ' ' + transcript
    } : null);

    try {
      // Get real-time insights
      const insights = await callAutomationService.processRealTimeAudio(
        transcript,
        currentCallData
      );

      setRealTimeInsights(insights);

    } catch (error) {
      console.error('Failed to process real-time insights:', error);
    }
  }, [currentCallData]);

  const generateFollowUpPreview = useCallback(async (callData: CallData): Promise<AutomatedFollowUp> => {
    setIsProcessing(true);
    try {
      return await callAutomationService.generateAutomatedFollowUp(callData);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const updateCustomerInfo = useCallback((customerInfo: Partial<CallData['customerInfo']>) => {
    if (currentCallData) {
      setCurrentCallData(prev => prev ? {
        ...prev,
        customerInfo: { ...prev.customerInfo, ...customerInfo }
      } : null);
    }
  }, [currentCallData]);

  return {
    // State
    isProcessing,
    isRecording,
    currentCallData,
    realTimeInsights,
    followUps,

    // Actions
    startAutomatedCall,
    endAutomatedCall,
    generateFollowUpPreview,
    updateCustomerInfo,

    // Utilities
    isCallActive: !!currentCallData,
    hasRealTimeInsights: realTimeInsights.insights.length > 0 || realTimeInsights.suggestions.length > 0
  };
};
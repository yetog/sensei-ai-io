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
  userFeedback?: SuggestionFeedback;
}

interface SuggestionFeedback {
  rating: 'helpful' | 'not_helpful';
  timestamp: number;
  reason?: string;
}

interface TranscriptionSegment {
  id: string;
  speaker: 'user' | 'customer';
  text: string;
  timestamp: number;
  confidence: number;
}

interface AudioSource {
  type: 'microphone' | 'tab' | 'both';
  micStream?: MediaStream;
  tabStream?: MediaStream;
  audioContext?: AudioContext;
  micAnalyser?: AnalyserNode;
  tabAnalyser?: AnalyserNode;
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
  audioSource: AudioSource['type'];
  micLevel: number;
  tabLevel: number;
  isTabAudioAvailable: boolean;
  error: CoachingError | null;
  sessionStatus: 'active' | 'paused' | 'stopped' | 'error';
  selectedAgentId?: string | null;
  // Production Features
  sessionDuration: number;
  maxSessionDuration: number;
  lastBackupTime: number;
  sessionWarnings: string[];
  sessionId: string;
  isRecording: boolean;
}

interface CoachingError {
  type: 'audio_failure' | 'speech_recognition_error' | 'ai_service_error' | 'permission_denied';
  message: string;
  canRecover: boolean;
  timestamp: number;
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
    isDemoMode: false,
    audioSource: 'microphone',
    micLevel: 0,
    tabLevel: 0,
    isTabAudioAvailable: false,
    error: null,
    sessionStatus: 'stopped',
    selectedAgentId: null,
    // Production Features
    sessionDuration: 0,
    maxSessionDuration: 30 * 60 * 1000, // 30 minutes default
    lastBackupTime: 0,
    sessionWarnings: [],
    sessionId: '',
    isRecording: false
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioSourceRef = useRef<AudioSource>({ type: 'microphone' });
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Production Features Implementation (defined early)
  const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const autoSaveSession = useCallback(() => {
    const sessionData = {
      sessionId: state.sessionId,
      transcript: state.transcription,
      suggestions: state.suggestions,
      callType: state.callType,
      duration: state.sessionDuration,
      timestamp: new Date().toISOString(),
      audioSource: state.audioSource
    };
    
    // Save to localStorage for recovery
    localStorage.setItem(`coaching_backup_${state.sessionId}`, JSON.stringify(sessionData));
    
    setState(prev => ({
      ...prev,
      lastBackupTime: Date.now()
    }));
    
    console.log('Session auto-saved:', state.sessionId);
  }, [state]);

  const startSessionTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    
    // Update session duration every second
    sessionTimerRef.current = setInterval(() => {
      const currentTime = Date.now();
      const duration = currentTime - startTimeRef.current;
      
      setState(prev => {
        const warnings = [...prev.sessionWarnings];
        
        // Check for session warnings
        const maxDuration = prev.maxSessionDuration;
        const remainingTime = maxDuration - duration;
        
        // Warning at 5 minutes remaining
        if (remainingTime <= 5 * 60 * 1000 && remainingTime > 4 * 60 * 1000 && !warnings.includes('5min')) {
          warnings.push('5min');
        }
        
        // Warning at 2 minutes remaining
        if (remainingTime <= 2 * 60 * 1000 && remainingTime > 1 * 60 * 1000 && !warnings.includes('2min')) {
          warnings.push('2min');
        }
        
        // Auto-save and stop at max duration
        if (duration >= maxDuration) {
          autoSaveSession();
          warnings.push('session_ended');
        }
        
        return {
          ...prev,
          sessionDuration: duration,
          sessionWarnings: warnings
        };
      });
    }, 1000);
  }, [autoSaveSession]);

  const stopSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const startAutoBackup = useCallback(() => {
    // Auto-backup every 5 minutes
    backupIntervalRef.current = setInterval(() => {
      if (state.isListening && state.transcription.length > 0) {
        autoSaveSession();
      }
    }, 5 * 60 * 1000);
  }, [state.isListening, state.transcription.length, autoSaveSession]);

  const stopAutoBackup = useCallback(() => {
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
      backupIntervalRef.current = null;
    }
  }, []);

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
              
              // Smart speaker detection based on audio levels
              const detectedSpeaker = detectSpeaker(prev.micLevel, prev.tabLevel, prev.audioSource);
              const currentSpeaker = detectedSpeaker || prev.currentTurn || 'user';
              
              // Enhanced consolidation: merge with previous segment if same speaker and within 5 seconds
              // OR if the gap is less than 3 seconds (natural pauses)
              const shouldMerge = lastSegment && 
                lastSegment.speaker === currentSpeaker && 
                (Date.now() - lastSegment.timestamp < 5000 || 
                 (Date.now() - lastSegment.timestamp < 3000 && lastSegment.text.length < 200));
              
              if (shouldMerge) {
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

            // Process for coaching suggestions if enabled
            if (shouldGenerateSuggestion(transcript, state.suggestions, Date.now() - state.lastSuggestionTime)) {
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

  // Enhanced audio capture functions
  const detectSpeaker = (micLevel: number, tabLevel: number, audioSource: AudioSource['type']): 'user' | 'customer' | null => {
    if (audioSource === 'microphone') return 'user';
    if (audioSource === 'tab') return 'customer';
    if (audioSource === 'both') {
      // If both sources active, determine speaker by audio levels
      if (micLevel > tabLevel + 10) return 'user';
      if (tabLevel > micLevel + 10) return 'customer';
    }
    return null;
  };

  const startAudioLevelMonitoring = useCallback(() => {
    if (!audioSourceRef.current.audioContext) return;

    const updateAudioLevels = () => {
      let micLevel = 0;
      let tabLevel = 0;

      if (audioSourceRef.current.micAnalyser) {
        const micData = new Uint8Array(audioSourceRef.current.micAnalyser.frequencyBinCount);
        audioSourceRef.current.micAnalyser.getByteFrequencyData(micData);
        micLevel = micData.reduce((sum, value) => sum + value, 0) / micData.length;
      }

      if (audioSourceRef.current.tabAnalyser) {
        const tabData = new Uint8Array(audioSourceRef.current.tabAnalyser.frequencyBinCount);
        audioSourceRef.current.tabAnalyser.getByteFrequencyData(tabData);
        tabLevel = tabData.reduce((sum, value) => sum + value, 0) / tabData.length;
      }

      setState(prev => ({ ...prev, micLevel, tabLevel }));
    };

    audioLevelIntervalRef.current = setInterval(updateAudioLevels, 100);
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
  }, []);

  const setupAudioAnalysis = useCallback(async (stream: MediaStream, type: 'mic' | 'tab') => {
    if (!audioSourceRef.current.audioContext) {
      audioSourceRef.current.audioContext = new AudioContext();
    }

    const source = audioSourceRef.current.audioContext.createMediaStreamSource(stream);
    const analyser = audioSourceRef.current.audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    if (type === 'mic') {
      audioSourceRef.current.micAnalyser = analyser;
    } else {
      audioSourceRef.current.tabAnalyser = analyser;
    }
  }, []);

  const getBrowserType = (): 'chrome' | 'safari' | 'firefox' | 'other' => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
    if (userAgent.includes('Firefox')) return 'firefox';
    return 'other';
  };

  const requestTabAudio = useCallback(async (): Promise<MediaStream | null> => {
    try {
      console.log('Requesting system audio capture...');
      
      const browserType = getBrowserType();
      
      // Browser-specific optimized constraints
      let constraints: any = {
        video: {
          width: { ideal: 1 },
          height: { ideal: 1 },
          frameRate: { ideal: 1 }
        }
      };

      // Chrome/Edge specific audio constraints (best compatibility)
      if (browserType === 'chrome') {
        constraints.audio = {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: { ideal: 2 },
          sampleRate: { ideal: 48000 },
          suppressLocalAudioPlayback: false
        };
      }
      // Safari specific constraints
      else if (browserType === 'safari') {
        constraints.audio = {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: { ideal: 2 }
        };
      }
      // Firefox and other browsers
      else {
        constraints.audio = {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        };
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      // Check if audio track is available
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        const browserType = getBrowserType();
        let errorMsg = 'No system audio captured. ';
        
        if (browserType === 'chrome') {
          errorMsg += 'In Chrome: Select "Entire Screen" → Check "Share audio" → Click Share.';
        } else if (browserType === 'safari') {
          errorMsg += 'In Safari: Select "Entire Screen" → Enable "Include Audio" → Click Share.';
        } else if (browserType === 'firefox') {
          errorMsg += 'Firefox may not support system audio. Try Chrome for best results.';
        } else {
          errorMsg += 'Please select "Entire Screen" and enable audio sharing.';
        }
        
        handleCoachingError('audio_failure', errorMsg, true);
        return null;
      }

      // Validate audio track settings
      const audioTrack = audioTracks[0];
      const settings = audioTrack.getSettings();
      console.log('System audio captured:', settings);
      
      if (settings.echoCancellation !== false) {
        console.warn('Echo cancellation not disabled - may affect system audio quality');
      }

      setState(prev => ({ 
        ...prev, 
        isTabAudioAvailable: true,
        error: null 
      }));
      
      await setupAudioAnalysis(stream, 'tab');
      audioSourceRef.current.tabStream = stream;
      
      // Keep minimal video track to maintain audio capture
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = false;
      });
      
      // Log system audio success
      console.log('✅ System audio captured successfully:', {
        audioTracks: audioTracks.length,
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount
      });
      
      // Monitor audio track for interruptions
      audioTrack.onended = () => {
        console.log('System audio track ended');
        handleCoachingError('audio_failure', 'System audio capture was interrupted', true);
      };
      
      return stream;
    } catch (error: any) {
      console.error('Error requesting system audio:', error);
      let errorMessage = 'Failed to capture system audio';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission denied for screen capture';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Browser does not support system audio capture';
      } else if (error.name === 'AbortError') {
        errorMessage = 'User cancelled screen capture';
      }
      
      handleCoachingError('permission_denied', errorMessage, false);
      setState(prev => ({ ...prev, isTabAudioAvailable: false }));
      return null;
    }
  }, [setupAudioAnalysis]);

  const requestMicrophoneAudio = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      await setupAudioAnalysis(stream, 'mic');
      audioSourceRef.current.micStream = stream;
      return stream;
    } catch (error) {
      console.error('Microphone access failed:', error);
      return null;
    }
  }, [setupAudioAnalysis]);

  const stopAllAudioStreams = useCallback(() => {
    if (audioSourceRef.current.micStream) {
      audioSourceRef.current.micStream.getTracks().forEach(track => track.stop());
      audioSourceRef.current.micStream = undefined;
    }
    if (audioSourceRef.current.tabStream) {
      audioSourceRef.current.tabStream.getTracks().forEach(track => track.stop());
      audioSourceRef.current.tabStream = undefined;
    }
    if (audioSourceRef.current.audioContext) {
      audioSourceRef.current.audioContext.close();
      audioSourceRef.current.audioContext = undefined;
    }
    stopAudioLevelMonitoring();
  }, [stopAudioLevelMonitoring]);

  // Smart filtering function to prevent suggestion overload
  const shouldGenerateSuggestion = (transcript: string, currentSuggestions: CoachingSuggestion[], timeSinceLastSuggestion: number): boolean => {
    // Skip if in demo mode and user is talking about the system
    if (state.isDemoMode && transcript.toLowerCase().includes('coaching')) {
      return false;
    }

    // Minimum conversation length threshold (at least 100 characters)
    if (state.conversationLength < 100) {
      return false;
    }

    // Time throttling - wait at least 15 seconds between suggestions
    if (timeSinceLastSuggestion < 15000) {
      return false;
    }

    // Limit total active suggestions to 2 for better readability
    if (currentSuggestions.length >= 2) {
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
      const coachingPrompt = createCoachingPrompt(text, callType, state.transcription, state.selectedAgentId);
      
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

  const createCoachingPrompt = (currentText: string, callType: string, history: TranscriptionSegment[], agentId?: string | null): string => {
    const context = history.slice(-3).map(seg => `${seg.speaker}: ${seg.text}`).join('\n');
    
    // Detect conversation phase
    const conversationPhase = detectConversationPhase(history, currentText);
    
    // Get agent-specific instructions if agent is selected
    let agentContext = '';
    if (agentId) {
      const { agentService } = require('@/services/agentService');
      const agent = agentService.get(agentId);
      if (agent) {
        agentContext = `\n\nSPECIALIZED AGENT CONTEXT:\nAgent: ${agent.name}\nExpertise: ${agent.systemPrompt.substring(0, 200)}...\nUse this agent's expertise to provide targeted coaching.`;
      }
    }

    const callTypeInstructions = {
      incoming_sales: "Focus ONLY on clear buying signals, direct objections, and urgent closing opportunities.",
      retention: "Focus ONLY on cancellation reasons and immediate retention opportunities.",
      outbound: "Focus ONLY on qualification questions and scheduling opportunities.",
      general: "Focus ONLY on clear coaching moments - objections, buying signals, or closing."
    };

    return `You are an expert sales coach providing CONSERVATIVE, high-value coaching suggestions for a live ${callType} call.${agentContext}

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
      "suggestion": "Single actionable response",
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
          // Use only the first suggestion to avoid undefined issues
          const suggestionText = suggestion.suggestion1 || suggestion.suggestion || '';
          
          if (!suggestionText || suggestionText.trim().length === 0) return null;
          
          return {
            id: `${Date.now()}_${Math.random()}`,
            type: suggestion.type || 'general',
            context: suggestion.analysis || context,
            suggestion: suggestionText,
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

  const exportSessionData = useCallback(() => {
    const sessionData = {
      sessionId: state.sessionId,
      transcript: state.transcription,
      suggestions: state.suggestions,
      callType: state.callType,
      duration: state.sessionDuration,
      conversationLength: state.conversationLength,
      audioSource: state.audioSource,
      warnings: state.sessionWarnings,
      timestamp: new Date().toISOString(),
      quality: {
        averageConfidence: state.transcription.length > 0 
          ? state.transcription.reduce((sum, seg) => sum + seg.confidence, 0) / state.transcription.length 
          : 0,
        totalSegments: state.transcription.length,
        totalSuggestions: state.suggestions.length
      }
    };
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coaching-session-${state.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const startListening = useCallback(async (callType: CoachingState['callType'] = 'general', audioSource: AudioSource['type'] = 'microphone', selectedAgentId?: string | null) => {
    if (recognitionRef.current) {
      // Setup audio streams based on selected source
      if (audioSource === 'microphone' || audioSource === 'both') {
        await requestMicrophoneAudio();
      }
      if (audioSource === 'tab' || audioSource === 'both') {
        await requestTabAudio();
      }

      const sessionId = generateSessionId();
      
      setState(prev => ({ 
        ...prev, 
        callType,
        audioSource,
        transcription: [],
        suggestions: [],
        currentTurn: audioSource === 'tab' ? 'customer' : 'user',
        conversationLength: 0,
        lastSuggestionTime: 0,
        selectedAgentId,
        error: null,
        sessionStatus: 'active',
        sessionId,
        sessionDuration: 0,
        sessionWarnings: [],
        isRecording: true
      }));

      // Start production features
      startSessionTimer();
      startAutoBackup();
      startAudioLevelMonitoring();
      recognitionRef.current.start();
    }
  }, [requestMicrophoneAudio, requestTabAudio, startAudioLevelMonitoring, startSessionTimer, startAutoBackup]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
      stopAllAudioStreams();
      
      // Stop production features
      stopSessionTimer();
      stopAutoBackup();
      
      // Final auto-save
      if (state.transcription.length > 0) {
        autoSaveSession();
      }
      
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        isProcessing: false,
        sessionStatus: 'stopped',
        isRecording: false
      }));
    }
  }, [state.isListening, stopAllAudioStreams, stopSessionTimer, stopAutoBackup, autoSaveSession, state.transcription.length]);

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

  const rateSuggestion = useCallback((suggestionId: string, rating: 'helpful' | 'not_helpful', reason?: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.map(suggestion => 
        suggestion.id === suggestionId 
          ? {
              ...suggestion,
              userFeedback: {
                rating,
                timestamp: Date.now(),
                reason
              }
            }
          : suggestion
      )
    }));
  }, []);

  const handleCoachingError = useCallback((type: CoachingError['type'], message: string, canRecover: boolean) => {
    setState(prev => ({
      ...prev,
      error: {
        type,
        message,
        canRecover,
        timestamp: Date.now()
      },
      sessionStatus: 'error'
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      sessionStatus: 'stopped'
    }));
  }, []);

  const retryOperation = useCallback(() => {
    if (state.error?.canRecover) {
      clearError();
      // Attempt to restart based on error type
      if (state.error.type === 'speech_recognition_error' || state.error.type === 'audio_failure') {
        startListening(state.callType, state.audioSource);
      }
    }
  }, [state.error, state.callType, state.audioSource]);

  const toggleDemoMode = useCallback(() => {
    setState(prev => ({ ...prev, isDemoMode: !prev.isDemoMode }));
  }, []);

  const requestCoaching = useCallback(() => {
    if (state.transcription.length > 0) {
      const lastSegment = state.transcription[state.transcription.length - 1];
      processTranscriptionForCoaching(lastSegment.text, state.callType);
    }
  }, [state.transcription, state.callType]);

  const pauseSession = useCallback(() => {
    setState(prev => ({ ...prev, sessionStatus: 'paused' }));
    stopSessionTimer();
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const resumeSession = useCallback(() => {
    setState(prev => ({ ...prev, sessionStatus: 'active' }));
    startSessionTimer();
    if (recognitionRef.current && !state.isListening) {
      recognitionRef.current.start();
    }
  }, [state.isListening]);

  const setMaxSessionDuration = useCallback((minutes: number) => {
    setState(prev => ({
      ...prev,
      maxSessionDuration: minutes * 60 * 1000,
      sessionWarnings: [] // Reset warnings when duration changes
    }));
  }, []);

  const recoverSession = useCallback(() => {
    const backups = Object.keys(localStorage).filter(key => key.startsWith('coaching_backup_'));
    if (backups.length > 0) {
      const latestBackup = backups.sort().pop();
      if (latestBackup) {
        try {
          const sessionData = JSON.parse(localStorage.getItem(latestBackup) || '{}');
          setState(prev => ({
            ...prev,
            transcription: sessionData.transcript || [],
            suggestions: sessionData.suggestions || [],
            callType: sessionData.callType || 'general',
            sessionId: sessionData.sessionId || generateSessionId()
          }));
          return true;
        } catch (error) {
          console.error('Failed to recover session:', error);
        }
      }
    }
    return false;
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleSpeaker,
    clearSession,
    dismissSuggestion,
    rateSuggestion,
    toggleDemoMode,
    requestCoaching,
    saveTranscript,
    exportTranscriptData: exportSessionData,
    requestTabAudio,
    requestMicrophoneAudio,
    stopAllAudioStreams,
    handleCoachingError,
    clearError,
    retryOperation,
    // Production Features
    pauseSession,
    resumeSession,
    setMaxSessionDuration,
    recoverSession,
    autoSaveSession,
    // Utility functions
    formatSessionDuration: () => {
      const minutes = Math.floor(state.sessionDuration / 60000);
      const seconds = Math.floor((state.sessionDuration % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    getRemainingTime: () => {
      const remaining = state.maxSessionDuration - state.sessionDuration;
      return Math.max(0, remaining);
    },
    getSessionQuality: () => {
      if (state.transcription.length === 0) return 0;
      return state.transcription.reduce((sum, seg) => sum + seg.confidence, 0) / state.transcription.length;
    },
    isAvailable: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
}

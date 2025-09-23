import { useState, useRef, useCallback, useEffect } from 'react';
import { ionosAI } from '@/services/ionosAI';
import { whisperService } from '@/services/whisperTranscriptionService';
import { hybridAI } from '@/services/hybridAI';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import { smartCache } from '@/services/smartCache';
import { performanceProfiler } from '@/services/performanceProfiler';
import { callSummaryStorage } from '@/services/callSummaryStorage';
import { feedbackLearning, type SuggestionFeedback as FeedbackData } from '@/services/feedbackLearning';

// Types and interfaces
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
  timeStamp: number;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface CoachingSuggestion {
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

interface SuggestionFeedback {
  suggestionId: string;
  rating: 'helpful' | 'not_helpful';
  reason?: string;
  timestamp: number;
}

interface TranscriptionSegment {
  id: string;
  speaker: 'user' | 'customer';
  text: string;
  timestamp: number;
  confidence: number;
  segmentGroup?: string;
  isConsolidated?: boolean;
  duration?: number;
}

interface AudioSource {
  type: 'microphone' | 'tab' | 'both';
  stream?: MediaStream;
}

interface CoachingState {
  isListening: boolean;
  isProcessing: boolean;
  transcription: TranscriptionSegment[];
  suggestions: CoachingSuggestion[];
  interimTranscript: string;
  callType: 'cold_call' | 'demo' | 'follow_up' | 'closing' | 'discovery' | 'incoming_sales' | 'retention' | 'outbound' | 'general';
  micLevel: number;
  tabLevel: number;
  currentTurn: 'user' | 'customer';
  sessionStartTime: number | null;
  sessionDuration: number;
  conversationLength: number;
  totalExchanges: number;
  error: CoachingError | null;
  maxSessionDuration: number;
  isPaused: boolean;
  isDemoMode: boolean;
  autoSaveInterval: number;
  lastSuggestionTime: number;
  suggestionCount: number;
  audioSource: AudioSource['type'];
  recognitionRestarts: number;
  transcriptQuality: number;
  lastTranscriptTime: number;
  selectedAgentId: string | null;
  coachingMode: 'live' | 'manual';
}

interface CoachingError {
  type: 'audio_failure' | 'speech_recognition_error' | 'ai_service_error' | 'permission_denied';
  message: string;
  timestamp: number;
  isRecoverable: boolean;
  canRecover: boolean;
}

// Utility functions
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(' ');
  const words2 = text2.toLowerCase().split(' ');
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function cleanTranscriptText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*([.!?])+/g, '$1')
    .replace(/^[^A-Za-z0-9]*/, '')
    .replace(/[^A-Za-z0-9]*$/, '');
}

// Main hook
export const useRealTimeCoaching = () => {
  const { startTiming, endTiming, getStats, logPerformanceReport } = usePerformanceMetrics();
  
  const [state, setState] = useState<CoachingState>({
    isListening: false,
    isProcessing: false,
    transcription: [],
    suggestions: [],
    interimTranscript: '',
    callType: 'cold_call',
    micLevel: 0,
    tabLevel: 0,
    currentTurn: 'user',
    sessionStartTime: null,
    sessionDuration: 0,
    conversationLength: 0,
    totalExchanges: 0,
    error: null,
    maxSessionDuration: 60,
    isPaused: false,
    isDemoMode: false,
    autoSaveInterval: 30000,
    lastSuggestionTime: 0,
    suggestionCount: 0,
    audioSource: 'microphone',
    recognitionRestarts: 0,
    transcriptQuality: 0,
    lastTranscriptTime: 0,
    selectedAgentId: null,
    coachingMode: 'manual',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const tabStreamRef = useRef<MediaStream | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedResults = useRef<Set<string>>(new Set());
  const restartAttemptRef = useRef<number>(0);
  const isUsingWhisper = useRef<boolean>(false);
  const processingQueue = useRef<string[]>([]);

  // Helper functions
  const detectSpeaker = (micLevel: number, tabLevel: number, audioSource: AudioSource['type']): 'user' | 'customer' | null => {
    if (audioSource === 'microphone') return 'user';
    if (audioSource === 'tab') return 'customer';
    if (audioSource === 'both') {
      if (micLevel > tabLevel + 10) return 'user';
      if (tabLevel > micLevel + 10) return 'customer';
    }
    return null;
  };

  const shouldGenerateSuggestion = (transcript: string, suggestions: CoachingSuggestion[], lastSuggestionTime: number, coachingMode: 'live' | 'manual'): boolean => {
    if (coachingMode === 'manual') return false; // Only generate on manual request
    
    const timeSinceLastSuggestion = Date.now() - lastSuggestionTime;
    const minInterval = 15000;
    
    return transcript.length > 50 && 
           timeSinceLastSuggestion > minInterval && 
           suggestions.length < 5;
  };

  // Whisper transcription handler
  const handleWhisperTranscription = useCallback((result: { text: string; confidence: number; timestamp: number; isPartial: boolean }) => {
    const profileId = performanceProfiler.startProfile('whisper_transcription', 'transcription', {
      textLength: result.text.length,
      confidence: result.confidence,
      isPartial: result.isPartial
    });
    
    const transcript = cleanTranscriptText(result.text);
    if (transcript.length < 2) {
      performanceProfiler.endProfile(profileId);
      return;
    }

    setState(prev => {
      const currentTime = Date.now();
      const detectedSpeaker = detectSpeaker(prev.micLevel, prev.tabLevel, prev.audioSource);
      const currentSpeaker = detectedSpeaker || prev.currentTurn || 'user';

      if (result.isPartial) {
        // Update interim transcript for progressive display
        return { ...prev, interimTranscript: transcript };
      }

      // Create new segment for final result
      const newSegment: TranscriptionSegment = {
        id: currentTime.toString(),
        speaker: currentSpeaker,
        text: transcript,
        timestamp: currentTime,
        confidence: result.confidence,
        segmentGroup: `${currentSpeaker}_${Math.floor(currentTime / 30000)}`,
        duration: 0
      };

      const updatedState = {
        ...prev,
        transcription: [...prev.transcription, newSegment],
        conversationLength: prev.conversationLength + transcript.length,
        totalExchanges: prev.totalExchanges + 1,
        transcriptQuality: Math.max(prev.transcriptQuality, result.confidence),
        lastTranscriptTime: currentTime,
        currentTurn: currentSpeaker,
        interimTranscript: ''
      };

      // Queue for async coaching processing (only in live mode)
      if (shouldGenerateSuggestion(transcript, prev.suggestions, prev.lastSuggestionTime, prev.coachingMode)) {
        processingQueue.current.push(transcript);
        processCoachingQueue();
      }

      return updatedState;
    });

    performanceProfiler.endProfile(profileId, { segmentCount: state.transcription.length });
  }, [state.micLevel, state.tabLevel, state.audioSource, state.currentTurn, state.suggestions, state.lastSuggestionTime]);

  // Async coaching processing queue
  const processCoachingQueue = useCallback(async () => {
    if (processingQueue.current.length === 0 || isProcessing) return;

    setIsProcessing(true);
    const transcript = processingQueue.current.shift();
    
    if (transcript) {
      const profileId = performanceProfiler.startProfile('coaching_ai_processing', 'ai_processing', {
        transcriptLength: transcript.length,
        callType: state.callType,
        queueLength: processingQueue.current.length
      });

      try {
        // Check cache first for pattern-based responses
        const cacheKey = `coaching_${state.callType}_${transcript.substring(0, 50).replace(/\W/g, '_')}`;
        let cachedResponse = smartCache.get(cacheKey);
        
        if (!cachedResponse) {
          cachedResponse = smartCache.predictResponse(transcript);
        }

        if (cachedResponse) {
          console.log('🎯 Using cached coaching response');
          setState(prev => ({
            ...prev,
            suggestions: [...prev.suggestions, {
              id: Date.now().toString(),
              type: 'general' as const,
              title: 'Cached Suggestion',
              suggestion: String(cachedResponse),
              context: transcript.substring(0, 100),
              confidence: 0.8,
              timestamp: Date.now(),
              priority: 'medium' as const
            }],
            lastSuggestionTime: Date.now(),
            suggestionCount: prev.suggestionCount + 1
          }));
        } else {
          await processTranscriptionForCoaching(transcript, state.callType);
        }
      } finally {
        performanceProfiler.endProfile(profileId, { 
          suggestionsGenerated: state.suggestions.length 
        });
        setIsProcessing(false);
        
        // Process next item if queue has more
        if (processingQueue.current.length > 0) {
          setTimeout(processCoachingQueue, 100);
        }
      }
    } else {
      setIsProcessing(false);
    }
  }, [isProcessing, state.callType, state.suggestions]);

  // Auto-backup functionality
  const startAutoBackup = useCallback(() => {
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
    }
    
    backupIntervalRef.current = setInterval(() => {
      if (state.transcription.length > 0) {
        localStorage.setItem('realtime-coaching-backup', JSON.stringify({
          transcription: state.transcription,
          suggestions: state.suggestions,
          timestamp: Date.now()
        }));
      }
    }, state.autoSaveInterval);
  }, [state.transcription, state.suggestions, state.autoSaveInterval]);

  const stopAutoBackup = useCallback(() => {
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
      backupIntervalRef.current = null;
    }
  }, []);

  // Recognition restart function
  const attemptRecognitionRestart = useCallback(() => {
    if (restartAttemptRef.current >= 5) {
      console.log('Max restart attempts reached');
      setState(prev => ({ ...prev, isListening: false }));
      return;
    }

    restartAttemptRef.current += 1;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (recognitionRef.current && state.isListening) {
            recognitionRef.current.start();
          }
        }, 500);
      } catch (error) {
        console.error('Error restarting recognition:', error);
        setState(prev => ({ ...prev, isListening: false }));
      }
    }
  }, [state.isListening]);

  // Initialize speech recognition
  // Initialize hybrid AI on component mount
  useEffect(() => {
    hybridAI.initialize().catch(error => {
      console.warn('⚠️ Hybrid AI initialization failed:', error);
    });
    
    return () => {
      hybridAI.cleanup();
    };
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognitionClass() as SpeechRecognition;
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState(prev => ({ ...prev, isListening: true }));
        restartAttemptRef.current = 0;
      };

      recognition.onresult = (event) => {
        setIsProcessing(true);
        console.log('Speech recognition result received:', event);
        
        if (!processedResults.current) {
          processedResults.current = new Set();
        }
        
        // Only process the latest final result
        let latestFinalResult = null;
        let latestFinalIndex = -1;
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            latestFinalResult = result;
            latestFinalIndex = i;
          }
        }
        
        if (latestFinalResult) {
          const resultId = `${event.timeStamp}_${latestFinalIndex}_final`;
          
          if (processedResults.current.has(resultId)) {
            setIsProcessing(false);
            return;
          }
          processedResults.current.add(resultId);
          
          // Clean up old processed results
          if (processedResults.current.size > 10) {
            const oldIds = Array.from(processedResults.current).slice(0, -10);
            oldIds.forEach(id => processedResults.current!.delete(id));
          }
          
          const bestTranscript = latestFinalResult[0];
          const transcript = cleanTranscriptText(bestTranscript.transcript);
          const confidence = bestTranscript.confidence || 0.7;
          
          if (transcript.length > 2) {
            setState(prev => {
              const lastSegment = prev.transcription[prev.transcription.length - 1];
              const currentTime = Date.now();
              
              const detectedSpeaker = detectSpeaker(prev.micLevel, prev.tabLevel, prev.audioSource);
              const currentSpeaker = detectedSpeaker || prev.currentTurn || 'user';
              
              const timeSinceLastSegment = lastSegment ? currentTime - lastSegment.timestamp : Infinity;
              
              // Check for text similarity to prevent duplicates
              const textSimilarity = lastSegment ? calculateTextSimilarity(lastSegment.text, transcript) : 0;
              const isDuplicate = textSimilarity > 0.8;
              
              if (isDuplicate) {
                console.log('Skipping duplicate transcript:', transcript);
                return prev;
              }
              
              const shouldMerge = lastSegment && 
                lastSegment.speaker === currentSpeaker && 
                timeSinceLastSegment < 5000 && 
                lastSegment.text.length < 200;
              
              const qualityScore = Math.round((confidence * 100 + (transcript.length > 10 ? 20 : 0)) / 1.2);
              
              if (shouldMerge) {
                const updatedTranscription = [...prev.transcription];
                const lastText = lastSegment.text.trimEnd();
                const cleanedTranscript = transcript.trim();
                
                // Check if new transcript is substring of last text
                if (lastText.toLowerCase().includes(cleanedTranscript.toLowerCase())) {
                  console.log('Skipping substring duplicate:', cleanedTranscript);
                  return prev;
                }
                
                // Check for word overlap and remove it
                const lastWords = lastText.split(' ').slice(-3);
                const newWords = cleanedTranscript.split(' ');
                
                let finalText = lastText;
                let startIndex = 0;
                
                // Find overlap
                for (let i = 0; i < Math.min(lastWords.length, newWords.length); i++) {
                  if (lastWords[lastWords.length - 1 - i].toLowerCase() === newWords[i].toLowerCase()) {
                    startIndex = i + 1;
                  }
                }
                
                // Merge without overlap
                const remainingNewWords = newWords.slice(startIndex);
                if (remainingNewWords.length > 0) {
                  const connector = lastText.match(/[.!?]$/) ? ' ' : '. ';
                  finalText = lastText + connector + remainingNewWords.join(' ');
                }
                
                updatedTranscription[updatedTranscription.length - 1] = {
                  ...lastSegment,
                  text: finalText,
                  confidence: Math.max(lastSegment.confidence, confidence),
                  isConsolidated: true,
                  duration: currentTime - lastSegment.timestamp
                };
                
                return {
                  ...prev,
                  transcription: updatedTranscription,
                  conversationLength: prev.conversationLength + transcript.length,
                  transcriptQuality: Math.max(prev.transcriptQuality, qualityScore),
                  lastTranscriptTime: currentTime,
                  interimTranscript: ''
                };
              } else {
                // Create new segment
                const groupId = `${currentSpeaker}_${Math.floor(currentTime / 30000)}`;
                const newSegment: TranscriptionSegment = {
                  id: currentTime.toString(),
                  speaker: currentSpeaker,
                  text: transcript,
                  timestamp: currentTime,
                  confidence: confidence,
                  segmentGroup: groupId,
                  duration: 0
                };
                
                return {
                  ...prev,
                  transcription: [...prev.transcription, newSegment],
                  conversationLength: prev.conversationLength + transcript.length,
                  totalExchanges: prev.totalExchanges + 1,
                  transcriptQuality: Math.max(prev.transcriptQuality, qualityScore),
                  lastTranscriptTime: currentTime,
                  currentTurn: currentSpeaker,
                  interimTranscript: ''
                };
              }
            });
            
            // Process for coaching suggestions
            if (shouldGenerateSuggestion(transcript, state.suggestions, state.lastSuggestionTime, state.coachingMode)) {
              processTranscriptionForCoaching(transcript, state.callType);
            }
          }
        }
        
        // Handle interim results
        const latestResult = event.results[event.results.length - 1];
        if (!latestResult.isFinal && latestResult[0]) {
          const interimText = latestResult[0].transcript;
          setState(prev => ({ ...prev, interimTranscript: interimText }));
        }
        
        setIsProcessing(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'network') {
          console.log('Network error - attempting restart...');
          attemptRecognitionRestart();
        } else if (event.error === 'no-speech') {
          console.log('No speech detected - continuing...');
        } else {
          setState(prev => ({ 
            ...prev, 
            isListening: false,
            recognitionRestarts: prev.recognitionRestarts + 1
          }));
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        
        if (state.isListening && restartAttemptRef.current < 5) {
          console.log('Auto-restarting speech recognition...');
          setTimeout(() => attemptRecognitionRestart(), 1000);
        } else {
          setState(prev => ({ ...prev, isListening: false }));
        }
      };
    }
  }, [state.currentTurn, state.callType]);

  // Audio capture functions
  const requestTabAudio = async (): Promise<MediaStream | null> => {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      tabStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing tab audio:', error);
      return null;
    }
  };

  const requestMicrophoneAudio = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      micStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return null;
    }
  };

  const stopAllAudioStreams = () => {
    [micStreamRef.current, tabStreamRef.current].forEach(stream => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    });
    micStreamRef.current = null;
    tabStreamRef.current = null;
  };

  // Main functions
  const startListening = async (callType: CoachingState['callType'], audioSource: AudioSource['type'], selectedAgentId?: string | null) => {
    console.log('🎤 Starting coaching session...', { callType, audioSource, selectedAgentId });
    
    try {
      startTiming('session_startup');
      
      setState(prev => ({ 
        ...prev, 
        callType,
        audioSource,
        sessionStartTime: Date.now(),
        selectedAgentId: selectedAgentId || null,
        error: null,
        isListening: true
      }));

      console.log('🎤 Requesting audio access...');
      
      // Try to use Whisper first, fallback to browser speech recognition
      let useWhisper = false;
      let audioStream: MediaStream | null = null;

      if (audioSource === 'microphone' || audioSource === 'both') {
        console.log('🎙️ Requesting microphone audio...');
        audioStream = await requestMicrophoneAudio();
        if (audioStream) {
          console.log('✅ Microphone audio stream obtained');
        } else {
          console.log('❌ Microphone audio failed');
          if (audioSource === 'both') {
            throw new Error('Microphone access failed - required for microphone + system audio mode');
          }
        }
      }
      
      if (audioSource === 'tab' || audioSource === 'both') {
        console.log('🖥️ Requesting tab audio...');
        const tabStream = await requestTabAudio();
        if (tabStream) {
          console.log('✅ Tab audio stream obtained');
        } else {
          console.log('❌ Tab audio failed');
        }
        
        if (audioSource === 'both' && audioStream && tabStream) {
          console.log('🔗 Combining microphone and tab audio streams...');
          // Combine both streams for 'both' mode
          const audioContext = new AudioContext();
          const micSource = audioContext.createMediaStreamSource(audioStream);
          const tabSource = audioContext.createMediaStreamSource(tabStream);
          const destination = audioContext.createMediaStreamDestination();
          
          micSource.connect(destination);
          tabSource.connect(destination);
          
          audioStream = destination.stream;
          console.log('✅ Audio streams combined successfully');
        } else {
          audioStream = audioStream || tabStream;
        }
        
        if (!audioStream && audioSource === 'tab') {
          throw new Error('System audio access failed');
        }
      }

      console.log('🎵 Audio stream status:', { 
        hasStream: !!audioStream, 
        tracks: audioStream?.getTracks().length || 0,
        active: audioStream?.active 
      });

      if (audioStream) {
        // Start audio level monitoring first
        console.log('🎵 Setting up audio level monitoring...');
        try {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(audioStream);
          const analyser = audioContext.createAnalyser();
          
          analyser.fftSize = 256;
          source.connect(analyser);
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateAudioLevel = () => {
            if (!state.isListening) return;
            
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = Math.min(100, (average / 128) * 100);
            
            setState(prev => ({ ...prev, micLevel: normalizedLevel }));
            requestAnimationFrame(updateAudioLevel);
          };
          
          updateAudioLevel();
          console.log('✅ Audio level monitoring started');
        } catch (audioError) {
          console.error('❌ Audio level monitoring failed:', audioError);
        }
        
        try {
          console.log('🤖 Attempting Whisper initialization...');
          // Try Whisper first for better performance
          await whisperService.initialize();
          whisperService.addListener(handleWhisperTranscription);
          await whisperService.startTranscription(audioStream);
          useWhisper = true;
          isUsingWhisper.current = true;
          console.log('✅ Whisper transcription started successfully');
        } catch (whisperError) {
          console.warn('❌ Whisper initialization failed, falling back to browser speech recognition:', whisperError);
          useWhisper = false;
          isUsingWhisper.current = false;
        }
      }

      // Fallback to browser speech recognition if Whisper fails or no audio stream
      if (!useWhisper) {
        console.log('🎙️ Starting browser speech recognition fallback...');
        
        // Create new speech recognition instance
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.maxAlternatives = 1;
          
          // Browser speech recognition handles its own audio capture
          console.log('🎤 Browser speech recognition will use default microphone');
          
          recognitionRef.current.onresult = (event) => {
            setIsProcessing(true);
            console.log('Speech recognition result received:', event);
            
            if (!processedResults.current) {
              processedResults.current = new Set();
            }
            
            // Only process the latest final result
            let latestFinalResult = null;
            let latestFinalIndex = -1;
            
            for (let i = 0; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                latestFinalResult = result;
                latestFinalIndex = i;
              }
            }
            
            if (latestFinalResult) {
              const resultId = `${event.timeStamp}_${latestFinalIndex}_final`;
              
              if (processedResults.current.has(resultId)) {
                setIsProcessing(false);
                return;
              }
              processedResults.current.add(resultId);
              
              const bestTranscript = latestFinalResult[0];
              const transcript = cleanTranscriptText(bestTranscript.transcript);
              const confidence = bestTranscript.confidence || 0.7;
              
              if (transcript.length > 2) {
                console.log('📝 Processing speech recognition transcript:', transcript);
                
                // Use the same processing logic as the existing speech recognition
                setState(prev => {
                  const lastSegment = prev.transcription[prev.transcription.length - 1];
                  const currentTime = Date.now();
                  
                  const detectedSpeaker = detectSpeaker(prev.micLevel, prev.tabLevel, prev.audioSource);
                  const currentSpeaker = detectedSpeaker || prev.currentTurn || 'user';
                  
                  const newSegment: TranscriptionSegment = {
                    id: currentTime.toString(),
                    speaker: currentSpeaker,
                    text: transcript,
                    timestamp: currentTime,
                    confidence: confidence,
                    segmentGroup: `${currentSpeaker}_${Math.floor(currentTime / 30000)}`,
                    duration: 0
                  };

                  return {
                    ...prev,
                    transcription: [...prev.transcription, newSegment],
                    conversationLength: prev.conversationLength + transcript.length,
                    totalExchanges: prev.totalExchanges + 1,
                    transcriptQuality: Math.max(prev.transcriptQuality, confidence),
                    lastTranscriptTime: currentTime,
                    currentTurn: currentSpeaker
                  };
                });
              }
            }
            setIsProcessing(false);
          };
          
          recognitionRef.current.onerror = (event: any) => {
            console.error('❌ Speech recognition error:', event.error);
            setState(prev => ({
              ...prev,
              error: {
                type: 'speech_recognition_error',
                message: `Speech recognition error: ${event.error}`,
                timestamp: Date.now(),
                isRecoverable: true,
                canRecover: true
              }
            }));
          };
          
          recognitionRef.current.onend = () => {
            console.log('🔄 Speech recognition ended, restarting...');
            if (state.isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (restartError) {
                console.error('❌ Speech recognition restart failed:', restartError);
              }
            }
          };
          
          try {
            recognitionRef.current.start();
            console.log('✅ Browser speech recognition started successfully');
          } catch (startError) {
            console.error('❌ Browser speech recognition start failed:', startError);
            throw new Error(`Speech recognition failed: ${startError}`);
          }
        } else {
          throw new Error('Browser speech recognition not supported');
        }
        // Speech recognition already started above - no duplicate start call needed
        restartAttemptRef.current = 0;
        processedResults.current = new Set();
      }

      if (!useWhisper && !recognitionRef.current) {
        console.error('❌ No speech recognition method available');
        throw new Error('No speech recognition method available');
      }

      startAutoBackup();
      endTiming('session_startup');
      console.log('🎉 Coaching session started successfully');
      
    } catch (error) {
      console.error('❌ Error starting listening:', error);
      setState(prev => ({ 
        ...prev, 
        isListening: false,
        error: { 
          type: 'audio_failure', 
          message: error instanceof Error ? error.message : 'Failed to start audio capture', 
          timestamp: Date.now(), 
          isRecoverable: true,
          canRecover: true
        } 
      }));
    }
  };

  const stopListening = () => {
    // Stop Whisper transcription if active
    if (isUsingWhisper.current) {
      whisperService.removeListener(handleWhisperTranscription);
      whisperService.stopTranscription();
      isUsingWhisper.current = false;
    }
    
    // Stop browser speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    stopAllAudioStreams();
    stopAutoBackup();
    
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    
    // Clear processing queue
    processingQueue.current = [];
    setIsProcessing(false);
    
    // Log performance report
    logPerformanceReport();
    
    setState(prev => ({ 
      ...prev, 
      isListening: false,
      sessionDuration: prev.sessionStartTime ? Date.now() - prev.sessionStartTime : 0
    }));
  };

  // AI coaching functions - using hybrid local/cloud AI
  const processTranscriptionForCoaching = async (text: string, callType: string) => {
    try {
      startTiming('ai_coaching_generation');
      
      // Get conversation history for context
      const conversationHistory = state.transcription
        .slice(-5)
        .map(segment => `${segment.speaker}: ${segment.text}`);
      
      // Use hybrid AI service for coaching suggestions
      const suggestion = await hybridAI.generateCoachingSuggestion(text, callType, conversationHistory);
      
      endTiming('ai_coaching_generation');
      
      if (suggestion) {
        setState(prev => ({
          ...prev,
          suggestions: [...prev.suggestions, suggestion],
          lastSuggestionTime: Date.now(),
          suggestionCount: prev.suggestionCount + 1
        }));
        
        console.log(`🎯 Coaching suggestion generated via ${suggestion.source} AI in ${suggestion.processingTime?.toFixed(2)}ms`);
      }
    } catch (error) {
      endTiming('ai_coaching_generation');
      console.error('Error processing coaching:', error);
    }
  };

  const createCoachingPrompt = (transcript: string, callType: string, history: TranscriptionSegment[]): string => {
    const context = history.slice(-5).map(s => `${s.speaker}: ${s.text}`).join('\n');
    
    return `As a sales coach, analyze this ${callType} conversation and provide specific suggestions:

Recent conversation:
${context}

Latest statement: "${transcript}"

Provide 1-2 specific, actionable suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "objection|product_pitch|closing|retention|general",
      "title": "Brief title",
      "suggestion": "Specific actionable advice",
      "confidence": 0.8,
      "priority": "high|medium|low"
    }
  ]
}`;
  };

  const parseCoachingResponse = (response: string, context: string): CoachingSuggestion[] => {
    try {
      // First try to parse JSON structure from the response
      const jsonMatch = response.match(/```json\s*\{[\s\S]*?\}\s*```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0].replace(/```json\s*/, '').replace(/\s*```/, '');
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          return parsed.suggestions.map((s: any) => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: (s.type || 'general') as 'objection' | 'product_pitch' | 'closing' | 'retention' | 'general',
            title: s.title || 'AI Coaching Suggestion',
            context: s.title || context,
            suggestion: s.suggestion,
            confidence: s.confidence || 0.8,
            timestamp: Date.now(),
            priority: (s.priority || 'medium') as 'high' | 'medium' | 'low'
          }));
        }
      }

      // Fallback: Parse structured text response
      const lines = response.split('\n').filter(line => line.trim());
      const suggestions: CoachingSuggestion[] = [];
      
      // Look for Analysis/Trigger section
      const analysisMatch = response.match(/Analysis:\s*(.+?)(?=\n|Suggested Response:|$)/s);
      const suggestionMatch = response.match(/Suggested Response:\s*(.+)/s);
      
      if (analysisMatch && suggestionMatch) {
        const analysisText = analysisMatch[1].trim();
        const suggestionText = suggestionMatch[1].trim();
        
        // Try to determine type from content
        let type: 'objection' | 'product_pitch' | 'closing' | 'retention' | 'general' = 'general';
        let confidence = 0.8;
        
        if (suggestionText.toLowerCase().includes('retention') || analysisText.toLowerCase().includes('retention')) {
          type = 'retention';
          confidence = 0.92;
        } else if (suggestionText.toLowerCase().includes('objection') || analysisText.toLowerCase().includes('objection')) {
          type = 'objection';
          confidence = 0.85;
        } else if (suggestionText.toLowerCase().includes('closing') || analysisText.toLowerCase().includes('close')) {
          type = 'closing';
          confidence = 0.88;
        } else if (suggestionText.toLowerCase().includes('product') || suggestionText.toLowerCase().includes('pitch')) {
          type = 'product_pitch';
          confidence = 0.82;
        }
        
        suggestions.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type,
          title: 'AI Coaching Suggestion',
          context: analysisText,
          suggestion: suggestionText,
          confidence,
          timestamp: Date.now(),
          priority: 'medium'
        });
      } else {
        // Simple fallback
        suggestions.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: 'general',
          title: 'AI Coaching Suggestion',
          context: context,
          suggestion: response.trim(),
          confidence: 0.75,
          timestamp: Date.now(),
          priority: 'medium'
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error parsing coaching response:', error);
      return [{
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'general',
        title: 'AI Coaching Suggestion',
        context: context,
        suggestion: response.trim(),
        confidence: 0.6,
        timestamp: Date.now(),
        priority: 'medium'
      }];
    }
  };

  // Utility functions
  const dismissSuggestion = (suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.map(s => 
        s.id === suggestionId ? { ...s, isDismissed: true } : s
      )
    }));
  };

  const rateSuggestion = (suggestionId: string, rating: 'helpful' | 'not_helpful', reason?: string) => {
    setState(prev => {
      const suggestion = prev.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return prev;
      
      const updated = {
        ...prev,
        suggestions: prev.suggestions.map(s => 
          s.id === suggestionId ? { 
            ...s, 
            userFeedback: {
              rating,
              timestamp: Date.now(),
              reason
            }
          } : s
        )
      };
      
      // Store feedback with learning service
      try {
        const feedbackData: FeedbackData = {
          suggestionId,
          rating,
          suggestionType: suggestion.type,
          suggestionText: suggestion.suggestion,
          context: suggestion.context,
          timestamp: Date.now(),
          reason
        };
        
        feedbackLearning.storeFeedback(feedbackData);
        console.log('✅ Suggestion feedback saved and learning updated:', rating);
      } catch (error) {
        console.error('❌ Failed to save suggestion feedback:', error);
      }
      
      return updated;
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const saveTranscript = () => {
    const transcript = state.transcription.map(s => `${s.speaker}: ${s.text}`).join('\n');
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSessionData = () => {
    const sessionData = {
      transcription: state.transcription,
      suggestions: state.suggestions,
      sessionStartTime: state.sessionStartTime,
      sessionDuration: state.sessionDuration,
      callType: state.callType,
      totalExchanges: state.totalExchanges,
      conversationLength: state.conversationLength,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    ...state,
    isProcessing,
    startListening,
    stopListening,
    dismissSuggestion,
    rateSuggestion,
    clearError,
    saveTranscript,
    exportSessionData,
    // Additional required properties for components
    isTabAudioAvailable: true,
    requestTabAudio,
    requestMicrophoneAudio,
    isAvailable: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    sessionStatus: state.isListening ? 'active' : 'idle',
    toggleSpeaker: () => {},
    clearSession: () => setState(prev => ({ ...prev, transcription: [], suggestions: [] })),
    toggleDemoMode: () => setState(prev => ({ ...prev, isDemoMode: !prev.isDemoMode })),
    requestCoaching: async () => {
      if (state.transcription.length === 0) return;
      
      try {
        setIsProcessing(true);
        
        // Create comprehensive context for AI analysis
        const fullTranscript = state.transcription.map(t => `${t.speaker}: ${t.text}`).join('\n');
        const conversationSummary = state.transcription.length > 5 
          ? state.transcription.slice(-10) // Last 10 exchanges for context
          : state.transcription;
        
        const contextualPrompt = `Analyze this ${state.callType} conversation and provide coaching:

Full Conversation:
${fullTranscript}

Recent Context:
${conversationSummary.map(t => `${t.speaker}: ${t.text}`).join('\n')}

Provide your response in this format:
Summary & Analysis: [Your analysis]
Suggestion: [Specific coaching advice]`;
        
        // Generate coaching suggestion using hybrid AI with full context
        const suggestion = await hybridAI.generateCoachingSuggestion(
          contextualPrompt, 
          state.callType, 
          conversationSummary.map(t => `${t.speaker}: ${t.text}`)
        );
        
        if (suggestion) {
          setState(prev => ({
            ...prev,
            suggestions: [...prev.suggestions, suggestion],
            lastSuggestionTime: Date.now(),
            suggestionCount: prev.suggestionCount + 1
          }));
          
          console.log(`🎯 Manual coaching request processed via ${suggestion.source} AI`);
        }
      } catch (error) {
        console.error('Error in requestCoaching:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    exportTranscriptData: exportSessionData,
    retryOperation: () => {},
    
    // Performance metrics
    getPerformanceStats: getStats,
    logPerformanceReport,
    isUsingWhisper: isUsingWhisper.current,
    
    // Coaching mode
    coachingMode: state.coachingMode,
    setCoachingMode: (mode: 'live' | 'manual') => setState(prev => ({ ...prev, coachingMode: mode }))
  };
};
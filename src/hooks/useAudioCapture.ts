import { useState, useCallback, useRef } from 'react';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface AudioCaptureOptions {
  onAudioData?: (audioBlob: Blob) => void;
  onTranscript?: (text: string) => void;
  includeSystemAudio?: boolean;
}

export const useAudioCapture = (options: AudioCaptureOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSystemAudioEnabled, setIsSystemAudioEnabled] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(async () => {
    try {
      let stream: MediaStream;

      if (options.includeSystemAudio) {
        // Try to capture system audio via screen sharing with audio
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: false,
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          });
          
          // Also get microphone
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });

          // Combine streams
          const audioContext = new AudioContext();
          const destination = audioContext.createMediaStreamDestination();
          
          const displaySource = audioContext.createMediaStreamSource(displayStream);
          const micSource = audioContext.createMediaStreamSource(micStream);
          
          displaySource.connect(destination);
          micSource.connect(destination);
          
          stream = destination.stream;
          setIsSystemAudioEnabled(true);
        } catch (error) {
          console.warn('System audio capture failed, using microphone only:', error);
          // Fallback to microphone only
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });
          setIsSystemAudioEnabled(false);
        }
      } else {
        // Microphone only
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
      }

      streamRef.current = stream;

      // Set up MediaRecorder for audio data
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        options.onAudioData?.(audioBlob);
      };

      // Set up Speech Recognition for transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            options.onTranscript?.(finalTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
    setIsSystemAudioEnabled(false);
  }, [isRecording]);

  return {
    isRecording,
    isSystemAudioEnabled,
    startRecording,
    stopRecording,
  };
};

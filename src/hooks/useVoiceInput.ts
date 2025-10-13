import { useState, useRef, useCallback } from 'react';
import { VoiceInput } from '@/utils/voiceInput';
import { toast } from 'sonner';

interface UseVoiceInputOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  language?: string;
  continuous?: boolean;
}

export const useVoiceInput = (options: UseVoiceInputOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const voiceInputRef = useRef<VoiceInput | null>(null);

  // Initialize VoiceInput instance
  if (!voiceInputRef.current) {
    voiceInputRef.current = new VoiceInput();
  }

  const isSupported = voiceInputRef.current.isSupported();

  const startRecording = useCallback(() => {
    if (!voiceInputRef.current || !isSupported) {
      toast.error('Voice input is not supported in your browser');
      return false;
    }

    const started = voiceInputRef.current.start({
      language: options.language || 'en-US',
      continuous: options.continuous ?? false,
      onStart: () => {
        setIsRecording(true);
        setTranscript('');
      },
      onResult: (text, isFinal) => {
        setTranscript(text);
        options.onTranscript?.(text, isFinal);
      },
      onError: (error) => {
        setIsRecording(false);
        toast.error(error);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    if (!started) {
      toast.error('Failed to start voice recording');
    }

    return started;
  }, [isSupported, options]);

  const stopRecording = useCallback(() => {
    if (voiceInputRef.current) {
      voiceInputRef.current.stop();
    }
  }, []);

  const abortRecording = useCallback(() => {
    if (voiceInputRef.current) {
      voiceInputRef.current.abort();
      setIsRecording(false);
      setTranscript('');
    }
  }, []);

  return {
    isSupported,
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    abortRecording,
  };
};

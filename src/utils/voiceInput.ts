// Voice input utility using browser Speech Recognition API

interface VoiceInputOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  language?: string;
  continuous?: boolean;
}

export class VoiceInput {
  private recognition: any = null;
  private isRecording = false;

  constructor() {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(options: VoiceInputOptions): boolean {
    if (!this.recognition || this.isRecording) {
      return false;
    }

    // Configure recognition
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = true;
    this.recognition.lang = options.language || 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isRecording = true;
      options.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      options.onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      this.isRecording = false;
      const errorMessage = this.getErrorMessage(event.error);
      options.onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      options.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      options.onError?.('Failed to start voice recognition');
      return false;
    }
  }

  stop(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }

  abort(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.abort();
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'not-allowed':
      case 'permission-denied':
        return 'Microphone permission denied. Please allow microphone access.';
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'No microphone found. Please connect a microphone.';
      case 'network':
        return 'Network error occurred. Please check your connection.';
      default:
        return `Voice recognition error: ${error}`;
    }
  }
}

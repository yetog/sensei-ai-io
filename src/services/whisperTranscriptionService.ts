import { pipeline, Pipeline } from '@huggingface/transformers';

interface TranscriptionResult {
  text: string;
  confidence: number;
  timestamp: number;
  isPartial: boolean;
}

interface AudioChunk {
  audio: Float32Array;
  timestamp: number;
  duration: number;
}

class WhisperTranscriptionService {
  private pipeline: Pipeline | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private audioQueue: AudioChunk[] = [];
  private isProcessing = false;
  private listeners: ((result: TranscriptionResult) => void)[] = [];
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;

  async initialize(): Promise<void> {
    if (this.pipeline) return;
    if (this.isInitializing && this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = this.initializeInternal();
    await this.initPromise;
    this.isInitializing = false;
  }

  private async initializeInternal(): Promise<void> {
    try {
      console.log('Initializing Whisper pipeline...');
      // Use the smallest, fastest model for real-time performance
      const pipelineInstance = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny.en'
      );
      this.pipeline = pipelineInstance;
      console.log('Whisper pipeline initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Whisper pipeline:', error);
      throw error;
    }
  }

  async startTranscription(stream: MediaStream): Promise<void> {
    if (!this.pipeline) {
      await this.initialize();
    }

    this.stream = stream;
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    
    const source = this.audioContext.createMediaStreamSource(stream);
    
    // Create a processor for audio chunks
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const audioData = inputBuffer.getChannelData(0);
      
      // Convert to Float32Array and add to queue
      const chunk: AudioChunk = {
        audio: new Float32Array(audioData),
        timestamp: Date.now(),
        duration: audioData.length / this.audioContext!.sampleRate
      };
      
      this.audioQueue.push(chunk);
      this.processQueue();
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.audioQueue.length === 0 || !this.pipeline) return;

    this.isProcessing = true;

    try {
      // Process chunks in batches for better performance
      const chunksToProcess = this.audioQueue.splice(0, Math.min(3, this.audioQueue.length));
      
      if (chunksToProcess.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Combine audio chunks
      const totalLength = chunksToProcess.reduce((sum, chunk) => sum + chunk.audio.length, 0);
      const combinedAudio = new Float32Array(totalLength);
      
      let offset = 0;
      for (const chunk of chunksToProcess) {
        combinedAudio.set(chunk.audio, offset);
        offset += chunk.audio.length;
      }

      // Only process if we have enough audio (at least 0.5 seconds)
      if (combinedAudio.length < 8000) {
        this.isProcessing = false;
        return;
      }

      const startTime = performance.now();
      
      // Transcribe with Whisper
      const result = await this.pipeline(combinedAudio, {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5
      });

      const processingTime = performance.now() - startTime;
      console.log(`Whisper transcription took ${processingTime.toFixed(2)}ms`);

      if (result.text && result.text.trim()) {
        const transcriptionResult: TranscriptionResult = {
          text: result.text.trim(),
          confidence: 0.85, // Whisper doesn't provide confidence scores
          timestamp: Date.now(),
          isPartial: this.audioQueue.length > 0
        };

        // Notify all listeners
        this.listeners.forEach(listener => listener(transcriptionResult));
      }

    } catch (error) {
      console.error('Error processing audio with Whisper:', error);
    } finally {
      this.isProcessing = false;
      
      // Continue processing if there are more chunks
      if (this.audioQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  addListener(callback: (result: TranscriptionResult) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (result: TranscriptionResult) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  stopTranscription(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.stream = null;
    this.audioQueue = [];
    this.isProcessing = false;
  }

  getPerformanceMetrics() {
    return {
      queueLength: this.audioQueue.length,
      isProcessing: this.isProcessing,
      isInitialized: !!this.pipeline
    };
  }
}

export const whisperService = new WhisperTranscriptionService();
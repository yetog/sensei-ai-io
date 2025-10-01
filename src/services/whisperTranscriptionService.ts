import { pipeline, Pipeline } from '@huggingface/transformers';
import { detectEnvironment, getOptimalWhisperModel, checkNetworkConditions } from '@/utils/environmentDetection';

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
      console.log('🔄 Initializing Whisper pipeline for real-time transcription...');
      
      // Check network conditions before attempting download
      const env = detectEnvironment();
      console.log('Environment detected:', env);
      
      if (env.isPreview) {
        const networkOk = await checkNetworkConditions();
        if (!networkOk) {
          console.warn('Network conditions not optimal for model loading in preview');
          throw new Error('Network conditions not suitable for model download');
        }
      }
      
      const model = getOptimalWhisperModel();
      console.log(`Loading Whisper model: ${model}`);
      
      // Use environment-optimized model
      const pipelineInstance = await pipeline(
        'automatic-speech-recognition',
        model
      );
      this.pipeline = pipelineInstance;
      console.log('✅ Whisper pipeline initialized - ready for real-time transcription');
    } catch (error) {
      console.error('❌ Failed to initialize Whisper pipeline:', error);
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
      // PERFORMANCE FIX: Process smaller chunks more frequently for lower latency
      const chunksToProcess = this.audioQueue.splice(0, Math.min(2, this.audioQueue.length));
      
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

      // PERFORMANCE FIX: Lower minimum threshold for faster response (0.3s instead of 0.5s)
      if (combinedAudio.length < 4800) {
        this.isProcessing = false;
        return;
      }

      const startTime = performance.now();
      
      // PERFORMANCE FIX: Optimized Whisper settings for real-time
      const result = await this.pipeline(combinedAudio, {
        return_timestamps: false, // Disable timestamps for faster processing
        chunk_length_s: 10, // Shorter chunks for lower latency
        stride_length_s: 2, // Smaller stride for better continuity
        language: 'en', // Specify language to skip detection
      });

      const processingTime = performance.now() - startTime;
      
      // Only log slow processing times
      if (processingTime > 500) {
        console.warn(`⚠️ Slow Whisper transcription: ${processingTime.toFixed(2)}ms`);
      } else {
        console.log(`⚡ Fast Whisper transcription: ${processingTime.toFixed(2)}ms`);
      }

      if (result.text && result.text.trim()) {
        const transcriptionResult: TranscriptionResult = {
          text: result.text.trim(),
          confidence: 0.85,
          timestamp: Date.now(),
          isPartial: this.audioQueue.length > 0
        };

        // Notify all listeners
        this.listeners.forEach(listener => listener(transcriptionResult));
      }

    } catch (error) {
      console.error('❌ Whisper processing error:', error);
    } finally {
      this.isProcessing = false;
      
      // PERFORMANCE FIX: Reduce delay between processing for faster throughput
      if (this.audioQueue.length > 0) {
        setTimeout(() => this.processQueue(), 50);
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
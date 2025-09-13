import { useCallback, useState, useRef, useEffect } from 'react';

export interface GenesysConnection {
  isConnected: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastHeartbeat?: Date;
  audioStream?: MediaStream;
}

export interface CallData {
  conversationId: string;
  participantData: {
    purpose: string;
    userId: string;
    customerPhoneNumber?: string;
    direction: 'inbound' | 'outbound';
  };
  mediaStreams: {
    audio: boolean;
    screen: boolean;
  };
}

export class GenesysIntegrationService {
  private static instance: GenesysIntegrationService;
  private connection: GenesysConnection = {
    isConnected: false,
    status: 'disconnected'
  };
  
  private eventListeners: Map<string, Function[]> = new Map();
  private audioContext?: AudioContext;
  private audioAnalyser?: AnalyserNode;
  private isListening = false;

  static getInstance(): GenesysIntegrationService {
    if (!GenesysIntegrationService.instance) {
      GenesysIntegrationService.instance = new GenesysIntegrationService();
    }
    return GenesysIntegrationService.instance;
  }

  // Event system for real-time updates
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Initialize connection to Genesys Cloud
  async connect(options: {
    clientId: string;
    environment: string;
    redirectUri: string;
  }): Promise<boolean> {
    try {
      this.connection.status = 'connecting';
      this.emit('statusChange', this.connection);

      // Simulate Genesys Cloud API connection
      // In production, this would use the actual Genesys Cloud SDK
      await this.simulateGenesysConnection(options);
      
      this.connection.isConnected = true;
      this.connection.status = 'connected';
      this.connection.lastHeartbeat = new Date();
      
      this.emit('statusChange', this.connection);
      this.emit('connected', this.connection);
      
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.emit('statusChange', this.connection);
      this.emit('error', error);
      return false;
    }
  }

  private async simulateGenesysConnection(options: any): Promise<void> {
    // Simulate authentication and WebSocket connection
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Simulated Genesys connection established', options);
        resolve();
      }, 2000);
    });
  }

  // Start listening to call audio
  async startAudioCapture(): Promise<MediaStream | null> {
    try {
      if (!this.connection.isConnected) {
        throw new Error('Must be connected to Genesys before capturing audio');
      }

      // For now, use microphone as simulation
      // In production, this would tap into Genesys WebRTC streams
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      this.connection.audioStream = stream;
      this.setupAudioAnalysis(stream);
      this.isListening = true;
      
      this.emit('audioStarted', stream);
      
      return stream;
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      this.emit('audioError', error);
      return null;
    }
  }

  private setupAudioAnalysis(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.audioAnalyser = this.audioContext.createAnalyser();
    
    this.audioAnalyser.fftSize = 2048;
    source.connect(this.audioAnalyser);
    
    // Start audio level monitoring
    this.monitorAudioLevels();
  }

  private monitorAudioLevels() {
    if (!this.audioAnalyser || !this.isListening) return;
    
    const bufferLength = this.audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudio = () => {
      if (!this.isListening) return;
      
      this.audioAnalyser!.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      this.emit('audioLevel', average);
      
      // Continue monitoring
      requestAnimationFrame(checkAudio);
    };
    
    checkAudio();
  }

  stopAudioCapture() {
    if (this.connection.audioStream) {
      this.connection.audioStream.getTracks().forEach(track => track.stop());
      this.connection.audioStream = undefined;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }
    
    this.isListening = false;
    this.emit('audioStopped');
  }

  // Get current call context from Genesys
  async getCurrentCallData(): Promise<CallData | null> {
    if (!this.connection.isConnected) {
      return null;
    }

    // Simulate call data from Genesys API
    return {
      conversationId: 'conv_' + Date.now(),
      participantData: {
        purpose: 'Sales Call',
        userId: 'agent_' + Math.random().toString(36).substr(2, 9),
        customerPhoneNumber: '+1-555-0123',
        direction: 'outbound'
      },
      mediaStreams: {
        audio: true,
        screen: false
      }
    };
  }

  disconnect() {
    this.stopAudioCapture();
    this.connection.isConnected = false;
    this.connection.status = 'disconnected';
    this.connection.lastHeartbeat = undefined;
    
    this.emit('statusChange', this.connection);
    this.emit('disconnected');
  }

  getConnectionStatus(): GenesysConnection {
    return { ...this.connection };
  }
}

// React hook for Genesys integration
export const useGenesysIntegration = () => {
  const [connection, setConnection] = useState<GenesysConnection>({
    isConnected: false,
    status: 'disconnected'
  });
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const serviceRef = useRef(GenesysIntegrationService.getInstance());

  useEffect(() => {
    const service = serviceRef.current;
    
    const handleStatusChange = (newConnection: GenesysConnection) => {
      setConnection(newConnection);
    };
    
    const handleAudioLevel = (level: number) => {
      setAudioLevel(level);
    };

    service.on('statusChange', handleStatusChange);
    service.on('audioLevel', handleAudioLevel);
    
    return () => {
      service.off('statusChange', handleStatusChange);
      service.off('audioLevel', handleAudioLevel);
    };
  }, []);

  const connectToGenesys = useCallback(async (config: {
    clientId: string;
    environment: string;
    redirectUri: string;
  }) => {
    return await serviceRef.current.connect(config);
  }, []);

  const startCall = useCallback(async () => {
    const stream = await serviceRef.current.startAudioCapture();
    if (stream) {
      const callData = await serviceRef.current.getCurrentCallData();
      setCurrentCall(callData);
    }
    return stream;
  }, []);

  const endCall = useCallback(() => {
    serviceRef.current.stopAudioCapture();
    setCurrentCall(null);
    setAudioLevel(0);
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current.disconnect();
    setCurrentCall(null);
    setAudioLevel(0);
  }, []);

  return {
    connection,
    currentCall,
    audioLevel,
    connectToGenesys,
    startCall,
    endCall,
    disconnect,
    isListening: connection.audioStream !== undefined
  };
};

export const genesysService = GenesysIntegrationService.getInstance();
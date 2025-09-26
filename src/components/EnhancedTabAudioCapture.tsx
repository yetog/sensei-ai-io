import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Monitor, 
  Volume2, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Play,
  Square,
  Mic,
  MicOff,
  RefreshCw
} from 'lucide-react';

interface EnhancedTabAudioCaptureProps {
  onStreamObtained: (stream: MediaStream) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

export function EnhancedTabAudioCapture({ onStreamObtained, onError, isActive }: EnhancedTabAudioCaptureProps) {
  const [step, setStep] = useState<'idle' | 'requesting' | 'sharing' | 'connected' | 'error'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const requestTabAudio = async () => {
    try {
      setStep('requesting');
      setErrorMessage('');
      
      const constraints = {
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 2,
          autoGainControl: false,
          // Request high quality audio for better transcription
          advanced: [{
            googEchoCancellation: false,
            googAutoGainControl: false,
            googNoiseSuppression: false,
            googHighpassFilter: false
          }]
        }
      };

      console.log('🎵 Requesting tab audio with enhanced settings...');
      const mediaStream = await (navigator.mediaDevices as any).getDisplayMedia(constraints);
      
      if (!mediaStream.getAudioTracks().length) {
        throw new Error('No audio track in the selected content. Make sure to check "Share audio" when selecting the tab.');
      }

      setStep('connected');
      setStream(mediaStream);
      onStreamObtained(mediaStream);
      
      // Set up audio level monitoring
      setupAudioMonitoring(mediaStream);
      
      // Handle stream end
      mediaStream.getAudioTracks()[0].onended = () => {
        setStep('idle');
        setStream(null);
        setAudioLevel(0);
      };

      console.log('✅ Tab audio capture successful');
      
    } catch (error: any) {
      console.error('❌ Tab audio capture failed:', error);
      setStep('error');
      
      let userFriendlyMessage = 'Failed to capture tab audio. ';
      
      if (error.name === 'NotAllowedError') {
        userFriendlyMessage += 'Permission denied. Please allow screen sharing and try again.';
      } else if (error.name === 'NotSupportedError') {
        userFriendlyMessage += 'Screen sharing not supported in this browser. Please use Chrome or Edge.';
      } else if (error.message.includes('Share audio')) {
        userFriendlyMessage += 'No audio track detected. Make sure to check "Share audio" when selecting the Google Meet tab.';
      } else {
        userFriendlyMessage += error.message || 'Unknown error occurred.';
      }
      
      setErrorMessage(userFriendlyMessage);
      onError(userFriendlyMessage);
      setRetryCount(prev => prev + 1);
    }
  };

  const setupAudioMonitoring = (mediaStream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (stream) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(Math.round(average));
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.warn('Audio monitoring setup failed:', error);
    }
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setStep('idle');
      setAudioLevel(0);
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'requesting': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStepText = () => {
    switch (step) {
      case 'requesting': return 'Requesting screen share...';
      case 'connected': return 'Connected to tab audio';
      case 'error': return 'Connection failed';
      default: return 'Ready to capture audio';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStepIcon()}
            Tab Audio Capture
          </div>
          <Badge variant={step === 'connected' ? 'default' : 'outline'}>
            {getStepText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Enhanced Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>For Google Meet audio capture:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Click "Start Tab Audio" below</li>
              <li>Select the <strong>Google Meet tab</strong> (not entire screen)</li>
              <li>✅ <strong>Check "Share tab audio"</strong> - this is critical!</li>
              <li>Click "Share" to start capturing</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Audio Level Indicator */}
        {step === 'connected' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Audio Level:</span>
              <Badge variant={audioLevel > 10 ? 'default' : 'outline'}>
                {audioLevel > 10 ? 'Detecting Audio' : 'Silent'}
              </Badge>
            </div>
            <Progress value={Math.min(audioLevel * 2, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {audioLevel > 10 ? '✅ Audio is being captured' : '⚠️ No audio detected - check Google Meet volume'}
            </p>
          </div>
        )}

        {/* Error Display */}
        {step === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {errorMessage}
              {retryCount > 2 && (
                <div className="mt-2 text-xs">
                  <strong>Still having issues?</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Try refreshing the Google Meet tab</li>
                    <li>Ensure Google Meet audio is unmuted</li>
                    <li>Use Chrome for best compatibility</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {step !== 'connected' ? (
            <Button 
              onClick={requestTabAudio} 
              disabled={step === 'requesting'}
              className="flex-1"
            >
              <Monitor className="h-4 w-4 mr-2" />
              {step === 'requesting' ? 'Requesting...' : 'Start Tab Audio'}
            </Button>
          ) : (
            <Button 
              onClick={stopCapture} 
              variant="destructive" 
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Capture
            </Button>
          )}
          
          {step === 'error' && (
            <Button 
              onClick={requestTabAudio} 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>

        {/* Success Tips */}
        {step === 'connected' && audioLevel > 10 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              ✅ Perfect! Audio is being captured. You can now start live coaching while on your Google Meet call.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
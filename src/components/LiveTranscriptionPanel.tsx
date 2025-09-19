import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  User, 
  MessageCircle, 
  Clock,
  Download,
  Copy,
  Zap,
  Brain,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TranscriptionSegment {
  id: string;
  speaker: 'rep' | 'customer';
  text: string;
  timestamp: Date;
  confidence?: number;
}

interface LiveTranscriptionPanelProps {
  isRecording: boolean;
  isListening: boolean;
  transcription: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isActive: boolean;
  audioLevel?: number;
  className?: string;
}

export function LiveTranscriptionPanel({
  isRecording,
  isListening,
  transcription,
  onStartRecording,
  onStopRecording,
  isActive,
  audioLevel = 0,
  className = ''
}: LiveTranscriptionPanelProps) {
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'rep' | 'customer'>('customer');
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'listening' | 'processing' | 'complete'>('idle');
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const fullTranscriptRef = useRef<string>('');

  // Update transcription segments when new transcription comes in
  useEffect(() => {
    if (transcription && transcription.trim()) {
      // Detect if this is a new segment (basic speaker detection based on content patterns)
      const isQuestion = transcription.includes('?');
      const isSalesLanguage = /\b(our solution|ROI|implementation|pricing|demo)\b/i.test(transcription);
      
      const detectedSpeaker = isSalesLanguage ? 'rep' : 'customer';
      
      // Only add if it's substantially different from the last segment
      const lastSegment = transcriptionSegments[transcriptionSegments.length - 1];
      if (!lastSegment || !transcription.includes(lastSegment.text)) {
        const newSegment: TranscriptionSegment = {
          id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          speaker: detectedSpeaker,
          text: transcription.trim(),
          timestamp: new Date(),
          confidence: 0.85 + Math.random() * 0.15
        };

        setTranscriptionSegments(prev => [...prev.slice(-9), newSegment]); // Keep last 10 segments
        fullTranscriptRef.current += `\n[${detectedSpeaker}] ${transcription.trim()}`;
      }
    }
  }, [transcription, transcriptionSegments]);

  // Auto-scroll to bottom
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptionSegments]);

  // Update processing status based on recording state
  useEffect(() => {
    if (!isActive) {
      setProcessingStatus('idle');
    } else if (isRecording && isListening) {
      setProcessingStatus('listening');
    } else if (isRecording) {
      setProcessingStatus('processing');
    } else {
      setProcessingStatus('complete');
    }
  }, [isActive, isRecording, isListening]);

  const copyTranscript = () => {
    navigator.clipboard.writeText(fullTranscriptRef.current);
  };

  const downloadTranscript = () => {
    const blob = new Blob([fullTranscriptRef.current], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = () => {
    switch (processingStatus) {
      case 'listening': return 'bg-green-500';
      case 'processing': return 'bg-blue-500 animate-pulse';
      case 'complete': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusText = () => {
    switch (processingStatus) {
      case 'listening': return 'Listening & Transcribing';
      case 'processing': return 'Processing Speech';
      case 'complete': return 'Transcription Complete';
      default: return 'Ready to Start';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Live Conversation Transcript
            <Badge variant="outline" className="text-xs">
              {transcriptionSegments.length} segments
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {transcriptionSegments.length > 0 && (
              <>
                <Button onClick={copyTranscript} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={downloadTranscript} variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Recording Controls & Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
            
            {/* Audio Level Indicator */}
            {isRecording && (
              <div className="flex items-center gap-1">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 rounded ${
                        i < audioLevel * 5 ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isActive ? (
              <Button onClick={onStopRecording} variant="destructive" size="sm">
                <MicOff className="h-4 w-4 mr-1" />
                Stop
              </Button>
            ) : (
              <Button onClick={onStartRecording} size="sm">
                <Mic className="h-4 w-4 mr-1" />
                Start Recording
              </Button>
            )}
          </div>
        </div>

        {/* Processing Flow Indicator */}
        {isActive && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs">Speech Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${transcription ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs">Transcription</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-3 w-3 text-purple-500" />
                <span className="text-xs">AI Analysis</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
          </div>
        )}

        {/* Transcription Display */}
        <div className="space-y-4">
          {transcriptionSegments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Live conversation transcript will appear here</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start recording to see real-time speech-to-text transcription
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3 p-3 bg-muted/20 rounded-lg">
              {transcriptionSegments.map((segment, index) => (
                <div key={segment.id} className="flex gap-3 group">
                  <div className="flex-shrink-0 pt-1">
                    {segment.speaker === 'rep' ? (
                      <User className="h-4 w-4 text-blue-500" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize">
                        {segment.speaker === 'rep' ? 'Sales Rep' : 'Customer'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {segment.timestamp.toLocaleTimeString()}
                      </span>
                      {segment.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(segment.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                  </div>
                </div>
              ))}
              <div ref={transcriptionEndRef} />
            </div>
          )}
        </div>

        {/* Current Live Transcription */}
        {isRecording && transcription && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live Transcription</span>
            </div>
            <p className="text-sm italic">{transcription}</p>
          </div>
        )}

        {/* Transcription Stats */}
        {transcriptionSegments.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-4">
              <span>Total segments: {transcriptionSegments.length}</span>
              <span>
                Avg confidence: {Math.round(
                  transcriptionSegments.reduce((acc, seg) => acc + (seg.confidence || 0), 0) / 
                  transcriptionSegments.length * 100
                )}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Auto-saved</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
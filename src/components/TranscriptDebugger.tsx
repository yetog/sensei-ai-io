import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bug, 
  MessageSquare, 
  Clock, 
  Layers, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface TranscriptEvent {
  id: string;
  timestamp: number;
  type: 'duplicate_detected' | 'segment_created' | 'merged' | 'processed' | 'error';
  message: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

interface TranscriptDebuggerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TranscriptDebugger: React.FC<TranscriptDebuggerProps> = ({
  isVisible,
  onClose
}) => {
  const [events, setEvents] = useState<TranscriptEvent[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Intercept console logs for transcript debugging
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    const captureLog = (type: 'info' | 'warning' | 'error', args: any[]) => {
      const message = args.join(' ');
      
      // Only capture transcript-related logs
      if (message.toLowerCase().includes('transcript') || 
          message.toLowerCase().includes('duplicate') ||
          message.toLowerCase().includes('speech recognition') ||
          message.toLowerCase().includes('whisper')) {
        
        const event: TranscriptEvent = {
          id: Date.now().toString() + Math.random(),
          timestamp: Date.now(),
          type: message.includes('duplicate') ? 'duplicate_detected' : 
                message.includes('error') ? 'error' : 'processed',
          message,
          severity: type,
          metadata: {
            source: 'console',
            originalArgs: args
          }
        };

        setEvents(prev => [...prev.slice(-49), event]); // Keep last 50 events
      }
    };

    console.log = (...args) => {
      originalConsoleLog(...args);
      if (isCapturing) captureLog('info', args);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      if (isCapturing) captureLog('warning', args);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      if (isCapturing) captureLog('error', args);
    };

    setIsCapturing(true);

    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      setIsCapturing(false);
    };
  }, [isVisible, isCapturing]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'duplicate_detected': return <Layers className="h-4 w-4" />;
      case 'segment_created': return <MessageSquare className="h-4 w-4" />;
      case 'merged': return <CheckCircle className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };

  const clearEvents = () => {
    setEvents([]);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Transcript Debug Console
              <Badge variant={isCapturing ? "default" : "secondary"}>
                {isCapturing ? 'Capturing' : 'Stopped'}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={clearEvents} variant="outline" size="sm">
                Clear Log
              </Button>
              <Button 
                onClick={() => setIsCapturing(!isCapturing)} 
                variant={isCapturing ? "destructive" : "default"} 
                size="sm"
              >
                {isCapturing ? 'Stop' : 'Start'} Capture
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div>Total Events: {events.length}</div>
            <div>Errors: {events.filter(e => e.severity === 'error').length}</div>
            <div>Warnings: {events.filter(e => e.severity === 'warning').length}</div>
            <div>Duplicates: {events.filter(e => e.type === 'duplicate_detected').length}</div>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No debug events captured yet</p>
                  <p className="text-sm">Start a coaching session to see transcript debugging info</p>
                </div>
              ) : (
                events.map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-3 border rounded-lg ${getSeverityColor(event.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getSeverityIcon(event.severity)}
                        {getTypeIcon(event.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {event.type.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.timestamp)}
                          </div>
                        </div>
                        
                        <div className="text-sm font-mono bg-white/50 p-2 rounded border">
                          {event.message}
                        </div>
                        
                        {event.metadata && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Show metadata
                            </summary>
                            <pre className="text-xs bg-white/50 p-2 rounded border mt-1 overflow-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';

interface DuplicateDetectionEvent {
  id: string;
  timestamp: number;
  type: 'exact' | 'repetitive' | 'substring' | 'processed_id' | 'allowed';
  content: string;
  source: 'whisper' | 'browser';
  reason?: string;
}

interface DuplicateDetectionMonitorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DuplicateDetectionMonitor: React.FC<DuplicateDetectionMonitorProps> = ({
  isVisible,
  onClose
}) => {
  const [events, setEvents] = useState<DuplicateDetectionEvent[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stats, setStats] = useState({
    totalProcessed: 0,
    duplicatesBlocked: 0,
    allowedThrough: 0,
    effectivenessRate: 0
  });

  useEffect(() => {
    if (isVisible && !isCapturing) {
      startCapturing();
    } else if (!isVisible && isCapturing) {
      stopCapturing();
    }

    return () => {
      if (isCapturing) {
        stopCapturing();
      }
    };
  }, [isVisible, isCapturing]);

  const startCapturing = () => {
    setIsCapturing(true);
    setEvents([]);
    
    // Intercept console logs for duplicate detection
    const originalLog = console.log;
    const originalWarn = console.warn;
    
    const captureLog = (level: 'log' | 'warn', ...args: any[]) => {
      const message = args.join(' ');
      
      // Capture duplicate detection events
      if (message.includes('🚫') && (message.includes('duplicate') || message.includes('repetitive'))) {
        const event: DuplicateDetectionEvent = {
          id: `${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          type: getDuplicateType(message),
          content: extractContent(message),
          source: message.includes('Whisper') ? 'whisper' : 'browser',
          reason: message
        };
        
        setEvents(prev => [...prev.slice(-50), event]); // Keep last 50 events
        updateStats('blocked');
      } else if (message.includes('transcription') && !message.includes('🚫')) {
        // Capture allowed transcriptions
        const event: DuplicateDetectionEvent = {
          id: `${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          type: 'allowed',
          content: extractContent(message),
          source: message.includes('Whisper') ? 'whisper' : 'browser',
          reason: 'Transcription allowed through'
        };
        
        setEvents(prev => [...prev.slice(-50), event]);
        updateStats('allowed');
      }
      
      // Call original console method
      if (level === 'log') originalLog(...args);
      else originalWarn(...args);
    };
    
    console.log = (...args) => captureLog('log', ...args);
    console.warn = (...args) => captureLog('warn', ...args);
    
    // Store original methods for cleanup
    (window as any).__originalConsole = { log: originalLog, warn: originalWarn };
    
    console.log('🔍 Duplicate detection monitoring started');
  };

  const stopCapturing = () => {
    setIsCapturing(false);
    
    // Restore original console methods
    const original = (window as any).__originalConsole;
    if (original) {
      console.log = original.log;
      console.warn = original.warn;
      delete (window as any).__originalConsole;
    }
    
    console.log('🔍 Duplicate detection monitoring stopped');
  };

  const getDuplicateType = (message: string): DuplicateDetectionEvent['type'] => {
    if (message.includes('exact duplicate')) return 'exact';
    if (message.includes('repetitive pattern')) return 'repetitive';
    if (message.includes('substring duplicate')) return 'substring';
    if (message.includes('duplicate detected')) return 'processed_id';
    return 'exact';
  };

  const extractContent = (message: string): string => {
    const match = message.match(/:\s*(.+?)\.\.\./) || message.match(/:\s*(.+)/);
    return match ? match[1].substring(0, 100) : 'Content not captured';
  };

  const updateStats = (type: 'blocked' | 'allowed') => {
    setStats(prev => {
      const newStats = {
        ...prev,
        totalProcessed: prev.totalProcessed + 1,
        duplicatesBlocked: type === 'blocked' ? prev.duplicatesBlocked + 1 : prev.duplicatesBlocked,
        allowedThrough: type === 'allowed' ? prev.allowedThrough + 1 : prev.allowedThrough,
      };
      
      newStats.effectivenessRate = newStats.totalProcessed > 0 
        ? (newStats.duplicatesBlocked / newStats.totalProcessed) * 100 
        : 0;
      
      return newStats;
    });
  };

  const clearEvents = () => {
    setEvents([]);
    setStats({
      totalProcessed: 0,
      duplicatesBlocked: 0,
      allowedThrough: 0,
      effectivenessRate: 0
    });
  };

  const getEventIcon = (type: DuplicateDetectionEvent['type']) => {
    switch (type) {
      case 'exact': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'repetitive': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'substring': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'processed_id': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'allowed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventColor = (type: DuplicateDetectionEvent['type']) => {
    switch (type) {
      case 'exact': return 'bg-red-100 text-red-800';
      case 'repetitive': return 'bg-orange-100 text-orange-800';
      case 'substring': return 'bg-yellow-100 text-yellow-800';
      case 'processed_id': return 'bg-blue-100 text-blue-800';
      case 'allowed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Duplicate Detection Monitor</h2>
            <Badge variant={isCapturing ? "default" : "secondary"}>
              {isCapturing ? "Capturing" : "Stopped"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearEvents}>
              Clear Log
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => isCapturing ? stopCapturing() : startCapturing()}
            >
              {isCapturing ? "Stop" : "Start"} Capture
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProcessed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duplicates Blocked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.duplicatesBlocked}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Allowed Through</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.allowedThrough}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.effectivenessRate.toFixed(1)}%</div>
              <Progress value={stats.effectivenessRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Detection Status */}
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            {isCapturing ? (
              `Monitoring active. Effectiveness: ${stats.effectivenessRate.toFixed(1)}%. ${
                stats.effectivenessRate > 50 
                  ? '✅ Good duplicate detection rate.' 
                  : stats.effectivenessRate > 20 
                    ? '⚠️ Moderate duplicate detection.' 
                    : '❌ Low duplicate detection - check for issues.'
              }`
            ) : (
              'Monitoring stopped. Click "Start Capture" to begin monitoring duplicate detection.'
            )}
          </AlertDescription>
        </Alert>

        {/* Events Log */}
        <Card>
          <CardHeader>
            <CardTitle>Detection Events Log</CardTitle>
            <CardDescription>
              Real-time log of duplicate detection events and allowed transcriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {isCapturing ? 'Waiting for transcription events...' : 'No events captured. Start capturing to see activity.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {events.slice().reverse().map((event) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.type)}
                          <Badge className={getEventColor(event.type)}>
                            {event.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{event.source}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Content:</strong> {event.content}
                      </p>
                      
                      {event.reason && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Reason:</strong> {event.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
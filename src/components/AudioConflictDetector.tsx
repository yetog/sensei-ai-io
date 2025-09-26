import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Mic, 
  Monitor, 
  PhoneCall,
  RefreshCw,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface AudioConflictDetectorProps {
  onTabAudioRequested: () => void;
  onDemoModeRequested: () => void;
  isListening: boolean;
  audioSource: 'microphone' | 'tab' | 'both';
  micLevel: number;
  tabLevel: number;
  error?: { type: string; message: string; } | null;
}

interface ConflictState {
  hasMicrophoneConflict: boolean;
  hasTabAudioIssue: boolean;
  inGoogleMeet: boolean;
  suggestedSolution: 'tab_audio' | 'demo_mode' | 'split_audio' | null;
}

export function AudioConflictDetector({ 
  onTabAudioRequested, 
  onDemoModeRequested, 
  isListening, 
  audioSource, 
  micLevel, 
  tabLevel, 
  error 
}: AudioConflictDetectorProps) {
  const [conflictState, setConflictState] = useState<ConflictState>({
    hasMicrophoneConflict: false,
    hasTabAudioIssue: false,
    inGoogleMeet: false,
    suggestedSolution: null
  });

  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    detectConflicts();
  }, [isListening, audioSource, micLevel, tabLevel, error]);

  const detectConflicts = async () => {
    if (!isListening) {
      setConflictState({
        hasMicrophoneConflict: false,
        hasTabAudioIssue: false,
        inGoogleMeet: false,
        suggestedSolution: null
      });
      return;
    }

    setIsDetecting(true);

    // Check for microphone conflicts
    const hasMicConflict = audioSource !== 'tab' && micLevel === 0 && isListening;
    
    // Check for tab audio issues
    const hasTabIssue = audioSource !== 'microphone' && tabLevel === 0 && isListening;
    
    // Check if we're likely in Google Meet (heuristic)
    const inMeet = checkForGoogleMeet();
    
    // Determine suggested solution
    let suggestion: ConflictState['suggestedSolution'] = null;
    
    if (hasMicConflict && inMeet) {
      suggestion = 'tab_audio'; // Primary recommendation for Google Meet
    } else if (hasMicConflict || hasTabIssue) {
      suggestion = 'demo_mode'; // Fallback for any audio issues
    }

    setConflictState({
      hasMicrophoneConflict: hasMicConflict,
      hasTabAudioIssue: hasTabIssue,
      inGoogleMeet: inMeet,
      suggestedSolution: suggestion
    });

    setIsDetecting(false);
  };

  const checkForGoogleMeet = (): boolean => {
    // Check if current page is Google Meet
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('meet.google.com')) {
        return true;
      }
      
      // Check if any open tabs might be Google Meet (via page title or other heuristics)
      const title = document.title.toLowerCase();
      if (title.includes('meet') || title.includes('google meet')) {
        return true;
      }
    }
    
    return false;
  };

  const getConflictSeverity = (): 'none' | 'warning' | 'error' => {
    if (conflictState.hasMicrophoneConflict && conflictState.inGoogleMeet) {
      return 'error';
    }
    if (conflictState.hasMicrophoneConflict || conflictState.hasTabAudioIssue) {
      return 'warning';
    }
    return 'none';
  };

  const getStatusIcon = () => {
    const severity = getConflictSeverity();
    switch (severity) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    if (isDetecting) return 'Detecting audio conflicts...';
    
    const severity = getConflictSeverity();
    switch (severity) {
      case 'error': return 'Audio conflict detected';
      case 'warning': return 'Audio issue detected';
      default: return 'Audio working correctly';
    }
  };

  if (!isListening) {
    return null; // Don't show when not listening
  }

  const severity = getConflictSeverity();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Audio Status Monitor
          </div>
          <Badge variant={severity === 'none' ? 'default' : 'destructive'}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Status */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 border rounded">
            <Mic className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium">Microphone</div>
            <Badge variant={micLevel > 5 ? 'default' : 'outline'} className="text-xs">
              {micLevel > 5 ? 'Active' : 'Silent'}
            </Badge>
          </div>
          <div className="text-center p-2 border rounded">
            <Monitor className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium">Tab Audio</div>
            <Badge variant={tabLevel > 5 ? 'default' : 'outline'} className="text-xs">
              {tabLevel > 5 ? 'Active' : 'Silent'}
            </Badge>
          </div>
          <div className="text-center p-2 border rounded">
            <PhoneCall className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium">Google Meet</div>
            <Badge variant={conflictState.inGoogleMeet ? 'default' : 'outline'} className="text-xs">
              {conflictState.inGoogleMeet ? 'Detected' : 'Not Found'}
            </Badge>
          </div>
        </div>

        {/* Conflict Alerts and Solutions */}
        {conflictState.hasMicrophoneConflict && conflictState.inGoogleMeet && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <strong>Microphone Conflict Detected</strong>
                  <p className="text-sm mt-1">
                    Google Meet is using your microphone, preventing live coaching from hearing your voice. 
                    This is normal during video calls.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recommended Solutions:</p>
                  
                  <Button 
                    onClick={onTabAudioRequested}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Use Tab Audio Capture (Recommended)
                  </Button>
                  
                  <Button 
                    onClick={onDemoModeRequested}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Switch to Demo Mode
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {conflictState.hasTabAudioIssue && audioSource !== 'microphone' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  <strong>Tab Audio Not Working</strong>
                  <p className="text-sm mt-1">
                    No audio is being captured from the selected tab. Make sure:
                  </p>
                </div>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>You checked "Share tab audio" when screen sharing</li>
                  <li>The Google Meet tab has audio playing</li>
                  <li>Google Meet is not muted</li>
                </ul>
                <Button 
                  onClick={onTabAudioRequested}
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Tab Audio Setup
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {severity === 'none' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Audio is working correctly! Live coaching can hear audio and provide real-time suggestions.
            </AlertDescription>
          </Alert>
        )}

        {/* Help Links */}
        <div className="pt-2 border-t">
          <details className="text-xs">
            <summary className="cursor-pointer font-medium">Need Help?</summary>
            <div className="mt-2 space-y-2">
              <a 
                href="https://support.google.com/meet/answer/9308037" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Google Meet Audio Troubleshooting
              </a>
              <p className="text-muted-foreground">
                If issues persist, try refreshing both the Google Meet tab and this coaching app.
              </p>
            </div>
          </details>
        </div>

      </CardContent>
    </Card>
  );
}
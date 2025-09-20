import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Mic, 
  PhoneCall, 
  Settings, 
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface GoogleMeetInstructionsProps {
  audioSource: 'microphone' | 'tab' | 'both';
  isListening: boolean;
  tabLevel: number;
  micLevel: number;
  isTabAudioAvailable: boolean;
}

export function GoogleMeetInstructions({ 
  audioSource, 
  isListening, 
  tabLevel, 
  micLevel, 
  isTabAudioAvailable 
}: GoogleMeetInstructionsProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <PhoneCall className="h-4 w-4" />
          Google Meet Testing Setup
          {isListening && (
            <Badge variant={isTabAudioAvailable ? "default" : "destructive"} className="text-xs">
              {isTabAudioAvailable ? "Connected" : "No Tab Audio"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Configuration */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 border rounded">
            <Monitor className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium">Audio Source</div>
            <div className="text-muted-foreground">{audioSource}</div>
          </div>
          <div className="text-center p-2 border rounded">
            <Mic className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium">Mic Level</div>
            <div className="text-muted-foreground">{Math.round(micLevel)}</div>
          </div>
          <div className="text-center p-2 border rounded">
            <PhoneCall className="h-4 w-4 mx-auto mb-1" />
            <div className="font-medium">Tab Level</div>
            <div className="text-muted-foreground">{Math.round(tabLevel)}</div>
          </div>
        </div>

        {/* Setup Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>For Google Meet Testing:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Open Google Meet in a separate browser tab</li>
              <li>Select "Tab Audio" or "Microphone + Tab" for audio source</li>
              <li>Click "Start Coaching" and choose "Share audio" when prompted</li>
              <li>Select the Google Meet tab to capture both voices</li>
              <li>Test by speaking - you should see audio levels change</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Audio Status Indicators */}
        {isListening && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Audio Detection Status:</span>
              <div className="flex gap-2">
                {audioSource !== 'tab' && (
                  <Badge variant={micLevel > 5 ? "default" : "outline"} className="flex items-center gap-1">
                    <Mic className="h-3 w-3" />
                    Your Voice {micLevel > 5 ? <CheckCircle className="h-3 w-3" /> : ''}
                  </Badge>
                )}
                {audioSource !== 'microphone' && (
                  <Badge variant={tabLevel > 5 ? "default" : "outline"} className="flex items-center gap-1">
                    <PhoneCall className="h-3 w-3" />
                    Customer Voice {tabLevel > 5 ? <CheckCircle className="h-3 w-3" /> : ''}
                  </Badge>
                )}
              </div>
            </div>

            {!isTabAudioAvailable && audioSource !== 'microphone' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Tab audio not detected. Make sure to select "Share audio" when choosing the Google Meet tab.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Troubleshooting Tips */}
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">Troubleshooting Tips</summary>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>• If no tab audio: Refresh and re-share the Google Meet tab with audio enabled</p>
            <p>• If only hearing your voice: Check that Google Meet audio is unmuted</p>
            <p>• If levels are too low: Adjust Google Meet volume settings</p>
            <p>• For best results: Use Chrome browser with latest version</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
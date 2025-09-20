import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, PhoneCall, Activity, AlertCircle } from 'lucide-react';
import { useRealTimeCoaching } from '@/hooks/useRealTimeCoaching';

export function AudioTestComponent() {
  const {
    isListening,
    audioSource,
    micLevel,
    tabLevel,
    isTabAudioAvailable,
    startListening,
    stopListening,
    requestTabAudio,
    requestMicrophoneAudio,
    isAvailable
  } = useRealTimeCoaching();

  const [testAudioSource, setTestAudioSource] = useState<'microphone' | 'tab' | 'both'>('microphone');

  if (!isAvailable) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Audio Test Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Speech recognition is not supported in this browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleTestAudio = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening('general', testAudioSource);
    }
  };

  const testTabAudio = async () => {
    await requestTabAudio();
  };

  const testMicAudio = async () => {
    await requestMicrophoneAudio();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Enhanced Audio Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Source Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Audio Source:</label>
          <select 
            value={testAudioSource}
            onChange={(e) => setTestAudioSource(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={isListening}
          >
            <option value="microphone">Microphone Only</option>
            <option value="tab">Tab Audio Only</option>
            <option value="both">Microphone + Tab</option>
          </select>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleTestAudio}
            variant={isListening ? "destructive" : "default"}
            className="flex-1"
          >
            {isListening ? "Stop Test" : "Start Test"}
          </Button>
          
          <Button onClick={testTabAudio} variant="outline" size="sm">
            Test Tab
          </Button>
          
          <Button onClick={testMicAudio} variant="outline" size="sm">
            Test Mic
          </Button>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge variant={isListening ? "default" : "secondary"}>
              {isListening ? "Listening" : "Stopped"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Audio Source:</span>
            <Badge variant="outline">{audioSource}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Tab Audio Available:</span>
            <Badge variant={isTabAudioAvailable ? "default" : "secondary"}>
              {isTabAudioAvailable ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        {/* Audio Level Meters */}
        {isListening && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Audio Levels:</h4>
            
            {(audioSource === 'microphone' || audioSource === 'both') && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Microphone: {Math.round(micLevel)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded">
                  <div 
                    className="h-full bg-blue-500 rounded transition-all duration-100"
                    style={{ width: `${Math.min(micLevel * 2, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {(audioSource === 'tab' || audioSource === 'both') && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Tab Audio: {Math.round(tabLevel)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded">
                  <div 
                    className="h-full bg-green-500 rounded transition-all duration-100"
                    style={{ width: `${Math.min(tabLevel * 2, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Microphone:</strong> Captures your voice</p>
          <p><strong>Tab Audio:</strong> Captures audio from browser tab (for Google Meet, etc.)</p>
          <p><strong>Both:</strong> Smart detection based on audio levels</p>
        </div>
      </CardContent>
    </Card>
  );
}
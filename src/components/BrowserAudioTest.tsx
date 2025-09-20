import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Mic, 
  Chrome, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Square,
  Volume2,
  Info
} from 'lucide-react';

interface BrowserAudioTestProps {
  onTestComplete?: (success: boolean) => void;
}

export function BrowserAudioTest({ onTestComplete }: BrowserAudioTestProps) {
  const [browserType, setBrowserType] = useState<'chrome' | 'safari' | 'firefox' | 'other'>('other');
  const [micTestResult, setMicTestResult] = useState<'pending' | 'success' | 'failed'>('pending');
  const [systemTestResult, setSystemTestResult] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [isTestingSystem, setIsTestingSystem] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) setBrowserType('chrome');
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) setBrowserType('safari');
    else if (userAgent.includes('Firefox')) setBrowserType('firefox');
    else setBrowserType('other');
  }, []);

  const testMicrophone = async () => {
    setIsTestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicTestResult('success');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setMicTestResult('failed');
    }
    setIsTestingMic(false);
  };

  const testSystemAudio = async () => {
    setIsTestingSystem(true);
    try {
      const constraints = browserType === 'chrome' 
        ? {
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              suppressLocalAudioPlayback: false
            },
            video: { width: 1, height: 1 }
          }
        : {
            audio: true,
            video: { width: 1, height: 1 }
          };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length > 0) {
        setSystemTestResult('success');
        setTestStream(stream);
      } else {
        setSystemTestResult('failed');
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      setSystemTestResult('failed');
    }
    setIsTestingSystem(false);
  };

  const stopTest = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
  };

  const getBrowserInstructions = () => {
    switch (browserType) {
      case 'chrome':
        return {
          icon: <Chrome className="h-5 w-5" />,
          name: "Chrome",
          steps: [
            "Click 'Test System Audio' below",
            "Select 'Entire Screen' in the popup",
            "✅ Check 'Share audio' checkbox",
            "Click 'Share' button"
          ]
        };
      case 'safari':
        return {
          icon: <Monitor className="h-5 w-5" />,
          name: "Safari",
          steps: [
            "Click 'Test System Audio' below",
            "Select 'Entire Screen'",
            "✅ Enable 'Include Audio'",
            "Click 'Share' button"
          ]
        };
      case 'firefox':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          name: "Firefox",
          steps: [
            "⚠️ Limited system audio support",
            "Try microphone-only mode",
            "Or switch to Chrome for best results"
          ]
        };
      default:
        return {
          icon: <Monitor className="h-5 w-5" />,
          name: "Browser",
          steps: [
            "Select 'Entire Screen'",
            "Enable audio sharing",
            "Grant permissions"
          ]
        };
    }
  };

  const instructions = getBrowserInstructions();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {instructions.icon}
          Audio Setup Test - {instructions.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Browser Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">System Audio Setup:</p>
              {instructions.steps.map((step, index) => (
                <p key={index} className="text-sm">
                  {index + 1}. {step}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Microphone Test */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="font-medium">Microphone</span>
              {micTestResult === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {micTestResult === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
            </div>
            <Button 
              onClick={testMicrophone} 
              disabled={isTestingMic}
              variant={micTestResult === 'success' ? 'outline' : 'default'}
              size="sm"
              className="w-full"
            >
              {isTestingMic ? 'Testing...' : 'Test Microphone'}
            </Button>
          </div>

          {/* System Audio Test */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="font-medium">System Audio</span>
              {systemTestResult === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {systemTestResult === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
            </div>
            {!testStream ? (
              <Button 
                onClick={testSystemAudio} 
                disabled={isTestingSystem || browserType === 'firefox'}
                variant={systemTestResult === 'success' ? 'outline' : 'default'}
                size="sm"
                className="w-full"
              >
                {isTestingSystem ? 'Testing...' : 'Test System Audio'}
              </Button>
            ) : (
              <Button onClick={stopTest} variant="destructive" size="sm" className="w-full">
                <Square className="h-3 w-3 mr-1" />
                Stop Test
              </Button>
            )}
          </div>
        </div>

        {/* Test Status */}
        <div className="space-y-2">
          {micTestResult === 'failed' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Microphone access denied. Please allow microphone permissions and try again.
              </AlertDescription>
            </Alert>
          )}

          {systemTestResult === 'failed' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                System audio not captured. Make sure to select "Entire Screen" and enable audio sharing.
              </AlertDescription>
            </Alert>
          )}

          {micTestResult === 'success' && systemTestResult === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                ✅ Perfect! Both microphone and system audio are working. Ready for live coaching.
              </AlertDescription>
            </Alert>
          )}

          {browserType === 'firefox' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Firefox has limited system audio support. For best results, use Chrome or Edge.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Demo Mode Option */}
        {micTestResult === 'success' && systemTestResult !== 'success' && (
          <Alert>
            <Volume2 className="h-4 w-4" />
            <AlertDescription>
              You can still demo with microphone-only mode. Use "Demo Mode" to simulate customer responses.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Wifi, 
  Mic, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { detectEnvironment, validateAudioPermissions } from '@/utils/environmentDetection';

interface EnvironmentDebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
  isListening: boolean;
  isUsingWhisper: boolean;
}

export function EnvironmentDebugPanel({ 
  isVisible, 
  onClose,
  isListening,
  isUsingWhisper
}: EnvironmentDebugPanelProps) {
  const [envInfo, setEnvInfo] = useState(() => detectEnvironment());
  const [permissions, setPermissions] = useState<{ granted: boolean; error?: string } | null>(null);
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkEnvironment = async () => {
    setIsRefreshing(true);
    
    // Update environment info
    const env = detectEnvironment();
    setEnvInfo(env);
    
    // Check speech recognition
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSpeechRecognitionAvailable(hasRecognition);
    
    // Check permissions
    const perms = await validateAudioPermissions();
    setPermissions(perms);
    
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isVisible) {
      checkEnvironment();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getEnvBadgeVariant = () => {
    if (envInfo.isDevelopment) return 'default';
    if (envInfo.isPreview) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50 border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Environment Debug Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkEnvironment}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Environment Type */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Environment:</span>
          <Badge variant={getEnvBadgeVariant()}>
            {envInfo.isDevelopment && 'Development'}
            {envInfo.isPreview && 'Preview (Lovable)'}
            {envInfo.isProduction && 'Production (Custom Domain)'}
          </Badge>
        </div>

        {/* Domain */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Domain:</span>
          <span className="text-xs font-mono truncate max-w-[200px]" title={envInfo.domain}>
            {envInfo.domain}
          </span>
        </div>

        {/* HTTPS */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">HTTPS:</span>
          <div className="flex items-center gap-1">
            {getStatusIcon(envInfo.hasHTTPS)}
            <span className="text-xs">{envInfo.hasHTTPS ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        {/* Speech Recognition API */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Speech Recognition:</span>
          <div className="flex items-center gap-1">
            {getStatusIcon(speechRecognitionAvailable)}
            <span className="text-xs">{speechRecognitionAvailable ? 'Available' : 'Not Available'}</span>
          </div>
        </div>

        {/* Microphone Permissions */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Microphone:</span>
          <div className="flex items-center gap-1">
            {permissions && getStatusIcon(permissions.granted)}
            <span className="text-xs">
              {permissions?.granted ? 'Granted' : permissions?.error || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Active Transcription Engine */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Active Engine:</span>
          <Badge variant={isListening ? "default" : "outline"}>
            {!isListening && 'Not Active'}
            {isListening && isUsingWhisper && 'Whisper AI'}
            {isListening && !isUsingWhisper && 'Browser Speech'}
          </Badge>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Session Status:</span>
          <Badge variant={isListening ? "default" : "secondary"}>
            {isListening ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Warnings */}
        {!envInfo.hasHTTPS && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-amber-800">
              HTTPS is required for microphone access. Some features may not work.
            </span>
          </div>
        )}

        {!speechRecognitionAvailable && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span className="text-red-800">
              Speech Recognition API not available. Try Chrome, Edge, or Safari.
            </span>
          </div>
        )}

        {permissions && !permissions.granted && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <Mic className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span className="text-red-800">
              {permissions.error || 'Microphone access required for live coaching.'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

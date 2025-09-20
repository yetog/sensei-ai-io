import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface CoachingError {
  type: 'audio_failure' | 'speech_recognition_error' | 'ai_service_error' | 'permission_denied';
  message: string;
  canRecover: boolean;
  timestamp: number;
}

interface ErrorBannerProps {
  error: CoachingError;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  const getErrorColor = (type: CoachingError['type']) => {
    switch (type) {
      case 'permission_denied':
        return 'border-amber-500 bg-amber-50 text-amber-900';
      case 'audio_failure':
        return 'border-red-500 bg-red-50 text-red-900';
      case 'speech_recognition_error':
        return 'border-orange-500 bg-orange-50 text-orange-900';
      default:
        return 'border-red-500 bg-red-50 text-red-900';
    }
  };

  const getErrorTitle = (type: CoachingError['type']) => {
    switch (type) {
      case 'permission_denied':
        return 'Permission Required';
      case 'audio_failure':
        return 'Audio Capture Failed';
      case 'speech_recognition_error':
        return 'Speech Recognition Error';
      case 'ai_service_error':
        return 'AI Service Error';
      default:
        return 'Error Occurred';
    }
  };

  const getErrorSolution = (type: CoachingError['type']) => {
    switch (type) {
      case 'permission_denied':
        return 'Please allow microphone and screen capture permissions, then try again.';
      case 'audio_failure':
        return 'Check your audio settings and ensure system audio is enabled.';
      case 'speech_recognition_error':
        return 'Speech recognition was interrupted. Your microphone may have been disconnected.';
      case 'ai_service_error':
        return 'The AI coaching service is temporarily unavailable.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  return (
    <Alert className={`mb-4 ${getErrorColor(error.type)}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold">{getErrorTitle(error.type)}</div>
          <div className="text-sm mt-1">{error.message}</div>
          <div className="text-xs mt-1 opacity-75">{getErrorSolution(error.type)}</div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {error.canRecover && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-8 px-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
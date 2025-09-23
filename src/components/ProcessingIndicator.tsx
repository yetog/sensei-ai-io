import React from 'react';
import { Loader2, Brain, Mic, MicOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProcessingIndicatorProps {
  isProcessing: boolean;
  isListening: boolean;
  micLevel?: number;
  className?: string;
}

export function ProcessingIndicator({ 
  isProcessing, 
  isListening, 
  micLevel = 0,
  className 
}: ProcessingIndicatorProps) {
  const micIntensity = Math.min(micLevel * 100, 100);
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Listening Status */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "relative p-2 rounded-full transition-all duration-300",
          isListening 
            ? "bg-green-100 text-green-600 animate-pulse" 
            : "bg-gray-100 text-gray-400"
        )}>
          {isListening ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
          
          {/* Audio Level Visualizer */}
          {isListening && (
            <div className="absolute -top-1 -right-1">
              <div 
                className="w-3 h-3 bg-green-500 rounded-full animate-ping"
                style={{ 
                  opacity: micIntensity / 100,
                  animationDuration: `${Math.max(0.5, 2 - micIntensity / 50)}s`
                }}
              />
            </div>
          )}
        </div>
        
        <Badge 
          variant={isListening ? "default" : "secondary"}
          className={cn(
            "text-xs transition-all duration-300",
            isListening && "animate-pulse bg-green-600"
          )}
        >
          {isListening ? "Listening" : "Paused"}
        </Badge>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="flex items-center gap-2 animate-fade-in">
          <div className="relative p-2 rounded-full bg-blue-100 text-blue-600">
            <Brain className="h-4 w-4" />
            <Loader2 className="h-3 w-3 animate-spin absolute -top-0.5 -right-0.5 text-blue-500" />
          </div>
          
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 animate-pulse">
            AI Analyzing...
          </Badge>
        </div>
      )}

      {/* Audio Level Bar */}
      {isListening && micLevel > 0 && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-150",
                micIntensity > i * 20 
                  ? "bg-green-500 h-4" 
                  : "bg-gray-300 h-2"
              )}
              style={{
                transform: micIntensity > i * 20 ? 'scaleY(1.2)' : 'scaleY(1)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
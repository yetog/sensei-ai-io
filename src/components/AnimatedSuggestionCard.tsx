import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  CheckCircle, 
  X, 
  ThumbsUp, 
  ThumbsDown,
  AlertTriangle,
  TrendingUp,
  Target,
  Users,
  Clock,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachingSuggestion {
  id: string;
  type: 'objection' | 'product_pitch' | 'closing' | 'retention' | 'general';
  context: string;
  suggestion: string;
  confidence: number;
  sourceDocument?: string;
  timestamp: number;
  userFeedback?: SuggestionFeedback;
}

interface SuggestionFeedback {
  rating: 'helpful' | 'not_helpful';
  timestamp: number;
  reason?: string;
}

interface AnimatedSuggestionCardProps {
  suggestion: CoachingSuggestion;
  onCopy: (suggestion: CoachingSuggestion) => void;
  onDismiss: (id: string) => void;
  onRate: (id: string, rating: 'helpful' | 'not_helpful') => void;
  copiedId?: string | null;
  isNew?: boolean;
}

function getSuggestionIcon(type: string) {
  switch (type) {
    case 'objection': return <AlertTriangle className="h-4 w-4" />;
    case 'product_pitch': return <TrendingUp className="h-4 w-4" />;
    case 'closing': return <Target className="h-4 w-4" />;
    case 'retention': return <Users className="h-4 w-4" />;
    default: return <Lightbulb className="h-4 w-4" />;
  }
}

function getSuggestionColor(type: string) {
  switch (type) {
    case 'objection': return 'text-orange-600';
    case 'product_pitch': return 'text-blue-600';
    case 'closing': return 'text-green-600';
    case 'retention': return 'text-purple-600';
    default: return 'text-gray-600';
  }
}

function getSuggestionTypeColor(type: string) {
  switch (type) {
    case 'objection': return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'product_pitch': return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'closing': return 'bg-green-50 border-green-200 text-green-700';
    case 'retention': return 'bg-purple-50 border-purple-200 text-purple-700';
    default: return 'bg-gray-50 border-gray-200 text-gray-700';
  }
}

export function AnimatedSuggestionCard({ 
  suggestion, 
  onCopy, 
  onDismiss, 
  onRate, 
  copiedId,
  isNew = false
}: AnimatedSuggestionCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pulseConfidence, setPulseConfidence] = useState(false);

  useEffect(() => {
    // Animate in when new
    if (isNew) {
      setTimeout(() => setIsVisible(true), 100);
      
      // Pulse confidence badge after slide-in
      setTimeout(() => setPulseConfidence(true), 600);
      setTimeout(() => setPulseConfidence(false), 1200);
    } else {
      setIsVisible(true);
    }
  }, [isNew]);

  const handleCopy = () => {
    onCopy(suggestion);
  };

  const handleRate = (rating: 'helpful' | 'not_helpful') => {
    onRate(suggestion.id, rating);
    setShowFeedback(true);
  };

  // Parse suggestion content
  const suggestionLines = suggestion.suggestion.split('\n').filter(line => line.trim());
  const hasStructuredContent = suggestionLines.some(line => 
    line.toLowerCase().includes('analysis') || 
    line.toLowerCase().includes('suggestion')
  );

  let summaryContent = '';
  let suggestionContent = '';

  if (hasStructuredContent) {
    const suggestionIndex = suggestionLines.findIndex(line => 
      line.toLowerCase().includes('suggestion')
    );
    
    if (suggestionIndex > 0) {
      summaryContent = suggestionLines.slice(0, suggestionIndex).join('\n');
      suggestionContent = suggestionLines.slice(suggestionIndex).join('\n');
    } else {
      suggestionContent = suggestion.suggestion;
    }
  } else {
    suggestionContent = suggestion.suggestion;
  }

  const isCopied = copiedId === suggestion.id;
  const hasRated = suggestion.userFeedback?.rating;

  return (
    <Card 
      className={cn(
        "border-l-4 relative transition-all duration-500 ease-out hover-scale",
        isVisible ? "animate-slide-in-right opacity-100 translate-x-0" : "opacity-0 translate-x-full",
        suggestion.type === 'objection' && "border-l-orange-400",
        suggestion.type === 'product_pitch' && "border-l-blue-400",
        suggestion.type === 'closing' && "border-l-green-400",
        suggestion.type === 'retention' && "border-l-purple-400",
        suggestion.type === 'general' && "border-l-gray-400"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1 rounded", getSuggestionColor(suggestion.type))}>
              {getSuggestionIcon(suggestion.type)}
            </div>
            <Badge 
              variant="outline" 
              className={cn("text-xs", getSuggestionTypeColor(suggestion.type))}
            >
              {suggestion.type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs transition-all duration-300",
                pulseConfidence && "animate-pulse scale-110"
              )}
            >
              {Math.round(suggestion.confidence * 100)}%
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(suggestion.id)}
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {suggestion.context && (
          <p className="text-xs text-muted-foreground bg-accent/30 p-2 rounded">
            <strong>Context:</strong> {suggestion.context}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Summary & Analysis */}
        {summaryContent && (
          <div className="animate-fade-in">
            <h4 className="text-sm font-medium text-foreground mb-1">Summary & Analysis</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {summaryContent}
            </p>
          </div>
        )}

        {/* Main Suggestion */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h4 className="text-sm font-medium text-foreground mb-1">Suggestion</h4>
          <div className="text-sm text-foreground whitespace-pre-wrap bg-accent/20 p-3 rounded border">
            {suggestionContent}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className={cn(
                "h-7 text-xs transition-all duration-200",
                isCopied && "bg-green-50 border-green-200 text-green-700"
              )}
            >
              {isCopied ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Feedback Buttons */}
          <div className="flex items-center gap-1">
            {!hasRated && !showFeedback ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRate('helpful')}
                  className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRate('not_helpful')}
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground animate-fade-in">
                {hasRated === 'helpful' ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <ThumbsUp className="h-3 w-3" />
                    Helpful
                  </div>
                ) : hasRated === 'not_helpful' ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <ThumbsDown className="h-3 w-3" />
                    Not Helpful
                  </div>
                ) : (
                  <span className="text-green-600">Thanks for the feedback!</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
          <Clock className="h-3 w-3" />
          {new Date(suggestion.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
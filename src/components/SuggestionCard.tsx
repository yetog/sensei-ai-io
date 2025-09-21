import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Users
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

interface SuggestionCardProps {
  suggestion: CoachingSuggestion;
  onCopy: (suggestion: CoachingSuggestion) => void;
  onDismiss: (id: string) => void;
  onRate: (id: string, rating: 'helpful' | 'not_helpful') => void;
  copiedId?: string | null;
}

export function SuggestionCard({ 
  suggestion, 
  onCopy, 
  onDismiss, 
  onRate, 
  copiedId 
}: SuggestionCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'objection': return AlertTriangle;
      case 'product_pitch': return TrendingUp;
      case 'closing': return Target;
      case 'retention': return Users;
      default: return CheckCircle;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'objection':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'product_pitch':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'closing':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'retention':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const handleRate = (rating: 'helpful' | 'not_helpful') => {
    onRate(suggestion.id, rating);
    setShowFeedback(false);
  };

  const IconComponent = getSuggestionIcon(suggestion.type);
  const isRated = suggestion.userFeedback !== undefined;
  const isCopied = copiedId === suggestion.id;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      getSuggestionColor(suggestion.type),
      isRated && "opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            <Badge variant="secondary" className="text-xs">
              {suggestion.type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {Math.round(suggestion.confidence * 100)}%
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(suggestion.id)}
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">
            <strong>Trigger:</strong> {suggestion.context}
          </div>
          <div className="text-sm">
            {suggestion.suggestion}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/20">
          <div className="flex items-center gap-2">
            {!isRated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRate('helpful')}
                  className="h-8 px-2"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Helpful
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRate('not_helpful')}
                  className="h-8 px-2"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Not Helpful
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1 text-xs">
                {suggestion.userFeedback?.rating === 'helpful' ? (
                  <ThumbsUp className="h-3 w-3 text-green-600" />
                ) : (
                  <ThumbsDown className="h-3 w-3 text-red-600" />
                )}
                <span className="opacity-75">
                  Rated {suggestion.userFeedback?.rating === 'helpful' ? 'helpful' : 'not helpful'}
                </span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(suggestion)}
            className="h-8 px-2"
          >
            {isCopied ? (
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            {isCopied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
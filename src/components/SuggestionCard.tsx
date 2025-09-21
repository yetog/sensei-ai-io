import React, { useState } from 'react';
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
        return 'border-destructive/20 bg-destructive/5';
      case 'product_pitch':
        return 'border-accent/20 bg-accent/5';
      case 'closing':
        return 'border-primary/20 bg-primary/5';
      case 'retention':
        return 'border-secondary/20 bg-secondary/5';
      default:
        return 'border-muted/20 bg-muted/5';
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'objection': return 'text-destructive';
      case 'product_pitch': return 'text-accent';
      case 'closing': return 'text-primary';
      case 'retention': return 'text-secondary';
      default: return 'text-muted-foreground';
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
      "group relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      "bg-card/50 backdrop-blur-sm border border-border/50 overflow-hidden",
      getSuggestionColor(suggestion.type),
      isRated && "opacity-75",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-accent/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
    )}>
      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-full bg-background/80 shadow-sm",
              getSuggestionTypeColor(suggestion.type)
            )}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs border-0 px-2 py-0.5 font-medium",
                  getSuggestionTypeColor(suggestion.type),
                  "bg-background/60"
                )}
              >
                {suggestion.type.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs h-4 px-1.5">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(suggestion.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(suggestion.id);
            }}
            className="h-7 w-7 p-0 opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-0 space-y-3">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trigger</span>
              <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">
                "{suggestion.context}"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 mt-3">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">AI Suggestion</span>
              <p className="text-sm text-foreground font-medium mt-0.5 leading-relaxed">
                {suggestion.suggestion}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            {!isRated ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRate('helpful')}
                  className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Helpful
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRate('not_helpful')}
                  className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Not Helpful
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs">
                <div className={cn(
                  "p-1 rounded-full",
                  suggestion.userFeedback?.rating === 'helpful' 
                    ? "bg-primary/10 text-primary" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  {suggestion.userFeedback?.rating === 'helpful' ? (
                    <ThumbsUp className="h-3 w-3" />
                  ) : (
                    <ThumbsDown className="h-3 w-3" />
                  )}
                </div>
                <span className="text-muted-foreground font-medium">
                  Rated {suggestion.userFeedback?.rating === 'helpful' ? 'helpful' : 'not helpful'}
                </span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(suggestion)}
            className={cn(
              "h-7 px-2 text-xs transition-all duration-200",
              isCopied 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-accent/10 hover:text-accent"
            )}
          >
            {isCopied ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
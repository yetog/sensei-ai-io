import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Users, 
  User, 
  Brain, 
  Clock, 
  Target,
  TrendingUp,
  X,
  Copy,
  CheckCircle,
  AlertCircle,
  PhoneCall
} from 'lucide-react';
import { useRealTimeCoaching } from '@/hooks/useRealTimeCoaching';
import { cn } from '@/lib/utils';

interface LiveCoachingDashboardProps {
  onClose?: () => void;
}

export function LiveCoachingDashboard({ onClose }: LiveCoachingDashboardProps) {
  const {
    isListening,
    isProcessing,
    transcription,
    suggestions,
    currentTurn,
    callType,
    startListening,
    stopListening,
    toggleSpeaker,
    clearSession,
    dismissSuggestion,
    isAvailable
  } = useRealTimeCoaching();

  const [selectedCallType, setSelectedCallType] = useState<'incoming_sales' | 'retention' | 'outbound' | 'general'>('incoming_sales');
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<string | null>(null);

  const handleStartCoaching = () => {
    startListening(selectedCallType);
  };

  const handleCopySuggestion = async (suggestion: string, id: string) => {
    try {
      await navigator.clipboard.writeText(suggestion);
      setCopiedSuggestionId(id);
      setTimeout(() => setCopiedSuggestionId(null), 2000);
    } catch (error) {
      console.error('Failed to copy suggestion:', error);
    }
  };

  const getStatusColor = () => {
    if (isProcessing) return 'bg-amber-500';
    if (isListening) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening';
    return 'Ready';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'objection': return <AlertCircle className="h-4 w-4" />;
      case 'product_pitch': return <Target className="h-4 w-4" />;
      case 'closing': return <TrendingUp className="h-4 w-4" />;
      case 'retention': return <Users className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'objection': return 'border-red-200 bg-red-50';
      case 'product_pitch': return 'border-blue-200 bg-blue-50';
      case 'closing': return 'border-green-200 bg-green-50';
      case 'retention': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isAvailable) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            Live Coaching Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Speech Recognition Not Available</h3>
            <p className="text-muted-foreground">
              Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for the best experience.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Live Sales Coaching
              <div className={cn("h-3 w-3 rounded-full", getStatusColor())} />
              <span className="text-sm font-normal text-muted-foreground">
                {getStatusText()}
              </span>
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Call Type Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Call Type:</span>
              <select 
                value={selectedCallType}
                onChange={(e) => setSelectedCallType(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
                disabled={isListening}
              >
                <option value="incoming_sales">Incoming Sales</option>
                <option value="retention">Retention</option>
                <option value="outbound">Outbound</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {!isListening ? (
                <Button onClick={handleStartCoaching} className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Start Coaching
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive" className="flex items-center gap-2">
                  <MicOff className="h-4 w-4" />
                  Stop Listening
                </Button>
              )}
              
              {isListening && (
                <Button onClick={toggleSpeaker} variant="outline" size="sm">
                  {currentTurn === 'user' ? (
                    <>
                      <User className="h-4 w-4 mr-1" />
                      You're Speaking
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-1" />
                      Customer Speaking
                    </>
                  )}
                </Button>
              )}
              
              <Button onClick={clearSession} variant="outline" size="sm">
                Clear Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Transcription */}
        <Card className="h-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Live Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ScrollArea className="h-full">
              {transcription.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <PhoneCall className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Start coaching to see live transcription</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {transcription.map((segment) => (
                    <div
                      key={segment.id}
                      className={cn(
                        "p-3 rounded-lg border-l-4",
                        segment.speaker === 'user' 
                          ? "bg-blue-50 border-l-blue-400" 
                          : "bg-green-50 border-l-green-400"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={segment.speaker === 'user' ? 'default' : 'secondary'}>
                          {segment.speaker === 'user' ? 'You' : 'Customer'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(segment.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm">{segment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card className="h-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Coaching Suggestions
              {isProcessing && (
                <div className="flex items-center gap-1 text-sm text-amber-600">
                  <Clock className="h-3 w-3 animate-spin" />
                  Analyzing...
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ScrollArea className="h-full">
              {suggestions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>AI suggestions will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.slice().reverse().map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all duration-200",
                        getSuggestionColor(suggestion.type)
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getSuggestionIcon(suggestion.type)}
                          <Badge variant="outline" className="text-xs">
                            {suggestion.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopySuggestion(suggestion.suggestion, suggestion.id)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedSuggestionId === suggestion.id ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissSuggestion(suggestion.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {suggestion.context && (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            Context: {suggestion.context}
                          </p>
                          <Separator className="my-2" />
                        </>
                      )}
                      
                      <p className="text-sm font-medium leading-relaxed">
                        {suggestion.suggestion}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(suggestion.timestamp).toLocaleTimeString()}
                        </span>
                        {suggestion.sourceDocument && (
                          <Badge variant="outline" className="text-xs">
                            From KB
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Session Stats */}
      {transcription.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {transcription.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Exchanges
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {suggestions.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Suggestions Given
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {suggestions.filter(s => s.type === 'objection').length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Objections Detected
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((suggestions.reduce((acc, s) => acc + s.confidence, 0) / suggestions.length) * 100) || 0}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg Confidence
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
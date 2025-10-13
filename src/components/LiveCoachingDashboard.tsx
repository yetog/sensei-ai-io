import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  PhoneOff,
  Lightbulb,
  X, 
  Trash2, 
  Download,
  Clock,
  Calendar,
  Radio,
  Activity,
  PhoneCall,
  Brain,
  AlertCircle
} from 'lucide-react';
import { useRealTimeCoachingWithElevenLabs } from '@/hooks/useRealTimeCoachingWithElevenLabs';
import { EnhancedTranscriptDisplay } from './EnhancedTranscriptDisplay';
import { SuggestionCard } from './SuggestionCard';
import { PostCallSummary } from './PostCallSummary';
import { callSummaryStorage } from '@/services/callSummaryStorage';
import { useToast } from '@/hooks/use-toast';

interface LiveCoachingDashboardProps {
  onClose?: () => void;
}

export function LiveCoachingDashboard({ onClose }: LiveCoachingDashboardProps) {
  const {
    isListening,
    isSpeaking,
    isProcessing,
    transcription,
    suggestions,
    sessionStartTime,
    error,
    startListening,
    stopListening,
    clearSession,
    dismissSuggestion,
    rateSuggestion,
    isAvailable,
  } = useRealTimeCoachingWithElevenLabs();

  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const [selectedCallType, setSelectedCallType] = useState<'incoming_sales' | 'retention' | 'outbound' | 'general'>('incoming_sales');
  const [sessionDuration, setSessionDuration] = useState(0);
  const { toast } = useToast();

  // Update session duration every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Date.now() - sessionStartTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isListening, sessionStartTime]);

  const handleStartCoaching = () => {
    startListening();
  };

  const handleStopCall = () => {
    stopListening();
    if (transcription.length > 0 || suggestions.length > 0) {
      setShowPostCallSummary(true);
    }
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const generateCallSummary = () => {
    const duration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    const summaryText = transcription
      .map(t => `${t.speaker === 'user' ? 'Agent' : 'Customer'}: ${t.text}`)
      .join('\n\n');

    return {
      id: `call-${Date.now()}`,
      date: new Date().toISOString(),
      duration: formatDuration(duration),
      callType: selectedCallType,
      transcript: summaryText,
      coachingSuggestions: suggestions.map(s => ({
        type: s.type,
        message: s.suggestion,
        timestamp: s.timestamp
      })),
      summary: `Sales call with ${transcription.length} exchanges and ${suggestions.length} coaching tips`,
      keyPoints: suggestions.slice(0, 5).map(s => s.title),
      nextSteps: [],
      outcome: 'follow_up' as const,
      transcriptHighlights: [],
      objections: [],
      customerName: 'Customer',
      companyName: 'IONOS'
    };
  };

  const handleSaveToHistory = async (summary: any, email: string) => {
    try {
      callSummaryStorage.saveCallSummary({
        ...summary,
        followUpEmail: email,
        objections: []
      });
      
      toast({
        title: "Call Saved",
        description: "Call summary saved to history successfully."
      });
      
      setShowPostCallSummary(false);
    } catch (error) {
      console.error('❌ Failed to save call to history:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save call to history. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isAvailable) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Voice Agent Not Available
          </CardTitle>
          <CardDescription>
            ElevenLabs Voice Agent is not properly configured. Please add VITE_ELEVEN_LABS_AGENT_ID to your .env file and make sure your agent is set to "Public" in the ElevenLabs dashboard.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Post Call Summary Modal */}
      {showPostCallSummary && (
        <PostCallSummary
          callSummary={generateCallSummary()}
          onClose={() => setShowPostCallSummary(false)}
          onSaveToHistory={handleSaveToHistory}
        />
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Agent Avatar */}
              {isListening && (
                <Avatar className={`h-12 w-12 border-2 transition-colors ${isSpeaking ? 'border-primary animate-pulse' : 'border-muted'}`}>
                  <AvatarFallback className={`${isSpeaking ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Mic className={`h-6 w-6 ${isSpeaking ? 'text-primary' : 'text-muted-foreground'}`} />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={isListening ? handleStopCall : handleStartCoaching}
                  size="lg"
                  variant={isListening ? "destructive" : "default"}
                  className={!isListening ? 'animate-pulse' : ''}
                >
                  {isListening ? (
                    <>
                      <PhoneOff className="mr-2 h-5 w-5" />
                      End Coaching
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Voice Coaching
                    </>
                  )}
                </Button>
                
                {isListening && (
                  <div className="flex items-center gap-2">
                    <Badge variant={isSpeaking ? "default" : "secondary"} className={isSpeaking ? "animate-pulse" : ""}>
                      {isSpeaking ? "🎙️ Agent Speaking" : "👂 Listening"}
                    </Badge>
                    <Badge variant="outline" className="animate-pulse">
                      <Radio className="mr-1 h-3 w-3" />
                      Live
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDuration(sessionDuration)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transcription Panel */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Transcription
            </CardTitle>
            <CardDescription>
              Real-time conversation powered by ElevenLabs
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {transcription.length === 0 && !isListening && (
              <div className="text-center py-8 text-muted-foreground">
                <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Start voice coaching to see transcription</p>
              </div>
            )}
            {transcription.length === 0 && isListening && (
              <div className="text-center py-8 text-muted-foreground animate-pulse">
                <Radio className="h-12 w-12 mx-auto mb-3" />
                <p>Listening... Start speaking</p>
              </div>
            )}
            {transcription.length > 0 && (
              <EnhancedTranscriptDisplay 
                segments={transcription.map(t => ({
                  ...t,
                  speaker: t.speaker === 'assistant' ? 'customer' : 'user'
                }))}
                interimText=""
                transcriptQuality={0.9}
                sessionDuration={sessionDuration}
              />
            )}
          </CardContent>
        </Card>

        {/* Coaching Suggestions Panel */}
        <Card className="border-primary/20">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                AI Coaching Suggestions
              </CardTitle>
            <CardDescription>
              Real-time coaching powered by IONOS AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isListening ? (
                  <>
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                    <p>Analyzing conversation for coaching tips...</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3">💡</div>
                    <p>AI coaching suggestions will appear here</p>
                  </>
                )}
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onDismiss={dismissSuggestion}
                  onRate={rateSuggestion}
                  onCopy={() => navigator.clipboard.writeText(suggestion.suggestion)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Actions */}
      {isListening && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneCall className="h-4 w-4" />
                <span>Active coaching session</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSession}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Session
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const data = JSON.stringify(generateCallSummary(), null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `coaching-session-${Date.now()}.json`;
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Transcript
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

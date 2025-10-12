import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  PhoneOff,
  Brain, 
  X,
  AlertCircle,
  PhoneCall,
  Download,
  CheckCircle
} from 'lucide-react';
import { useRealTimeCoachingWithElevenLabs } from '@/hooks/useRealTimeCoachingWithElevenLabs';
import { PostCallSummary } from '@/components/PostCallSummary';
import { SuggestionCard } from '@/components/SuggestionCard';
import { EnhancedTranscriptDisplay } from '@/components/EnhancedTranscriptDisplay';
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
  const { toast } = useToast();

  const handleStartCoaching = () => {
    startListening();
  };

  const handleStopCall = () => {
    console.log('🛑 Stopping call, transcription segments:', transcription.length);
    stopListening();
    
    if (transcription.length > 0) {
      setShowPostCallSummary(true);
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateCallSummary = () => {
    const duration = sessionStartTime ? formatDuration(Date.now() - sessionStartTime) : '0:00';
    
    const keyPoints = transcription
      .slice(0, 5)
      .map(seg => seg.text.substring(0, 100) + (seg.text.length > 100 ? '...' : ''));
    
    const nextSteps = suggestions
      .slice(0, 3)
      .map(suggestion => suggestion.suggestion.substring(0, 80) + (suggestion.suggestion.length > 80 ? '...' : ''));

    return {
      duration,
      customerName: undefined,
      callType: selectedCallType,
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Customer expressed interest in our solution'],
      objections: [],
      nextSteps: nextSteps.length > 0 ? nextSteps : ['Follow up within 24 hours'],
      outcome: 'follow_up' as const,
      transcriptHighlights: transcription.slice(-3).map(seg => seg.text)
    };
  };

  const handleSaveToHistory = async (summary: any, email?: string) => {
    try {
      const savedCallId = callSummaryStorage.saveCallSummary({
        duration: summary.duration,
        callType: selectedCallType,
        keyPoints: summary.keyPoints || [],
        objections: summary.objections || [],
        nextSteps: summary.nextSteps || [],
        outcome: summary.outcome || 'follow_up',
        transcriptHighlights: summary.transcriptHighlights || [],
        followUpEmail: email,
        customerName: summary.customerName,
        companyName: summary.companyName
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
            <h3 className="text-lg font-semibold mb-2">Voice Agent Not Available</h3>
            <p className="text-muted-foreground">
              Please check your backend configuration and ensure ElevenLabs credentials are set.
            </p>
          </div>
        </CardContent>
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
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              ElevenLabs Voice Coaching
              {isListening && (
                <Badge variant={isSpeaking ? "default" : "secondary"}>
                  {isSpeaking ? "🎙️ Agent Speaking" : "👂 Listening"}
                </Badge>
              )}
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
            {/* Control Buttons */}
            {!isListening ? (
              <Button onClick={handleStartCoaching} size="lg">
                <Mic className="h-4 w-4 mr-2" />
                Start Voice Coaching
              </Button>
            ) : (
              <Button onClick={handleStopCall} variant="destructive" size="lg">
                <PhoneOff className="h-4 w-4 mr-2" />
                End Coaching
              </Button>
            )}

            {isListening && sessionStartTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Duration: {formatDuration(Date.now() - sessionStartTime)}</span>
              </div>
            )}

            {isProcessing && (
              <Badge variant="outline">
                <Brain className="h-3 w-3 mr-1 animate-pulse" />
                Processing...
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transcription Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PhoneCall className="h-4 w-4" />
              Live Transcription
              {transcription.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {transcription.length} segments
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {transcription.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Start coaching to see live transcription</p>
                </div>
              ) : (
                <EnhancedTranscriptDisplay
                  segments={transcription.map(t => ({
                    ...t,
                    speaker: t.speaker === 'assistant' ? 'customer' : 'user'
                  }))}
                  interimText=""
                  transcriptQuality={0.9}
                  sessionDuration={sessionStartTime ? Date.now() - sessionStartTime : 0}
                  onExportTranscript={() => {
                    const text = transcription.map(t => `${t.speaker}: ${t.text}`).join('\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'transcript.txt';
                    a.click();
                  }}
                />
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Suggestions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Coaching Suggestions
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {suggestions.length} tips
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Coaching suggestions will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onCopy={(s) => {
                        navigator.clipboard.writeText(s.suggestion);
                        toast({
                          title: "Copied",
                          description: "Suggestion copied to clipboard"
                        });
                      }}
                      onDismiss={(id) => dismissSuggestion(id)}
                      onRate={(id, rating) =>
                        rateSuggestion(id, rating)
                      }
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Session Actions */}
      {isListening && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Session active - coaching in progress</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearSession();
                    toast({
                      title: "Session Cleared",
                      description: "Transcription and suggestions cleared."
                    });
                  }}
                >
                  Clear Session
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = transcription.map(t => `${t.speaker}: ${t.text}`).join('\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `coaching-session-${Date.now()}.txt`;
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

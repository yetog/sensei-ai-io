import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, FileText, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { useRealTimeCoaching } from '@/hooks/useRealTimeCoaching';
import { EnhancedTranscriptDisplay } from '@/components/EnhancedTranscriptDisplay';
import { SuggestionCard } from '@/components/SuggestionCard';
import { PostCallSummary } from '@/components/PostCallSummary';
import { CallTypeSelector } from '@/components/CallTypeSelector';

type CallType = 'cold_call' | 'demo' | 'follow_up' | 'closing' | 'discovery' | 'incoming_sales' | 'retention' | 'outbound' | 'general';

export default function FollowupAnalysis() {
  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const [selectedCallType, setSelectedCallType] = useState<CallType>('follow_up');

  const {
    isListening,
    transcription,
    suggestions,
    startListening,
    stopListening,
    sessionDuration,
    error,
    callType,
    transcriptQuality,
  } = useRealTimeCoaching();

  const handleStartAnalysis = async () => {
    await startListening(selectedCallType, 'microphone');
  };

  const handleStopAnalysis = () => {
    stopListening();
  };

  const handleGenerateSummary = () => {
    setShowPostCallSummary(true);
  };

  const handleSaveToHistory = (summary: any, email?: string) => {
    console.log('Saving to history:', summary, email);
    // Implementation will use existing call history storage
  };

  const generateCallSummary = () => {
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return {
      duration: formatDuration(sessionDuration),
      callType: selectedCallType,
      keyPoints: transcription.slice(-5).map(t => t.text.substring(0, 100)),
      objections: suggestions.filter(s => s.type === 'objection').map(s => s.suggestion),
      nextSteps: ['Review call transcript', 'Send follow-up email', 'Schedule next meeting'],
      outcome: 'follow_up' as const,
      transcriptHighlights: transcription.slice(-10).map(t => t.text),
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Follow-up Call Analysis</h1>
        <p className="text-muted-foreground">
          Analyze call recordings and get AI-powered coaching insights for post-call follow-up
        </p>
      </div>

      {/* Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Call Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Call Type</label>
            <CallTypeSelector 
              value={selectedCallType} 
              onChange={(value) => setSelectedCallType(value as CallType)}
              disabled={isListening}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!isListening ? (
              <Button onClick={handleStartAnalysis} className="gap-2">
                <Mic className="h-4 w-4" />
                Start Analysis
              </Button>
            ) : (
              <>
                <Button onClick={handleStopAnalysis} variant="destructive" className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop Analysis
                </Button>
                <Button 
                  onClick={handleGenerateSummary} 
                  variant="secondary" 
                  className="gap-2"
                  disabled={transcription.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Generate Summary
                </Button>
              </>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-4 pt-2">
            <Badge variant={isListening ? 'default' : 'secondary'} className="gap-1">
              {isListening ? '🔴 Recording' : '⚫ Ready'}
            </Badge>
            {isListening && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTime(sessionDuration)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{suggestions.length} suggestions</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout: Transcription + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transcription Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Live Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transcription.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Click "Start Analysis" to begin transcribing</p>
                </div>
              ) : (
                <EnhancedTranscriptDisplay 
                  segments={transcription}
                  transcriptQuality={transcriptQuality}
                  sessionDuration={sessionDuration}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💡 AI Coaching Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>AI suggestions will appear here during analysis</p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onDismiss={() => {}}
                    onRate={() => {}}
                    onCopy={() => {}}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Post-Call Summary Modal */}
      {showPostCallSummary && (
        <PostCallSummary
          callSummary={generateCallSummary()}
          onClose={() => setShowPostCallSummary(false)}
          onSaveToHistory={handleSaveToHistory}
        />
      )}
    </div>
  );
}

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
  PhoneCall,
  Settings,
  History,
  Download,
  FileText,
  Save
} from 'lucide-react';
import { useRealTimeCoaching } from '@/hooks/useRealTimeCoaching';
import { PostCallSummary } from '@/components/PostCallSummary';
import { GoogleMeetInstructions } from '@/components/GoogleMeetInstructions';
import { callHistoryService } from '@/services/callHistoryService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
    isDemoMode,
    audioSource,
    micLevel,
    tabLevel,
    isTabAudioAvailable,
    startListening,
    stopListening,
    toggleSpeaker,
    clearSession,
    dismissSuggestion,
    toggleDemoMode,
    requestCoaching,
    saveTranscript,
    exportTranscriptData,
    isAvailable
  } = useRealTimeCoaching();

  const [selectedCallType, setSelectedCallType] = useState<'incoming_sales' | 'retention' | 'outbound' | 'general'>('incoming_sales');
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<string | null>(null);
  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const [selectedAudioSource, setSelectedAudioSource] = useState<'microphone' | 'tab' | 'both'>('microphone');
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const { toast } = useToast();

  const handleStartCoaching = () => {
    setCallStartTime(Date.now());
    startListening(selectedCallType, selectedAudioSource);
  };

  const handleStopCall = () => {
    stopListening();
    
    // Show post-call summary if we have any transcription data
    if (transcription.length > 0) {
      console.log('Showing post-call summary with', transcription.length, 'segments');
      setTimeout(() => setShowPostCallSummary(true), 100); // Small delay to ensure clean state
    } else {
      console.log('No transcription data, not showing summary');
    }
    setCallStartTime(null);
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateCallSummary = () => {
    const duration = callStartTime ? formatDuration(Date.now() - callStartTime) : '0:00';
    
    // Extract key points from transcription
    const customerSegments = transcription.filter(seg => seg.speaker === 'customer');
    const keyPoints = customerSegments
      .slice(0, 5)
      .map(seg => seg.text.substring(0, 100) + (seg.text.length > 100 ? '...' : ''));
    
    // Extract objections (segments with negative keywords)
    const objectionKeywords = ['but', 'however', 'concern', 'worry', 'expensive', 'cost', 'budget'];
    const objections = customerSegments
      .filter(seg => objectionKeywords.some(keyword => seg.text.toLowerCase().includes(keyword)))
      .slice(0, 3)
      .map(seg => seg.text.substring(0, 80) + (seg.text.length > 80 ? '...' : ''));

    // Generate next steps based on suggestions
    const nextSteps = suggestions
      .slice(0, 3)
      .map(suggestion => suggestion.suggestion.substring(0, 80) + (suggestion.suggestion.length > 80 ? '...' : ''));

    return {
      duration,
      customerName: undefined,
      callType: selectedCallType,
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Customer expressed interest in our solution'],
      objections: objections.length > 0 ? objections : [],
      nextSteps: nextSteps.length > 0 ? nextSteps : ['Follow up within 24 hours'],
      outcome: 'follow_up' as const,
      transcriptHighlights: transcription.slice(-3).map(seg => seg.text)
    };
  };

  const handleSaveToHistory = (summary: any, email?: string) => {
    try {
      // Save to call history service
      callHistoryService.saveCall({
        ...summary,
        followUpEmail: email
      });
      
      // Also save to call summary storage
      const { callSummaryStorage } = require('@/services/callSummaryStorage');
      callSummaryStorage.saveCallSummary({
        ...summary,
        followUpEmail: email
      });
      
      toast({
        title: "Call Saved",
        description: "Call summary saved to history successfully."
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save call to history.",
        variant: "destructive"
      });
    }
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

            {/* Audio Source Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Audio:</span>
              <select 
                value={selectedAudioSource}
                onChange={(e) => setSelectedAudioSource(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
                disabled={isListening}
              >
                <option value="microphone">Microphone Only</option>
                <option value="tab">Tab Audio Only</option>
                <option value="both">Microphone + Tab</option>
              </select>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isListening ? (
                <Button onClick={handleStartCoaching} className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Start Coaching
                </Button>
              ) : (
                <Button onClick={handleStopCall} variant="destructive" className="flex items-center gap-2">
                  <MicOff className="h-4 w-4" />
                  Stop Call
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
              
              <Button 
                onClick={toggleDemoMode} 
                variant={isDemoMode ? "default" : "outline"} 
                size="sm"
              >
                {isDemoMode ? "Demo Mode ON" : "Demo Mode"}
              </Button>
              
              <Button 
                onClick={requestCoaching} 
                variant="secondary" 
                size="sm"
                disabled={transcription.length === 0}
              >
                <Brain className="h-4 w-4 mr-1" />
                Request Coaching
              </Button>

              {/* Audio Level Indicators */}
              {isListening && (audioSource === 'microphone' || audioSource === 'both') && (
                <div className="flex items-center gap-1">
                  <Mic className="h-3 w-3 text-blue-500" />
                  <div className="w-12 h-2 bg-gray-200 rounded">
                    <div 
                      className="h-full bg-blue-500 rounded transition-all duration-100"
                      style={{ width: `${Math.min(micLevel * 2, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(micLevel)}</span>
                </div>
              )}

              {isListening && (audioSource === 'tab' || audioSource === 'both') && (
                <div className="flex items-center gap-1">
                  <PhoneCall className="h-3 w-3 text-green-500" />
                  <div className="w-12 h-2 bg-gray-200 rounded">
                    <div 
                      className="h-full bg-green-500 rounded transition-all duration-100"
                      style={{ width: `${Math.min(tabLevel * 2, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(tabLevel)}</span>
                </div>
              )}
              
              <Button 
                onClick={saveTranscript} 
                variant="outline" 
                size="sm"
                disabled={transcription.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Save Transcript
              </Button>
              
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
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Live Conversation
              {isDemoMode && (
                <Badge variant="outline" className="text-xs font-bold bg-amber-100 text-amber-800 border-amber-300 animate-pulse">🎯 DEMO MODE</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 pt-2">
              <Button 
                onClick={exportTranscriptData} 
                variant="ghost" 
                size="sm"
                disabled={transcription.length === 0}
                className="text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Export JSON
              </Button>
              <span className="text-xs text-muted-foreground">
                {transcription.length} exchanges
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ScrollArea className="h-full">
              {transcription.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <PhoneCall className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-base">Start coaching to see live transcription</p>
                  </div>
                </div>
              ) : (
                 <div className="space-y-3">
                  {transcription.slice(-20).map((segment) => (
                    <div
                      key={segment.id}
                      className={cn(
                        "p-4 rounded-xl border-l-4 transition-all duration-200 shadow-sm",
                        segment.speaker === 'user' 
                          ? "bg-primary/10 border-l-primary hover:bg-primary/15" 
                          : "bg-accent/10 border-l-accent hover:bg-accent/15"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge 
                          variant={segment.speaker === 'user' ? 'default' : 'secondary'} 
                          className="text-sm font-bold px-3 py-1"
                        >
                          {segment.speaker === 'user' ? 'You' : 'Customer'}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-base text-foreground font-medium leading-relaxed tracking-wide antialiased break-words">
                        {segment.text.length > 200 ? `${segment.text.substring(0, 200)}...` : segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Coaching Suggestions
              <Badge variant="secondary" className="text-xs">
                {suggestions.length}/2 active
              </Badge>
              {isProcessing && (
                <div className="flex items-center gap-1 text-sm text-amber-600">
                  <Clock className="h-3 w-3 animate-spin" />
                  Analyzing...
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ScrollArea className="h-full">
              {suggestions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-base mb-2">Intelligent coaching suggestions</p>
                    <p className="text-sm">Will appear when specific triggers are detected</p>
                  </div>
                </div>
              ) : (
                 <div className="space-y-4">
                  {suggestions.slice().reverse().slice(0, 2).map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all duration-200 shadow-lg hover:shadow-xl",
                        suggestion.type === 'objection' && "border-red-500/60 bg-red-500/10 hover:bg-red-500/15",
                        suggestion.type === 'product_pitch' && "border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/15",
                        suggestion.type === 'closing' && "border-green-500/60 bg-green-500/10 hover:bg-green-500/15",
                        suggestion.type === 'retention' && "border-purple-500/60 bg-purple-500/10 hover:bg-purple-500/15",
                        suggestion.type === 'general' && "border-primary/60 bg-primary/10 hover:bg-primary/15"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          {getSuggestionIcon(suggestion.type)}
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-sm font-semibold px-2 py-1",
                              suggestion.type === 'objection' && "border-red-500 text-red-700 bg-red-50",
                              suggestion.type === 'product_pitch' && "border-blue-500 text-blue-700 bg-blue-50",
                              suggestion.type === 'closing' && "border-green-500 text-green-700 bg-green-50",
                              suggestion.type === 'retention' && "border-purple-500 text-purple-700 bg-purple-50",
                              suggestion.type === 'general' && "border-primary text-primary bg-primary/10"
                            )}
                          >
                            {suggestion.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopySuggestion(suggestion.suggestion, suggestion.id)}
                            className="h-8 w-8 p-0 hover:bg-background/50"
                          >
                            {copiedSuggestionId === suggestion.id ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissSuggestion(suggestion.id)}
                            className="h-8 w-8 p-0 hover:bg-background/50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground font-medium mb-2">Analysis:</p>
                        <p className="text-base text-foreground leading-relaxed font-medium bg-background/50 p-3 rounded-lg border">{suggestion.context}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-2">Suggestions:</p>
                        <div className="space-y-3">
                          {suggestion.suggestion.split('\n\n').filter(s => s.trim()).map((sug, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-background/70 rounded-lg border-l-4 border-l-primary">
                              <Badge variant="secondary" className="text-xs font-bold mt-1">{idx + 1}</Badge>
                              <p className="text-base text-foreground font-medium leading-relaxed">{sug.trim()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-foreground/70 font-medium">
                          {new Date(suggestion.timestamp).toLocaleTimeString()}
                        </span>
                        {suggestion.sourceDocument && (
                          <Badge variant="outline" className="text-xs bg-accent text-accent-foreground">
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

      {/* Google Meet Testing Instructions */}
      {(selectedAudioSource === 'tab' || selectedAudioSource === 'both') && (
        <GoogleMeetInstructions
          audioSource={selectedAudioSource}
          isListening={isListening}
          tabLevel={tabLevel}
          micLevel={micLevel}
          isTabAudioAvailable={isTabAudioAvailable}
        />
      )}

      {/* Post-Call Summary Modal */}
      {showPostCallSummary && (
        <PostCallSummary
          callSummary={generateCallSummary()}
          onClose={() => {
            console.log('Closing post-call summary');
            setShowPostCallSummary(false);
          }}
          onSaveToHistory={handleSaveToHistory}
        />
      )}
    </div>
  );
}
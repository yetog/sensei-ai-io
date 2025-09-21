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
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuggestionCard } from '@/components/SuggestionCard';
import { AgentSelector } from '@/components/AgentSelector';
import { BrowserAudioTest } from '@/components/BrowserAudioTest';
import { DemoScenarios } from '@/components/DemoScenarios';
import { EnhancedTranscriptDisplay } from '@/components/EnhancedTranscriptDisplay';
import { callHistoryService } from '@/services/callHistoryService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import '@/services/demoAgentSetup';

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
    error,
    sessionStatus,
    startListening,
    stopListening,
    toggleSpeaker,
    clearSession,
    dismissSuggestion,
    rateSuggestion,
    toggleDemoMode,
    requestCoaching,
    saveTranscript,
    exportTranscriptData,
    clearError,
    retryOperation,
    isAvailable,
    sessionDuration,
    transcriptQuality,
    interimTranscript
  } = useRealTimeCoaching();

  const [selectedCallType, setSelectedCallType] = useState<'incoming_sales' | 'retention' | 'outbound' | 'general'>('incoming_sales');
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<string | null>(null);
  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const [selectedAudioSource, setSelectedAudioSource] = useState<'microphone' | 'tab' | 'both'>('microphone');
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showAudioTest, setShowAudioTest] = useState(false);
  const [showDemoScenarios, setShowDemoScenarios] = useState(false);
  const { toast } = useToast();

  const handleStartCoaching = () => {
    setCallStartTime(Date.now());
    startListening(selectedCallType, selectedAudioSource, selectedAgentId);
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

  const handleSaveToHistory = async (summary: any, email?: string) => {
    try {
      console.log('Saving call to history:', {
        duration: summary.duration,
        callType: selectedCallType,
        keyPoints: summary.keyPoints,
        objections: summary.objections,
        nextSteps: summary.nextSteps,
        outcome: summary.outcome,
        transcriptHighlights: summary.transcriptHighlights,
        followUpEmail: email
      });

      const savedCall = callHistoryService.saveCall({
        duration: summary.duration,
        callType: selectedCallType,
        keyPoints: summary.keyPoints || [],
        objections: summary.objections || [],
        nextSteps: summary.nextSteps || [],
        outcome: summary.outcome || 'follow_up',
        transcriptHighlights: summary.transcriptHighlights || [],
        followUpEmail: email,
        customerName: summary.customerName,
        notes: `Call conducted on ${new Date().toLocaleDateString()}`
      });
      
      console.log('Call saved successfully with ID:', savedCall.id);
      
      toast({
        title: "Call Saved",
        description: "Call summary saved to history successfully."
      });
      
      // Close the modal after successful save
      setShowPostCallSummary(false);
    } catch (error) {
      console.error('Failed to save call to history:', error);
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
      {/* Error Banner */}
      {error && (
        <ErrorBanner 
          error={error}
          onRetry={retryOperation}
          onDismiss={clearError}
        />
      )}

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

            {/* Audio Test Button */}
            <Button 
              onClick={() => setShowAudioTest(!showAudioTest)} 
              variant="outline" 
              size="sm"
              disabled={isListening}
            >
              {showAudioTest ? 'Hide' : 'Audio Test'}
            </Button>

            {/* Demo Scenarios Button */}
            <Button 
              onClick={() => setShowDemoScenarios(!showDemoScenarios)} 
              variant="outline" 
              size="sm"
              disabled={isListening}
            >
              {showDemoScenarios ? 'Hide' : 'Demo Scenarios'}
            </Button>

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
                <option value="tab">System Audio Only</option>
                <option value="both">Microphone + System</option>
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

      {/* Audio Test Panel */}
      {showAudioTest && (
        <BrowserAudioTest onTestComplete={(success) => {
          if (success) {
            setShowAudioTest(false);
          }
        }} />
      )}

      {/* Demo Scenarios Panel */}
      {showDemoScenarios && (
        <DemoScenarios 
          onSelectScenario={(scenario) => {
            setSelectedCallType(scenario.callType);
            setShowDemoScenarios(false);
            if (!isDemoMode) {
              toggleDemoMode();
            }
            toast({
              title: "Demo Scenario Selected",
              description: `Practice with: ${scenario.title}. Use Demo Mode to simulate customer responses.`
            });
          }}
          isListening={isListening}
        />
      )}

      {/* Agent Selection */}
      <AgentSelector 
        selectedAgentId={selectedAgentId}
        onAgentSelect={setSelectedAgentId}
        callType={selectedCallType}
        isListening={isListening}
      />

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
            {transcription.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <PhoneCall className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-base">Start coaching to see live transcription</p>
                </div>
              </div>
            ) : (
              <EnhancedTranscriptDisplay
                segments={transcription}
                interimText={interimTranscript}
                transcriptQuality={transcriptQuality}
                sessionDuration={sessionDuration}
                onExportTranscript={exportTranscriptData}
                onEditSegment={(segmentId, newText) => {
                  // Handle transcript editing if needed in the future
                  console.log('Edit segment:', segmentId, newText);
                }}
              />
            )}
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
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onCopy={(sug) => handleCopySuggestion(sug.suggestion, sug.id)}
                      onDismiss={dismissSuggestion}
                      onRate={rateSuggestion}
                      copiedId={copiedSuggestionId}
                    />
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
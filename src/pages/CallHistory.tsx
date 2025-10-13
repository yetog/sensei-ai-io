import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Search, Eye, Trash2, Download, Calendar, User, Clock, Filter, Mic, Square, FileText, AlertCircle, MessageSquare, Lightbulb } from 'lucide-react';
import { callSummaryStorage, type StoredCallSummary } from '@/services/callSummaryStorage';
import { useToast } from '@/hooks/use-toast';
import { PostCallSummary } from '@/components/PostCallSummary';
import { ionosAI } from '@/services/ionosAI';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealTimeCoaching } from '@/hooks/useRealTimeCoaching';
import { EnhancedTranscriptDisplay } from '@/components/EnhancedTranscriptDisplay';
import { SuggestionCard } from '@/components/SuggestionCard';
import { CallTypeSelector } from '@/components/CallTypeSelector';
type CallType = 'cold_call' | 'demo' | 'follow_up' | 'closing' | 'discovery' | 'incoming_sales' | 'retention' | 'outbound' | 'general';
export function CallHistory() {
  const [summaries, setSummaries] = useState<StoredCallSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<StoredCallSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSummary, setSelectedSummary] = useState<StoredCallSummary | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<any>(null);
  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const [selectedCallType, setSelectedCallType] = useState<CallType>('follow_up');
  const {
    toast
  } = useToast();
  const {
    isListening,
    transcription,
    suggestions,
    startListening,
    stopListening,
    sessionDuration,
    error,
    transcriptQuality
  } = useRealTimeCoaching();
  useEffect(() => {
    loadSummaries();
  }, []);
  useEffect(() => {
    filterSummaries();
  }, [summaries, searchTerm]);
  const loadSummaries = () => {
    const allSummaries = callSummaryStorage.getAllSummaries();
    setSummaries(allSummaries);
  };
  const filterSummaries = () => {
    if (!searchTerm.trim()) {
      setFilteredSummaries(summaries);
      return;
    }
    const filtered = summaries.filter(summary => summary.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || summary.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || summary.callType.toLowerCase().includes(searchTerm.toLowerCase()) || summary.outcome.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredSummaries(filtered);
  };
  const handleDelete = (id: string) => {
    if (callSummaryStorage.deleteSummary(id)) {
      setSummaries(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Call Deleted",
        description: "Call summary has been removed from history."
      });
    }
  };
  const handleView = (summary: StoredCallSummary) => {
    setSelectedSummary(summary);
    setShowPostCallSummary(true);
  };
  const handleDownload = (summary: StoredCallSummary) => {
    const content = `
Call Summary - ${new Date(summary.timestamp).toLocaleDateString()}

Customer: ${summary.customerName || 'N/A'}
Company: ${summary.companyName || 'N/A'}
Duration: ${summary.duration}
Call Type: ${summary.callType}
Outcome: ${summary.outcome}

Key Points:
${summary.keyPoints.map(point => `• ${point}`).join('\n')}

Objections:
${summary.objections.map(obj => `• ${obj}`).join('\n')}

Next Steps:
${summary.nextSteps.map(step => `• ${step}`).join('\n')}

Follow-up Email:
${summary.followUpEmail || 'No email generated'}
    `.trim();
    const blob = new Blob([content], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-summary-${summary.customerName || 'unknown'}-${new Date(summary.timestamp).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const getOutcomeBadgeColor = (outcome: string) => {
    switch (outcome) {
      case 'closed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'follow_up':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'quote_needed':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'demo_scheduled':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'no_interest':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  const handleStartAnalysis = async () => {
    await startListening(selectedCallType, 'microphone');
  };
  const handleStopAnalysis = async () => {
    stopListening();
    // Auto-show post-call summary when stopping
    if (transcription.length > 0) {
      // Generate AI-powered summary
      toast({
        title: "Analyzing Call...",
        description: "AI is analyzing your conversation to generate insights."
      });
      try {
        const summary = await generateCallSummary();
        setGeneratedSummary(summary);
        setShowPostCallSummary(true);
      } catch (error) {
        console.error('Failed to generate summary:', error);
        toast({
          title: "Analysis Error",
          description: "Failed to analyze call. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  const handleSaveToHistory = (summary: any, email?: string) => {
    console.log('Saving to history:', summary, email);
    loadSummaries(); // Reload to show new summary
  };
  const generateCallSummary = async () => {
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Combine all transcription into full conversation context
    const fullTranscript = transcription.map(t => t.text).join(' ');

    // If transcript is too short, use basic extraction
    if (fullTranscript.length < 50) {
      return {
        duration: formatDuration(sessionDuration),
        callType: selectedCallType,
        keyPoints: transcription.slice(-5).map(t => t.text.substring(0, 100)),
        objections: suggestions.filter(s => s.type === 'objection').map(s => s.suggestion),
        nextSteps: ['Review call transcript', 'Send follow-up email', 'Schedule next meeting'],
        outcome: 'follow_up' as const,
        transcriptHighlights: transcription.slice(-10).map(t => t.text)
      };
    }

    // Use AI to analyze the conversation
    try {
      const analysisPrompt = `
Analyze this sales call transcript and extract actionable intelligence:

TRANSCRIPT:
${fullTranscript}

CALL TYPE: ${selectedCallType}

Extract and return ONLY a valid JSON object with this exact structure:
{
  "customerName": "First name if mentioned, otherwise empty string",
  "companyName": "Company name if mentioned, otherwise empty string",
  "keyPoints": ["3-5 specific discussion points from actual conversation"],
  "objections": ["Any concerns or objections raised by customer"],
  "nextSteps": ["3-4 specific, actionable next steps based on conversation"],
  "productRecommendations": ["Specific IONOS products/services mentioned or needed"],
  "painPoints": ["Customer's key challenges mentioned"],
  "desiredOutcomes": ["What customer wants to achieve"],
  "outcome": "follow_up or quote_needed or closed or no_interest or demo_scheduled"
}

Be specific and extract actual conversation details, not generic placeholders.
      `;
      const response = await ionosAI.sendMessage([{
        role: 'system',
        content: 'You are a sales analysis expert. Extract structured insights from conversations. Return ONLY valid JSON, no additional text.'
      }, {
        role: 'user',
        content: analysisPrompt
      }]);

      // Parse JSON from AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analyzed = JSON.parse(jsonMatch[0]);
        const outcome = analyzed.outcome || 'follow_up';
        return {
          duration: formatDuration(sessionDuration),
          callType: selectedCallType,
          customerName: analyzed.customerName || '',
          companyName: analyzed.companyName || '',
          keyPoints: analyzed.keyPoints?.length > 0 ? analyzed.keyPoints : transcription.slice(-5).map(t => t.text.substring(0, 100)),
          objections: analyzed.objections?.length > 0 ? analyzed.objections : suggestions.filter(s => s.type === 'objection').map(s => s.suggestion),
          nextSteps: analyzed.nextSteps?.length > 0 ? analyzed.nextSteps : ['Review call transcript', 'Send follow-up email', 'Schedule next meeting'],
          outcome: outcome as 'follow_up' | 'quote_needed' | 'closed' | 'no_interest' | 'demo_scheduled',
          transcriptHighlights: transcription.slice(-10).map(t => t.text),
          keyPain: analyzed.painPoints?.join(', ') || '',
          desiredOutcome: analyzed.desiredOutcomes?.join(', ') || ''
        };
      }
    } catch (error) {
      console.error('Failed to AI-analyze call summary:', error);
      // Fallback to basic extraction
    }

    // Fallback if AI analysis fails
    return {
      duration: formatDuration(sessionDuration),
      callType: selectedCallType,
      keyPoints: transcription.slice(-5).map(t => t.text.substring(0, 100)),
      objections: suggestions.filter(s => s.type === 'objection').map(s => s.suggestion),
      nextSteps: ['Review call transcript', 'Send follow-up email', 'Schedule next meeting'],
      outcome: 'follow_up' as const,
      transcriptHighlights: transcription.slice(-10).map(t => t.text)
    };
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 py-[12px]">
            <Phone className="h-8 w-8 text-primary" />
            Call History
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage your sales call summaries and performance analytics
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {summaries.length} Total Calls
        </Badge>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="analysis">Follow-up Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Calls
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search calls..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredSummaries.length > 0 ? <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.map(summary => <TableRow key={summary.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDate(summary.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{summary.customerName || 'Unknown'}</div>
                            {summary.companyName && <div className="text-sm text-muted-foreground">{summary.companyName}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{summary.callType}</Badge>
                      </TableCell>
                      <TableCell>{summary.duration}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getOutcomeBadgeColor(summary.outcome)}>
                          {summary.outcome.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(summary)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(summary)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(summary.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </ScrollArea> : <div className="text-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No calls found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? `No calls match "${searchTerm}"` : 'Start making calls to see your history here'}
              </p>
            </div>}
        </CardContent>
      </Card>

      {/* Post Call Summary Modal */}
      {showPostCallSummary && selectedSummary && <PostCallSummary callSummary={{
          duration: selectedSummary.duration,
          customerName: selectedSummary.customerName,
          callType: selectedSummary.callType,
          keyPoints: selectedSummary.keyPoints,
          objections: selectedSummary.objections,
          nextSteps: selectedSummary.nextSteps,
          outcome: selectedSummary.outcome as 'follow_up' | 'quote_needed' | 'closed' | 'no_interest' | 'demo_scheduled',
          transcriptHighlights: selectedSummary.transcriptHighlights
        }} onClose={() => {
          setShowPostCallSummary(false);
          setSelectedSummary(null);
        }} onSaveToHistory={() => {
          // Already saved, just close
          setShowPostCallSummary(false);
          setSelectedSummary(null);
        }} />}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Analysis Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Call Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Call Type</label>
                <CallTypeSelector value={selectedCallType} onChange={value => setSelectedCallType(value as CallType)} disabled={isListening} />
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                {!isListening ? <Button onClick={handleStartAnalysis} className="gap-2">
                    <Mic className="h-4 w-4" />
                    Start Analysis
                  </Button> : <Button onClick={handleStopAnalysis} variant="destructive" className="gap-2">
                    <Square className="h-4 w-4" />
                    Stop & Generate Summary
                  </Button>}
              </div>

              {/* Status Bar */}
              <div className="flex items-center gap-4 pt-2">
                <Badge variant={isListening ? 'default' : 'secondary'} className="gap-1">
                  {isListening ? '🔴 Recording' : '⚫ Ready'}
                </Badge>
                {isListening && <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(sessionDuration)}</span>
                  </div>}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{suggestions.length} suggestions</span>
                </div>
              </div>

              {/* Error Display */}
              {error && <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{error.message}</span>
                </div>}
            </CardContent>
          </Card>

          {/* Two Column Layout: Transcription + Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transcription Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Live Transcription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transcription.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                    <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Click "Start Analysis" to begin transcribing</p>
                  </div> : <EnhancedTranscriptDisplay segments={transcription} transcriptQuality={transcriptQuality} sessionDuration={sessionDuration} />}
              </CardContent>
            </Card>

            {/* Suggestions Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  AI Coaching Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>AI suggestions will appear here during analysis</p>
                  </div> : suggestions.map(suggestion => <SuggestionCard key={suggestion.id} suggestion={suggestion} onDismiss={() => {}} onRate={() => {}} onCopy={() => {}} />)}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Post Call Summary Modal for Follow-up Analysis (triggered by handleStopAnalysis) */}
      {showPostCallSummary && generatedSummary && <PostCallSummary callSummary={generatedSummary} onClose={() => {
      setShowPostCallSummary(false);
      setGeneratedSummary(null);
    }} onSaveToHistory={handleSaveToHistory} />}
    </div>;
}
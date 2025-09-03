import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Phone, 
  Calendar, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  ArrowRight,
  Volume2,
  VolumeX,
  Monitor,
  Brain,
  AlertCircle
} from 'lucide-react';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { useElevenLabs } from '@/hooks/useElevenLabs';
import { intelligentQuoteGenerator } from '@/services/intelligentQuoteGenerator';
import { conversationAnalyzer } from '@/services/conversationAnalyzer';
import { toast } from 'sonner';

interface CallInsight {
  type: 'opportunity' | 'objection' | 'next_step' | 'warning' | 'buying_signal' | 'risk';
  title: string;
  message: string;
  action?: string;
  confidence?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  salesStage?: string;
}

export function CallAssistant() {
  const [callNotes, setCallNotes] = useState('');
  const [currentInsights, setCurrentInsights] = useState<CallInsight[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isVoiceCoachingEnabled, setIsVoiceCoachingEnabled] = useState(true);
  const [lastCustomerMessage, setLastCustomerMessage] = useState('');

  const { 
    isRecording, 
    isSystemAudioEnabled, 
    startRecording, 
    stopRecording 
  } = useAudioCapture({
    onTranscript: handleTranscript,
    includeSystemAudio: true
  });

  const {
    isInitialized: isElevenLabsReady,
    isPlaying: isAICoaching,
    initializeElevenLabs,
    speakCoaching,
    stopSpeaking,
    generateQuickResponse
  } = useElevenLabs();

  // Initialize ElevenLabs on component mount
  useEffect(() => {
    initializeElevenLabs().catch(console.error);
  }, [initializeElevenLabs]);

  function handleTranscript(text: string) {
    setTranscript(prev => prev + ' ' + text);
    setLastCustomerMessage(text);
    
    // Auto-generate insights based on transcript
    analyzeConversation(text);
  }

  const toggleListening = async () => {
    try {
      if (isRecording) {
        stopRecording();
        setCurrentInsights([]);
      } else {
        await startRecording();
        toast.success(isSystemAudioEnabled ? 
          'Listening to system audio and microphone' : 
          'Listening to microphone only');
      }
    } catch (error) {
      toast.error('Failed to start audio capture');
      console.error('Audio capture error:', error);
    }
  };

  const analyzeConversation = useCallback(async (text: string) => {
    try {
      // Use intelligent conversation analyzer instead of simple keywords
      const insights = await conversationAnalyzer.analyzeConversation(text);
      
      // Add insights to current list
      setCurrentInsights(prev => [...prev, ...insights]);
      
      // Trigger voice coaching for high-priority insights
      if (isVoiceCoachingEnabled) {
        const criticalInsight = insights.find(insight => insight.priority === 'critical');
        const highPriorityInsight = insights.find(insight => insight.priority === 'high');
        
        const targetInsight = criticalInsight || highPriorityInsight;
        if (targetInsight) {
          const coachingResponse = conversationAnalyzer.getSmartCoachingResponse(targetInsight);
          await speakCoaching(coachingResponse, { agentType: 'sales', whisperMode: true });
        }
      }
    } catch (error) {
      console.error('Conversation analysis error:', error);
      // Fallback to simple analysis
      const simpleInsights = getSimpleInsights(text);
      setCurrentInsights(prev => [...prev, ...simpleInsights]);
    }
  }, [isVoiceCoachingEnabled, speakCoaching]);

  const getSimpleInsights = (text: string): CallInsight[] => {
    const insights: CallInsight[] = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('expensive')) {
      insights.push({
        type: 'objection',
        title: 'Price Concern',
        message: 'Customer mentioned pricing',
        action: 'Focus on value and ROI',
        confidence: 0.8,
        priority: 'high'
      });
    }

    if (lowerText.includes('when can') || lowerText.includes('timeline') || lowerText.includes('start')) {
      insights.push({
        type: 'buying_signal',
        title: 'Timeline Interest',
        message: 'Customer asking about implementation',
        action: 'Provide clear timeline and next steps',
        confidence: 0.9,
        priority: 'critical'
      });
    }

    return insights;
  };

  const handleGenerateQuote = async () => {
    try {
      const conversationContext = conversationAnalyzer.getConversationContext();
      
      const intelligentQuote = await intelligentQuoteGenerator.generateIntelligentQuote({
        conversationContext: transcript,
        customerInfo: {
          company: 'Current Call Customer',
          industry: 'Technology',
          size: 'medium'
        },
        callNotes,
        detectedNeeds: conversationContext.customerMentions.painPoints,
        timeline: conversationContext.customerMentions.timeline,
        budget: conversationContext.customerMentions.budget
      });
      
      if (intelligentQuote.type === 'gamma_presentation') {
        toast.success('Professional presentation generated! 🎯');
        setCallNotes(prev => prev + `\n\n📊 Gamma Presentation Generated: ${intelligentQuote.content.title}\n🔗 Share URL: ${intelligentQuote.content.shareUrl}\n🎯 Confidence: ${Math.round(intelligentQuote.confidenceScore * 100)}%\n💡 Recommendations: ${intelligentQuote.recommendations.join(', ')}`);
      } else {
        toast.success('Intelligent quote generated! 🎯');
        setCallNotes(prev => prev + `\n\n💰 Smart Quote #${intelligentQuote.id}: $${intelligentQuote.content.summary.total.toLocaleString()}\n🎯 Confidence: ${Math.round(intelligentQuote.confidenceScore * 100)}%\n📋 Next Actions: ${intelligentQuote.nextActions.join(', ')}`);
      }
      
    } catch (error) {
      toast.error('Failed to generate quote');
      console.error('Quote generation error:', error);
    }
  };

  const handleScheduleFollowUp = () => {
    const followUpNote = `Follow-up scheduled based on call with: ${lastCustomerMessage || 'customer needs'}`;
    setCallNotes(prev => prev + '\n\n' + followUpNote);
    toast.success('Follow-up reminder added to notes');
  };

  const handleSendResources = () => {
    const resourceNote = `Sent relevant resources to customer based on: ${lastCustomerMessage || 'call discussion'}`;
    setCallNotes(prev => prev + '\n\n' + resourceNote);
    toast.success('Resource sharing noted');
  };

  const handleTransferToManager = () => {
    const transferNote = `Escalated to manager - Customer needs: ${lastCustomerMessage || 'management consultation'}`;
    setCallNotes(prev => prev + '\n\n' + transferNote);
    toast.success('Manager notified');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'objection': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'next_step': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'buying_signal': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'objection': return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
      case 'next_step': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'warning': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'buying_signal': return 'border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900';
      case 'risk': return 'border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Call Assistant</h2>
        <p className="text-muted-foreground">Real-time voice coaching and insights during sales calls</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enhanced Call Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Live Call Analysis
            </CardTitle>
            <CardDescription>
              AI listens to your calls and provides real-time coaching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  onClick={toggleListening}
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className="min-w-48"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-6 h-6 mr-2" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6 mr-2" />
                      Start Call Assistant
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => setIsVoiceCoachingEnabled(!isVoiceCoachingEnabled)}
                  variant={isVoiceCoachingEnabled ? "default" : "outline"}
                  size="sm"
                >
                  {isVoiceCoachingEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Voice Coaching ON
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Voice Coaching OFF
                    </>
                  )}
                </Button>
              </div>
              
              {isRecording && (
                <Alert className="w-full max-w-md mb-4">
                  <div className="flex items-center">
                    {isSystemAudioEnabled ? (
                      <Monitor className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Mic className="h-4 w-4 mr-2 text-blue-500" />
                    )}
                    <AlertDescription>
                      {isSystemAudioEnabled 
                        ? "AI is listening to system audio + microphone"
                        : "AI is listening to microphone only"
                      }
                      {isAICoaching && " • AI is coaching"}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              
              {transcript && (
                <div className="w-full max-w-md p-3 bg-muted rounded-md text-sm">
                  <strong>Live Transcript:</strong>
                  <p className="mt-1">{transcript.slice(-200)}...</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Quick Notes</label>
              <Textarea
                placeholder="AI insights and key points will be added here automatically..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Real-time Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Insights</CardTitle>
            <CardDescription>
              AI-powered suggestions based on conversation analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {insight.priority && (
                          <Badge 
                            variant={insight.priority === 'critical' ? 'destructive' : insight.priority === 'high' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {insight.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
                      {insight.confidence && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Confidence: {Math.round(insight.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                  {insight.action && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        💡 {insight.action}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
              
              {currentInsights.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start listening to see AI insights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            AI-powered actions during and after calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleGenerateQuote}
              disabled={!lastCustomerMessage && !callNotes}
            >
              <FileText className="w-4 h-4" />
              Generate Quote
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleScheduleFollowUp}
            >
              <Calendar className="w-4 h-4" />
              Schedule Follow-up
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleSendResources}
            >
              <Users className="w-4 h-4" />
              Send Resources
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleTransferToManager}
            >
              <Phone className="w-4 h-4" />
              Transfer to Manager
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
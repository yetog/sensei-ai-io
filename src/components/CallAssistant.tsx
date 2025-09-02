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
import { quoteGenerator } from '@/services/quoteGenerator';
import { toast } from 'sonner';

interface CallInsight {
  type: 'opportunity' | 'objection' | 'next_step' | 'warning';
  title: string;
  message: string;
  action?: string;
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
    // Simple keyword-based analysis for real-time insights
    const insights: CallInsight[] = [];
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('expensive')) {
      insights.push({
        type: 'objection',
        title: 'Price Objection Detected',
        message: 'Customer mentioned pricing concerns',
        action: 'Focus on value and ROI'
      });
      
      if (isVoiceCoachingEnabled) {
        await generateQuickResponse('price_objection', 'sales');
      }
    }
    
    if (lowerText.includes('team') || lowerText.includes('people') || lowerText.includes('employees')) {
      insights.push({
        type: 'opportunity',
        title: 'Team Size Opportunity',
        message: 'Customer mentioned team size',
        action: 'Ask about enterprise needs'
      });
    }
    
    if (lowerText.includes('demo') || lowerText.includes('show me') || lowerText.includes('see it')) {
      insights.push({
        type: 'next_step',
        title: 'Demo Request',
        message: 'Customer wants to see the product',
        action: 'Schedule technical demonstration'
      });
    }
    
    if (lowerText.includes('not sure') || lowerText.includes('think about') || lowerText.includes('maybe')) {
      insights.push({
        type: 'warning',
        title: 'Hesitation Detected',
        message: 'Customer seems uncertain',
        action: 'Address concerns and build confidence'
      });
    }
    
    setCurrentInsights(prev => [...prev, ...insights]);
  }, [isVoiceCoachingEnabled, generateQuickResponse]);

  const handleGenerateQuote = async () => {
    try {
      const quote = await quoteGenerator.generateQuote({
        customerInfo: {
          company: 'Current Call Customer',
          industry: 'Technology',
          size: 'medium',
          needs: [lastCustomerMessage || callNotes]
        },
        products: ['hosting', 'domain'],
        timeline: 'Immediate',
        additionalNotes: callNotes
      });
      
      toast.success('Quote generated successfully!');
      
      // Add to call notes
      setCallNotes(prev => prev + `\n\nGenerated Quote #${quote.id}: $${quote.total.toFixed(2)}`);
      
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
      case 'warning': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'objection': return 'border-orange-200 bg-orange-50';
      case 'next_step': return 'border-blue-200 bg-blue-50';
      case 'warning': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
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
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
                    </div>
                  </div>
                  {insight.action && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
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
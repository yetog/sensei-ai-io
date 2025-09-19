import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Phone,
  Brain,
  Target,
  TrendingUp,
  Mic,
  MicOff,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Star,
  PlayCircle,
  PauseCircle,
  FileText,
  MessageSquare,
  Zap,
  Settings
} from 'lucide-react';
import { useRealTimeCoaching } from '@/hooks/useRealTimeCoaching';
import { ConversationSimulator } from './ConversationSimulator';
import { LiveTranscriptionPanel } from './LiveTranscriptionPanel';

interface SalesAssistantDashboardProps {
  className?: string;
}

const DEMO_INSIGHTS = [
  {
    type: 'objection' as const,
    title: 'Price Objection Detected',
    message: 'Customer mentioned "too expensive". Try the ROI calculator approach.',
    confidence: 0.85,
    actionable: true
  },
  {
    type: 'opportunity' as const,
    title: 'Buying Signal',
    message: 'Customer asked about implementation timeline - they\'re ready to move forward.',
    confidence: 0.92,
    actionable: true
  },
  {
    type: 'suggestion' as const,
    title: 'Next Best Action',
    message: 'Reference the TechCorp case study - similar company size and challenges.',
    confidence: 0.78,
    actionable: true
  }
];

export function SalesAssistantDashboard({ className = '' }: SalesAssistantDashboardProps) {
  const [callProgress, setCallProgress] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [simulatedTranscript, setSimulatedTranscript] = useState('');
  const [simulatedInsights, setSimulatedInsights] = useState<any[]>([]);
  
  const {
    isActive: coachingActive,
    insights,
    startCoaching,
    stopCoaching,
    currentCall,
    isListening,
    isRecording,
    transcription,
    simulateTranscription,
    addInsight
  } = useRealTimeCoaching({
    agentType: 'sales',
    enableVoiceCoaching: true,
    whisperMode: true,
    autoRespond: false
  });

  // Simulate call progress for demo
  useEffect(() => {
    if (coachingActive && callProgress < 100) {
      const timer = setInterval(() => {
        setCallProgress(prev => Math.min(prev + 1, 100));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [coachingActive, callProgress]);

  const handleStartDemo = (type: string) => {
    setActiveDemo(type);
    setDemoMode(false);
    setSimulatedInsights([]);
    setSimulatedTranscript('');
    startCoaching();
  };

  const handleSimulatedTranscript = (text: string, speaker: 'rep' | 'customer') => {
    const fullText = `[${speaker}] ${text}`;
    setSimulatedTranscript(prev => prev + (prev ? '\n' : '') + fullText);
    simulateTranscription(text);
  };

  const handleSimulatedInsight = (insight: any) => {
    setSimulatedInsights(prev => [...prev, insight]);
    addInsight(insight);
  };

  const callStage = callProgress < 20 ? 'Opening' : 
                   callProgress < 50 ? 'Discovery' :
                   callProgress < 80 ? 'Presentation' : 'Closing';

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'objection': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'opportunity': return <Target className="h-4 w-4 text-green-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const displayInsights = insights.length > 0 ? insights.slice(-3) : 
                        simulatedInsights.length > 0 ? simulatedInsights.slice(-3) : 
                        DEMO_INSIGHTS;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Sales Call Assistant</h1>
            <p className="text-muted-foreground">Real-time coaching to help you close more deals</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            <Brain className="h-4 w-4 mr-2" />
            AI-Powered
          </Badge>
        </div>

        {/* Call Workflow Indicator */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Sales Call Workflow</span>
              <span className="text-xs text-muted-foreground">
                {coachingActive ? 'Live Session' : 'Ready to Start'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${callProgress >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${callProgress >= 0 ? 'bg-primary' : 'bg-muted'}`} />
                <span className="text-sm">Pre-call</span>
              </div>
              <div className={`flex items-center space-x-2 ${callProgress >= 20 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${callProgress >= 20 ? 'bg-primary' : 'bg-muted'}`} />
                <span className="text-sm">Discovery</span>
              </div>
              <div className={`flex items-center space-x-2 ${callProgress >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${callProgress >= 50 ? 'bg-primary' : 'bg-muted'}`} />
                <span className="text-sm">Presentation</span>
              </div>
              <div className={`flex items-center space-x-2 ${callProgress >= 80 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${callProgress >= 80 ? 'bg-primary' : 'bg-muted'}`} />
                <span className="text-sm">Closing</span>
              </div>
            </div>
            {coachingActive && (
              <Progress value={callProgress} className="mt-3 h-2" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Live Coaching */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Demo Conversation Simulator or Live Transcription */}
          {demoMode && !coachingActive ? (
            <ConversationSimulator 
              onTranscriptUpdate={handleSimulatedTranscript}
              onInsightGenerated={handleSimulatedInsight}
              isActive={coachingActive}
            />
          ) : (
            <LiveTranscriptionPanel 
              isRecording={isRecording}
              isListening={isListening}
              transcription={transcription || simulatedTranscript}
              onStartRecording={startCoaching}
              onStopRecording={stopCoaching}
              isActive={coachingActive}
              audioLevel={0.7}
            />
          )}

          {/* Live Coaching Status */}
          <Card className={coachingActive ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Coaching Status
                {coachingActive && (
                  <Badge variant="default" className="animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2" />
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {!coachingActive ? (
                <div className="text-center py-6">
                  <div className="space-y-4">
                    <div className="text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>AI Coaching is ready to assist</p>
                      <p className="text-sm mt-2">Start a call or demo to see real-time insights</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                      <Button onClick={() => handleStartDemo('live')} className="flex-1">
                        <Mic className="h-4 w-4 mr-2" />
                        Start Live Call
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setDemoMode(true);
                          setActiveDemo(null);
                        }}
                        className="flex-1"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Try Demo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Processing Flow */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <div>
                        <div className="text-sm font-medium">Listening</div>
                        <div className="text-xs text-muted-foreground">Speech Detection</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${transcription ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                      <div>
                        <div className="text-sm font-medium">Transcribing</div>
                        <div className="text-xs text-muted-foreground">Speech-to-Text</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${insights.length > 0 || simulatedInsights.length > 0 ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`} />
                      <div>
                        <div className="text-sm font-medium">Analyzing</div>
                        <div className="text-xs text-muted-foreground">AI Insights</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{callStage} Stage</Badge>
                      <span className="text-sm text-muted-foreground">
                        {activeDemo === 'demo' ? 'Demo Mode' : 'Live Call'}
                      </span>
                    </div>
                    <Button onClick={stopCoaching} variant="destructive" size="sm">
                      <PauseCircle className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights & Suggestions
                {displayInsights.length > 0 && (
                  <Badge variant="secondary">{displayInsights.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayInsights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>AI insights will appear here during your call</p>
                  <p className="text-sm mt-2">Start a call to see real-time suggestions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{insight.title || `${insight.type} Insight`}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round((insight.confidence || 0.8) * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.message}</p>
                          {insight.actionable && (
                            <Button size="sm" variant="outline" className="mt-2">
                              Apply Suggestion
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Stats & Tools */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Calls Made</span>
                  <span className="font-medium">7</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">AI Suggestions</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Close Rate</span>
                  <span className="font-medium text-green-600">42%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Call Time</span>
                  <span className="font-medium">8:30</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>+15% improvement this week</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Battle Cards
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Objection Library
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Customer Stories
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Star className="h-4 w-4 mr-2" />
                ROI Calculator
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Call completed with TechCorp</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>AI suggested pricing strategy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span>Objection handled successfully</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
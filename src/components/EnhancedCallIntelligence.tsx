import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Zap
} from 'lucide-react';
import { specializedAgents } from '@/services/specializedAgents';
import { CallContext } from '@/types/agent';
import { toast } from 'sonner';

interface LiveInsight {
  id: string;
  type: 'opportunity' | 'objection' | 'next_step' | 'warning' | 'buying_signal';
  title: string;
  message: string;
  agentType: 'sales' | 'retention' | 'technical';
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  actionable: boolean;
  suggestedResponse?: string;
}

interface AgentPerformance {
  agentId: string;
  experienceLevel: 'new' | 'intermediate' | 'senior';
  currentScore: number;
  improvements: string[];
  strengths: string[];
  recommendedTraining: string[];
}

interface EnhancedCallIntelligenceProps {
  transcript: string;
  isActive: boolean;
  onInsightGenerated?: (insight: LiveInsight) => void;
}

export function EnhancedCallIntelligence({ 
  transcript, 
  isActive, 
  onInsightGenerated 
}: EnhancedCallIntelligenceProps) {
  const [activeAgent, setActiveAgent] = useState<'sales' | 'retention' | 'technical'>('sales');
  const [liveInsights, setLiveInsights] = useState<LiveInsight[]>([]);
  const [callContext, setCallContext] = useState<CallContext>({
    agentExperience: 'intermediate',
    callType: 'inbound',
    currentStage: 'discovery'
  });
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance>({
    agentId: 'current-agent',
    experienceLevel: 'intermediate',
    currentScore: 75,
    improvements: [],
    strengths: [],
    recommendedTraining: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Enhanced conversation analysis with specialized agents
  const analyzeWithSpecializedAgent = useCallback(async (text: string) => {
    if (!text.trim() || !isActive) return;

    setIsAnalyzing(true);
    try {
      // Detect agent experience level from conversation patterns
      const conversationHistory = text.split('\n').filter(Boolean);
      const detectedExperience = specializedAgents.detectAgentExperience(conversationHistory);
      
      // Update call context
      const updatedContext: CallContext = {
        ...callContext,
        agentExperience: detectedExperience
      };
      setCallContext(updatedContext);

      // Get specialized response from current active agent
      const specializedResponse = await specializedAgents.getSpecializedResponse(
        activeAgent,
        text,
        updatedContext,
        conversationHistory
      );

      // Generate live insight from specialized response
      const insight: LiveInsight = {
        id: `insight-${Date.now()}`,
        type: specializedResponse.confidence > 0.8 ? 'opportunity' : 'next_step',
        title: `${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Insight`,
        message: specializedResponse.response,
        agentType: activeAgent,
        confidence: specializedResponse.confidence,
        priority: specializedResponse.confidence > 0.8 ? 'high' : 'medium',
        timestamp: new Date(),
        actionable: specializedResponse.nextActions.length > 0,
        suggestedResponse: specializedResponse.nextActions[0]
      };

      setLiveInsights(prev => [insight, ...prev.slice(0, 9)]); // Keep last 10 insights
      onInsightGenerated?.(insight);

      // Update agent performance
      setAgentPerformance(prev => ({
        ...prev,
        experienceLevel: detectedExperience,
        improvements: specializedResponse.insights,
        recommendedTraining: specializedResponse.nextActions
      }));

      toast.success(`${activeAgent} insight generated`, {
        description: `Confidence: ${Math.round(specializedResponse.confidence * 100)}%`
      });

    } catch (error) {
      console.error('Enhanced analysis error:', error);
      toast.error('Analysis failed - using fallback');
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeAgent, callContext, isActive, onInsightGenerated]);

  // Auto-analyze when transcript updates
  useEffect(() => {
    if (transcript && isActive) {
      const debounceTimer = setTimeout(() => {
        analyzeWithSpecializedAgent(transcript);
      }, 2000); // Debounce to avoid too frequent analysis

      return () => clearTimeout(debounceTimer);
    }
  }, [transcript, analyzeWithSpecializedAgent, isActive]);

  const getAgentIcon = (agentType: 'sales' | 'retention' | 'technical') => {
    const icons = {
      sales: <Target className="h-4 w-4" />,
      retention: <Users className="h-4 w-4" />,
      technical: <Brain className="h-4 w-4" />
    };
    return icons[agentType];
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      opportunity: <TrendingUp className="h-4 w-4 text-green-500" />,
      objection: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      next_step: <Lightbulb className="h-4 w-4 text-blue-500" />,
      warning: <AlertTriangle className="h-4 w-4 text-red-500" />,
      buying_signal: <CheckCircle className="h-4 w-4 text-green-600" />
    };
    return icons[type as keyof typeof icons] || <Brain className="h-4 w-4" />;
  };

  const getExperienceColor = (level: string) => {
    const colors = {
      new: 'text-red-600 bg-red-50 border-red-200',
      intermediate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      senior: 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[level as keyof typeof colors] || colors.intermediate;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Enhanced Call Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeAgent} onValueChange={(value) => setActiveAgent(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sales" className="flex items-center gap-2">
                {getAgentIcon('sales')}
                Sales AI
              </TabsTrigger>
              <TabsTrigger value="retention" className="flex items-center gap-2">
                {getAgentIcon('retention')}
                Retention AI
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-2">
                {getAgentIcon('technical')}
                Technical AI
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              {/* Agent Status */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getAgentIcon(activeAgent)}
                    <span className="font-medium">
                      {activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Specialist
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getExperienceColor(callContext.agentExperience)}
                  >
                    {callContext.agentExperience} level
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
                      Analyzing...
                    </div>
                  )}
                  <Badge variant="secondary">
                    <Award className="h-3 w-3 mr-1" />
                    {agentPerformance.currentScore}%
                  </Badge>
                </div>
              </div>

              {/* Live Insights */}
              <TabsContent value={activeAgent} className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Live Insights & Coaching
                </h4>
                
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {liveInsights
                    .filter(insight => insight.agentType === activeAgent)
                    .map((insight) => (
                    <Alert key={insight.id} className="p-3">
                      <div className="flex items-start gap-2">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{insight.title}</h5>
                            <Badge 
                              variant={insight.priority === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {Math.round(insight.confidence * 100)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {insight.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <AlertDescription className="text-sm">
                            {insight.message}
                          </AlertDescription>
                          {insight.suggestedResponse && (
                            <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                              <strong>Suggested action:</strong> {insight.suggestedResponse}
                            </div>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                  
                  {liveInsights.filter(insight => insight.agentType === activeAgent).length === 0 && (
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertDescription>
                        {isActive 
                          ? "AI is listening and ready to provide insights..."
                          : "Start call assistant to begin receiving live insights"
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const greeting = specializedAgents.getRandomGreeting(activeAgent);
                      toast.success(greeting);
                    }}
                  >
                    Get Greeting
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const starters = specializedAgents.getConversationStarters(activeAgent);
                      const randomStarter = starters[Math.floor(Math.random() * starters.length)];
                      toast.info(randomStarter);
                    }}
                  >
                    Conversation Starter
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Agent Performance & Coaching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{agentPerformance.currentScore}%</div>
                <div className="text-sm text-muted-foreground">Performance Score</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{liveInsights.length}</div>
                <div className="text-sm text-muted-foreground">Insights Generated</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{agentPerformance.improvements.length}</div>
                <div className="text-sm text-muted-foreground">Improvement Areas</div>
              </div>
            </div>

            {agentPerformance.improvements.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Key Insights:</h5>
                <div className="space-y-1">
                  {agentPerformance.improvements.slice(0, 3).map((improvement, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Lightbulb className="h-3 w-3" />
                      {improvement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agentPerformance.recommendedTraining.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Recommended Actions:</h5>
                <div className="space-y-1">
                  {agentPerformance.recommendedTraining.slice(0, 3).map((training, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      {training}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
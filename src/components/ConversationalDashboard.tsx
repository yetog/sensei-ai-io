import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Clock,
  Star,
  BarChart3
} from 'lucide-react';
import { VoiceAgent } from './VoiceAgent';
import { AgentConfig } from '@/types/agent';

interface ConversationMetrics {
  totalSessions: number;
  averageSessionLength: number;
  topInsights: string[];
  agentPerformance: Record<string, number>;
  recentSessions: Array<{
    id: string;
    agentType: string;
    duration: number;
    insights: number;
    timestamp: Date;
  }>;
}

interface ConversationalDashboardProps {
  className?: string;
  onAgentActiveChange?: (isActive: boolean) => void;
}

export const ConversationalDashboard: React.FC<ConversationalDashboardProps> = ({ 
  className = "",
  onAgentActiveChange
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | undefined>();
  const [metrics, setMetrics] = useState<ConversationMetrics>({
    totalSessions: 47,
    averageSessionLength: 8.5,
    topInsights: [
      "Sales reps using voice coaching close 23% more deals",
      "Most effective coaching happens during objection handling",
      "Technical explanations improve when using voice agent guidance"
    ],
    agentPerformance: {
      sales: 4.2,
      retention: 4.5,
      technical: 4.1
    },
    recentSessions: [
      {
        id: '1',
        agentType: 'sales',
        duration: 12.3,
        insights: 8,
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: '2',
        agentType: 'retention',
        duration: 6.7,
        insights: 5,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
      }
    ]
  });

  const agentConfigs: AgentConfig[] = [
    {
      id: 'sales-agent-1',
      name: 'Roger - Sales Coach',
      systemPrompt: 'Expert sales coaching agent',
      agentType: 'outbound',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      specialization: {
        industry: 'B2B Software',
        products: ['CRM', 'Analytics'],
        expertise: ['Objection Handling', 'Closing Techniques']
      }
    },
    {
      id: 'retention-agent-1',
      name: 'Aria - Retention Specialist',
      systemPrompt: 'Customer retention and success expert',
      agentType: 'retention',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      specialization: {
        industry: 'SaaS',
        products: ['Support Tools'],
        expertise: ['De-escalation', 'Customer Success']
      }
    },
    {
      id: 'technical-agent-1',
      name: 'Sarah - Technical Advisor',
      systemPrompt: 'Technical solutions and product expert',
      agentType: 'telesales',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      specialization: {
        industry: 'Technology',
        products: ['APIs', 'Integrations'],
        expertise: ['Technical Demos', 'Solution Architecture']
      }
    }
  ];

  const formatDuration = (minutes: number) => {
    return `${Math.floor(minutes)}m ${Math.round((minutes % 1) * 60)}s`;
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return '💼';
      case 'retention': return '🤝';
      case 'technical': return '⚙️';
      default: return '🤖';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Voice Coaching Dashboard</h2>
        <Badge variant="secondary" className="px-3 py-1">
          <Brain className="h-3 w-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live">Live Coaching</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Top Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent Selection */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Voice Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {agentConfigs.map((agent) => (
                    <Card 
                      key={agent.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedAgent?.id === agent.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <CardContent className="p-4">
                        <div className="text-center space-y-2">
                          <div className="text-2xl">
                            {getAgentTypeIcon(agent.agentType || 'sales')}
                          </div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <Badge className="text-xs">
                            {agent.agentType?.toUpperCase()}
                          </Badge>
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {metrics.agentPerformance[agent.agentType || 'sales']}/5.0
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Voice Agent Component */}
            <VoiceAgent 
              agentConfig={selectedAgent}
              className="self-start"
            />
          </div>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Coaching Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {metrics.recentSessions.map((session) => (
                    <div 
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg">
                          {getAgentTypeIcon(session.agentType)}
                        </div>
                        <div>
                          <div className="font-medium capitalize">
                            {session.agentType} Session
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDuration(session.duration)} • {session.insights} insights
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalSessions}</div>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Length</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(metrics.averageSessionLength)}</div>
                <p className="text-xs text-muted-foreground">Optimal engagement time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Voice Agent Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  4.3
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-xs text-muted-foreground">Based on user feedback</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Agent Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.agentPerformance).map(([agentType, rating]) => (
                  <div key={agentType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{agentType} Agent</span>
                      <span className="flex items-center gap-1">
                        {rating}
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(rating / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topInsights.map((insight, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                      <p className="text-sm leading-relaxed">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
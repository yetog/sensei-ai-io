import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Zap
} from 'lucide-react';
import { enhancedAgentService } from '@/services/enhancedAgentService';
import { agentService } from '@/services/agentService';

export function AgentDashboard() {
  const [boardData, setBoardData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const boardPresentationData = enhancedAgentService.getBoardPresentationData();
    const performanceMetrics = enhancedAgentService.getAgentPerformanceMetrics();
    const allAgents = agentService.list();

    setBoardData(boardPresentationData);
    setMetrics(performanceMetrics);
    setAgents(allAgents);
  };

  const initializeSpecializedAgents = async () => {
    setIsInitializing(true);
    try {
      await enhancedAgentService.initializeSpecializedAgents();
      loadDashboardData();
    } catch (error) {
      console.error('Failed to initialize agents:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  if (!boardData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  const hasSpecializedAgents = agents.some(agent => agent.agentType);

  return (
    <div className="space-y-6">
      {/* Header with Action */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">Sensei AI Dashboard</h2>
          <p className="text-muted-foreground">Performance metrics and agent overview</p>
        </div>
        {!hasSpecializedAgents && (
          <Button 
            onClick={initializeSpecializedAgents}
            disabled={isInitializing}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isInitializing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Initializing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Initialize Specialized Agents
              </>
            )}
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boardData.agentOverview.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {boardData.agentOverview.specializedAgents} specialized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boardData.usageStats.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              {boardData.usageStats.dailyActiveUsers} daily avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boardData.usageStats.averageHelpfulRate}%</div>
            <p className="text-xs text-muted-foreground">
              Agent satisfaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(boardData.usageStats.timesSaved / 60)}h</div>
            <p className="text-xs text-muted-foreground">
              {boardData.usageStats.timesSaved} minutes total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="agents">Agent Details</TabsTrigger>
          <TabsTrigger value="competitive">ROI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Top Performing Objections
                </CardTitle>
                <CardDescription>
                  Most effective responses by success rate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {boardData.performanceMetrics.topPerformingObjections.map((objection: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{objection.objection}</p>
                      <p className="text-xs text-muted-foreground">{objection.context}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {objection.helpfulPercentage}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Improvement Opportunities
                </CardTitle>
                <CardDescription>
                  Objections needing attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {boardData.performanceMetrics.improvementOpportunities.map((objection: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{objection.objection}</p>
                      <Badge variant="destructive">
                        {objection.helpfulPercentage}%
                      </Badge>
                    </div>
                    <Progress value={objection.helpfulPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Common issues: {objection.commonIssues.join(', ')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {agents.map((agent) => {
              const metric = metrics.find(m => m.agentId === agent.id);
              return (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription>{agent.systemPrompt.slice(0, 100)}...</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {agent.agentType && (
                          <Badge variant="secondary">{agent.agentType}</Badge>
                        )}
                        <Badge variant="outline">
                          {metric ? `${metric.successRate}%` : 'New'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Interactions</p>
                        <p className="font-semibold">{metric?.totalInteractions || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-semibold">{metric?.successRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Response Time</p>
                        <p className="font-semibold">{metric?.averageResponseTime || 0}s</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Active</p>
                        <p className="font-semibold">
                          {metric ? new Date(metric.lastActivity).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    {metric?.topObjectionsHandled.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Top Objections Handled:</p>
                        <div className="flex flex-wrap gap-1">
                          {metric.topObjectionsHandled.slice(0, 3).map((objection: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {objection.slice(0, 30)}...
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis: Sensei AI vs XO Partner Solution</CardTitle>
                <CardDescription>
                  Competitive analysis for board presentation (Oct 15)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-green-600">Sensei AI (Internal)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Implementation Time:</span>
                        <span className="font-medium">2 weeks</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Cost:</span>
                        <span className="font-medium">$0 (internal)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customization:</span>
                        <span className="font-medium">100% IONOS-specific</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Scalability:</span>
                        <span className="font-medium">Unlimited agents</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-orange-600">XO Partner Solution</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Implementation Time:</span>
                        <span className="font-medium">3+ months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Cost:</span>
                        <span className="font-medium">$50-100/agent</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customization:</span>
                        <span className="font-medium">Limited/Generic</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Scalability:</span>
                        <span className="font-medium">Per-seat pricing</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Financial Impact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${boardData.competitiveAnalysis.roi.monthlySavings}
                        </div>
                        <p className="text-sm text-green-700">Monthly Savings</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {boardData.usageStats.timesSaved}min
                        </div>
                        <p className="text-sm text-blue-700">Time Saved</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {boardData.usageStats.averageHelpfulRate}%
                        </div>
                        <p className="text-sm text-purple-700">Agent Satisfaction</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
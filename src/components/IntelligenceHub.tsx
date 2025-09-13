import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EnhancedCallIntelligence } from '@/components/EnhancedCallIntelligence';
import { ObjectionHandler } from '@/components/ObjectionHandler';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Activity,
  Lightbulb,
  Target,
  AlertTriangle 
} from 'lucide-react';

interface IntelligenceHubProps {
  callTranscript?: string;
  isCallActive?: boolean;
  className?: string;
}

export function IntelligenceHub({ 
  callTranscript = '', 
  isCallActive = false, 
  className = '' 
}: IntelligenceHubProps) {
  const [activeInsights, setActiveInsights] = useState<Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    confidence: number;
    timestamp: Date;
    actionable: boolean;
  }>>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<any[]>([]);
  const [recentObjections, setRecentObjections] = useState<any[]>([]);

  // Mock real-time insights
  useEffect(() => {
    const insights = [
      {
        id: 1,
        type: 'opportunity',
        title: 'Upsell Opportunity Detected',
        description: 'Customer mentioned scaling challenges - suggest enterprise plan',
        confidence: 0.89,
        timestamp: new Date(),
        actionable: true
      },
      {
        id: 2,
        type: 'risk',
        title: 'Price Sensitivity Alert',
        description: 'Multiple cost-related concerns raised',
        confidence: 0.76,
        timestamp: new Date(),
        actionable: true
      },
      {
        id: 3,
        type: 'success',
        title: 'Strong Engagement Signal',
        description: 'Customer asking detailed implementation questions',
        confidence: 0.94,
        timestamp: new Date(),
        actionable: false
      }
    ];
    setActiveInsights(insights);

    const alerts = [
      {
        id: 1,
        type: 'warning',
        message: 'Response time 20% above target',
        metric: 'responseTime',
        value: 3.6,
        target: 3.0
      },
      {
        id: 2,
        type: 'success',
        message: 'Quote conversion rate improving',
        metric: 'conversion',
        value: 22,
        target: 18
      }
    ];
    setPerformanceAlerts(alerts);
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-4 w-4 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightVariant = (type: string) => {
    switch (type) {
      case 'opportunity': return 'default';
      case 'risk': return 'destructive';
      case 'success': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Real-time Intelligence Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Active Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{activeInsights.length}</div>
            <div className="text-sm text-muted-foreground">
              {activeInsights.filter(i => i.actionable).length} actionable
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Call Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {isCallActive ? 'Live' : 'Idle'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {isCallActive ? 'Analyzing in real-time' : 'Ready for next call'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-green-600">+15%</div>
            <div className="text-sm text-muted-foreground">vs last week</div>
          </CardContent>
        </Card>
      </div>

      {/* Live Insights */}
      {activeInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Live Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeInsights.map(insight => (
                <div key={insight.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge variant={getInsightVariant(insight.type)} className="text-xs">
                          {Math.round(insight.confidence * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{(insight as any).description || 'No description available'}</p>
                    </div>
                  </div>
                  {insight.actionable && (
                    <Button size="sm" variant="outline">Act</Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="calls" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calls">Call Intelligence</TabsTrigger>
          <TabsTrigger value="objections">Objection Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="mt-6">
          <EnhancedCallIntelligence 
            transcript={callTranscript}
            isActive={isCallActive}
            onInsightGenerated={(insight) => {
              setActiveInsights(prev => [
                {
                  id: Date.now(),
                  type: insight.agentType,
                  title: insight.title,
                  description: insight.description,
                  confidence: insight.confidence || 0.8,
                  timestamp: new Date(),
                  actionable: true
                },
                ...prev.slice(0, 4)
              ]);
            }}
          />
        </TabsContent>

        <TabsContent value="objections" className="mt-6">
          <ObjectionHandler />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceDashboard 
            userKPIs={{ 
              responseTime: 2.5, 
              pitchQuality: 85, 
              quotesSent: 12, 
              conversionRate: 18 
            }}
            teamAverage={{ 
              responseTime: 3.2, 
              pitchQuality: 75, 
              quotesSent: 8, 
              conversionRate: 15 
            }}
            period="daily"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
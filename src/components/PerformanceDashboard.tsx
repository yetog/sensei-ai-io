import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Brain, 
  Mic, 
  Wifi,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import { performanceProfiler } from '@/services/performanceProfiler';
import { smartCache } from '@/services/smartCache';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Initial load
      refreshData();
      
      // Start real-time monitoring
      const interval = performanceProfiler.startRealTimeMonitoring((data) => {
        setInsights(data);
        setCacheStats(smartCache.getStats());
      }, 3000);
      
      setMonitoringInterval(interval);
    } else {
      // Stop monitoring when hidden
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        setMonitoringInterval(null);
      }
    }

    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [isVisible]);

  const refreshData = () => {
    setInsights(performanceProfiler.getPerformanceInsights());
    setCacheStats(smartCache.getStats());
  };

  const handleExportData = () => {
    const data = {
      performance: performanceProfiler.exportData(),
      cache: cacheStats,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transcription': return <Mic className="h-4 w-4" />;
      case 'ai_processing': return <Brain className="h-4 w-4" />;
      case 'ui_render': return <Activity className="h-4 w-4" />;
      case 'network': return <Wifi className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  if (!isVisible || !insights) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Analytics Dashboard
              <Badge variant="outline" className="ml-2">
                Real-time
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={refreshData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button onClick={handleExportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
              <TabsTrigger value="cache">Smart Cache</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Total Operations</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {insights.totalOperations}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Critical Issues</span>
                    </div>
                    <div className="text-2xl font-bold mt-1 text-red-600">
                      {insights.criticalCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {insights.trends.isImproving ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">Performance</span>
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${insights.trends.isImproving ? 'text-green-600' : 'text-red-600'}`}>
                      {insights.trends.performanceChange > 0 ? '+' : ''}{insights.trends.performanceChange.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Cache Hit Rate</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {cacheStats?.hitRate ? `${(cacheStats.hitRate * 100).toFixed(1)}%` : '0%'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(insights.categoryStats).map(([category, stats]: [string, any]) => (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(category)}
                          <div>
                            <div className="font-medium capitalize">{category.replace('_', ' ')}</div>
                            <div className="text-sm text-muted-foreground">
                              {stats.count} operations
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {stats.averageDuration.toFixed(0)}ms avg
                          </div>
                          <Badge variant={stats.exceedsThreshold > 0 ? "destructive" : "secondary"} className="text-xs">
                            {stats.exceedsThreshold} over threshold
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bottlenecks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Bottlenecks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {insights.bottlenecks.map((bottleneck: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{bottleneck.operation}</div>
                            <Badge 
                              variant="outline" 
                              className={getSeverityColor(bottleneck.severity)}
                            >
                              {bottleneck.severity}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-2">
                            <div>Avg: {bottleneck.averageDuration.toFixed(0)}ms</div>
                            <div>Max: {bottleneck.maxDuration.toFixed(0)}ms</div>
                            <div>Frequency: {bottleneck.frequency}x</div>
                          </div>
                          <div className="text-sm bg-muted p-2 rounded">
                            {bottleneck.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Global Recommendations */}
              {insights.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Priority Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {insights.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cache" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cache Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Cache Size:</span>
                      <span className="font-medium">{cacheStats?.size || 0} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Hits:</span>
                      <span className="font-medium">{cacheStats?.totalHits || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span className="font-medium">
                        {cacheStats?.hitRate ? `${(cacheStats.hitRate * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Age:</span>
                      <span className="font-medium">{cacheStats?.averageAgeMinutes || 0} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Patterns:</span>
                      <span className="font-medium">{cacheStats?.patternCount || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cacheStats?.topPatterns?.map((pattern: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {pattern.keywords.slice(0, 3).join(', ')}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {pattern.frequency}x
                          </Badge>
                        </div>
                      )) || <div className="text-sm text-muted-foreground">No patterns detected yet</div>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold mb-1">
                        {insights.trends.operationCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Operations (24h)
                      </div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold mb-1 ${insights.trends.isImproving ? 'text-green-600' : 'text-red-600'}`}>
                        {insights.trends.performanceChange > 0 ? '+' : ''}{insights.trends.performanceChange.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Performance Change
                      </div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold mb-1">
                        {insights.trends.isImproving ? '📈' : '📉'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {insights.trends.isImproving ? 'Improving' : 'Declining'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
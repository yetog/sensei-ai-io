import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Brain, Clock } from 'lucide-react';

interface PerformanceStats {
  averageTranscriptionLatency: number;
  averageAIProcessingTime: number;
  totalEndToEndLatency: number;
  transcriptionCount: number;
  aiRequestCount: number;
}

interface PerformanceMonitorProps {
  stats: PerformanceStats;
  isUsingWhisper: boolean;
  onLogReport: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  stats,
  isUsingWhisper,
  onLogReport
}) => {
  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getLatencyColor = (ms: number, threshold: number) => {
    if (ms < threshold * 0.5) return 'bg-green-500/20 text-green-700 border-green-500/30';
    if (ms < threshold) return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    return 'bg-red-500/20 text-red-700 border-red-500/30';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Performance Monitor
          <Badge 
            variant={isUsingWhisper ? "default" : "secondary"}
            className="ml-auto"
          >
            {isUsingWhisper ? 'Whisper' : 'Browser STT'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">STT Latency</span>
            </div>
            <Badge 
              variant="outline" 
              className={getLatencyColor(stats.averageTranscriptionLatency, 1000)}
            >
              {formatLatency(stats.averageTranscriptionLatency)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-3 w-3 text-purple-500" />
              <span className="text-xs font-medium">AI Processing</span>
            </div>
            <Badge 
              variant="outline" 
              className={getLatencyColor(stats.averageAIProcessingTime, 2000)}
            >
              {formatLatency(stats.averageAIProcessingTime)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-medium">End-to-End</span>
            </div>
            <Badge 
              variant="outline" 
              className={getLatencyColor(stats.totalEndToEndLatency, 3000)}
            >
              {formatLatency(stats.totalEndToEndLatency)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-green-500" />
              <span className="text-xs font-medium">Requests</span>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">
              {stats.transcriptionCount}/{stats.aiRequestCount}
            </Badge>
          </div>
        </div>

        <div className="pt-2 border-t">
          <button
            onClick={onLogReport}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View detailed performance report in console
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
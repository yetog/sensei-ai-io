import { useState, useRef, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  details?: Record<string, any>;
}

interface PerformanceStats {
  averageTranscriptionLatency: number;
  averageAIProcessingTime: number;
  totalEndToEndLatency: number;
  transcriptionCount: number;
  aiRequestCount: number;
  lastMetrics: PerformanceMetric[];
}

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const timingRef = useRef<Map<string, number>>(new Map());

  const startTiming = useCallback((name: string, details?: Record<string, any>) => {
    const timestamp = performance.now();
    timingRef.current.set(name, timestamp);
    console.log(`⏱️ Started timing: ${name}`, details);
  }, []);

  const endTiming = useCallback((name: string, details?: Record<string, any>) => {
    const endTime = performance.now();
    const startTime = timingRef.current.get(name);
    
    if (startTime) {
      const duration = endTime - startTime;
      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: endTime,
        details
      };
      
      setMetrics(prev => [...prev.slice(-49), metric]); // Keep last 50 metrics
      timingRef.current.delete(name);
      
      console.log(`⏱️ Completed timing: ${name} - ${duration.toFixed(2)}ms`, details);
      return duration;
    }
    
    console.warn(`⏱️ No start time found for: ${name}`);
    return 0;
  }, []);

  const getStats = useCallback((): PerformanceStats => {
    const transcriptionMetrics = metrics.filter(m => m.name.includes('transcription'));
    const aiMetrics = metrics.filter(m => m.name.includes('ai_processing'));
    const endToEndMetrics = metrics.filter(m => m.name.includes('end_to_end'));

    return {
      averageTranscriptionLatency: transcriptionMetrics.length > 0 
        ? transcriptionMetrics.reduce((sum, m) => sum + m.duration, 0) / transcriptionMetrics.length 
        : 0,
      averageAIProcessingTime: aiMetrics.length > 0
        ? aiMetrics.reduce((sum, m) => sum + m.duration, 0) / aiMetrics.length
        : 0,
      totalEndToEndLatency: endToEndMetrics.length > 0
        ? endToEndMetrics.reduce((sum, m) => sum + m.duration, 0) / endToEndMetrics.length
        : 0,
      transcriptionCount: transcriptionMetrics.length,
      aiRequestCount: aiMetrics.length,
      lastMetrics: metrics.slice(-10)
    };
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    timingRef.current.clear();
  }, []);

  const logPerformanceReport = useCallback(() => {
    const stats = getStats();
    console.group('🚀 Performance Report');
    console.log('📊 Transcription Latency:', `${stats.averageTranscriptionLatency.toFixed(2)}ms avg`);
    console.log('🤖 AI Processing Time:', `${stats.averageAIProcessingTime.toFixed(2)}ms avg`);
    console.log('🎯 End-to-End Latency:', `${stats.totalEndToEndLatency.toFixed(2)}ms avg`);
    console.log('📈 Request Counts:', `${stats.transcriptionCount} transcriptions, ${stats.aiRequestCount} AI requests`);
    console.table(stats.lastMetrics);
    console.groupEnd();
  }, [getStats]);

  return {
    startTiming,
    endTiming,
    getStats,
    clearMetrics,
    logPerformanceReport,
    metrics
  };
};
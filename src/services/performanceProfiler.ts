interface PerformanceProfile {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  stackTrace?: string;
  memoryUsage?: number;
  category: 'transcription' | 'ai_processing' | 'ui_render' | 'cache' | 'network' | 'audio';
}

interface BottleneckDetection {
  operation: string;
  averageDuration: number;
  maxDuration: number;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

class PerformanceProfiler {
  private profiles = new Map<string, PerformanceProfile>();
  private completedProfiles: PerformanceProfile[] = [];
  private bottlenecks: BottleneckDetection[] = [];
  private thresholds = {
    transcription: 500, // ms
    ai_processing: 2000, // ms
    ui_render: 16, // ms (60fps)
    cache: 10, // ms
    network: 5000, // ms
    audio: 100 // ms
  };

  private autoDetectionEnabled = true;
  private readonly MAX_PROFILES = 1000;

  startProfile(operation: string, category: PerformanceProfile['category'], metadata?: Record<string, any>): string {
    const profileId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const profile: PerformanceProfile = {
      operation,
      startTime: performance.now(),
      category,
      metadata,
      memoryUsage: this.getMemoryUsage(),
      stackTrace: this.autoDetectionEnabled ? new Error().stack : undefined
    };

    this.profiles.set(profileId, profile);
    return profileId;
  }

  endProfile(profileId: string, additionalMetadata?: Record<string, any>): PerformanceProfile | null {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const endTime = performance.now();
    const duration = endTime - profile.startTime;

    const completedProfile: PerformanceProfile = {
      ...profile,
      endTime,
      duration,
      metadata: { ...profile.metadata, ...additionalMetadata }
    };

    this.profiles.delete(profileId);
    this.completedProfiles.push(completedProfile);

    // Auto-detect bottlenecks
    if (this.autoDetectionEnabled) {
      this.checkForBottleneck(completedProfile);
    }

    // Cleanup old profiles
    if (this.completedProfiles.length > this.MAX_PROFILES) {
      this.completedProfiles = this.completedProfiles.slice(-this.MAX_PROFILES / 2);
    }

    return completedProfile;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private checkForBottleneck(profile: PerformanceProfile) {
    if (!profile.duration) return;

    const threshold = this.thresholds[profile.category];
    if (profile.duration > threshold) {
      this.updateBottleneckDetection(profile);
    }
  }

  private updateBottleneckDetection(profile: PerformanceProfile) {
    const existingBottleneck = this.bottlenecks.find(b => b.operation === profile.operation);
    
    if (existingBottleneck) {
      existingBottleneck.frequency++;
      existingBottleneck.maxDuration = Math.max(existingBottleneck.maxDuration, profile.duration!);
      
      // Recalculate average
      const relevantProfiles = this.completedProfiles
        .filter(p => p.operation === profile.operation && p.duration)
        .slice(-10); // Last 10 occurrences
      
      existingBottleneck.averageDuration = relevantProfiles.reduce((sum, p) => sum + p.duration!, 0) / relevantProfiles.length;
    } else {
      const newBottleneck: BottleneckDetection = {
        operation: profile.operation,
        averageDuration: profile.duration!,
        maxDuration: profile.duration!,
        frequency: 1,
        severity: this.calculateSeverity(profile.duration!, profile.category),
        recommendation: this.generateRecommendation(profile)
      };
      
      this.bottlenecks.push(newBottleneck);
    }

    // Update severity for existing bottlenecks
    if (existingBottleneck) {
      existingBottleneck.severity = this.calculateSeverity(existingBottleneck.averageDuration, profile.category);
      existingBottleneck.recommendation = this.generateRecommendation(profile);
    }
  }

  private calculateSeverity(duration: number, category: PerformanceProfile['category']): BottleneckDetection['severity'] {
    const threshold = this.thresholds[category];
    const ratio = duration / threshold;

    if (ratio >= 5) return 'critical';
    if (ratio >= 3) return 'high';
    if (ratio >= 2) return 'medium';
    return 'low';
  }

  private generateRecommendation(profile: PerformanceProfile): string {
    const { category, operation, duration } = profile;

    switch (category) {
      case 'transcription':
        if (duration! > 1000) {
          return 'Consider switching to local Whisper.cpp or optimizing audio chunk size';
        }
        return 'Optimize audio preprocessing and reduce API roundtrips';

      case 'ai_processing':
        if (duration! > 3000) {
          return 'Implement response streaming and use lighter local models';
        }
        return 'Add request queuing and implement caching for common patterns';

      case 'ui_render':
        return 'Optimize React renders with useMemo/useCallback and virtualization';

      case 'cache':
        return 'Review cache lookup algorithms and consider LRU optimization';

      case 'network':
        return 'Implement request batching, retries, and fallback mechanisms';

      case 'audio':
        return 'Optimize audio buffer sizes and processing intervals';

      default:
        return 'Profile this operation for specific optimization opportunities';
    }
  }

  // Get performance insights
  getPerformanceInsights() {
    const recentProfiles = this.completedProfiles.slice(-100);
    
    const categoryStats = this.calculateCategoryStats(recentProfiles);
    const criticalBottlenecks = this.bottlenecks.filter(b => b.severity === 'critical' || b.severity === 'high');
    const performanceTrends = this.calculateTrends(recentProfiles);

    return {
      totalOperations: recentProfiles.length,
      categoryStats,
      bottlenecks: this.bottlenecks.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      criticalCount: criticalBottlenecks.length,
      trends: performanceTrends,
      recommendations: this.generateGlobalRecommendations(criticalBottlenecks)
    };
  }

  private calculateCategoryStats(profiles: PerformanceProfile[]) {
    const stats: Record<string, any> = {};
    
    for (const category of Object.keys(this.thresholds)) {
      const categoryProfiles = profiles.filter(p => p.category === category && p.duration);
      
      if (categoryProfiles.length > 0) {
        const durations = categoryProfiles.map(p => p.duration!);
        stats[category] = {
          count: categoryProfiles.length,
          averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          threshold: this.thresholds[category as keyof typeof this.thresholds],
          exceedsThreshold: durations.filter(d => d > this.thresholds[category as keyof typeof this.thresholds]).length
        };
      }
    }
    
    return stats;
  }

  private calculateTrends(profiles: PerformanceProfile[]) {
    const last24h = profiles.filter(p => p.startTime > Date.now() - 24 * 60 * 60 * 1000);
    const previous24h = profiles.filter(p => 
      p.startTime > Date.now() - 48 * 60 * 60 * 1000 && 
      p.startTime <= Date.now() - 24 * 60 * 60 * 1000
    );

    const currentAvg = last24h.reduce((sum, p) => sum + (p.duration || 0), 0) / last24h.length;
    const previousAvg = previous24h.reduce((sum, p) => sum + (p.duration || 0), 0) / previous24h.length;

    return {
      performanceChange: previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0,
      operationCount: last24h.length,
      isImproving: currentAvg < previousAvg
    };
  }

  private generateGlobalRecommendations(criticalBottlenecks: BottleneckDetection[]): string[] {
    const recommendations = [];

    if (criticalBottlenecks.some(b => b.operation.includes('transcription'))) {
      recommendations.push('🎯 Priority: Upgrade to local Whisper.cpp WebAssembly for transcription');
    }

    if (criticalBottlenecks.some(b => b.operation.includes('ai'))) {
      recommendations.push('🧠 Implement local AI models with WebGPU acceleration');
    }

    if (criticalBottlenecks.some(b => b.operation.includes('render'))) {
      recommendations.push('⚡ Optimize React component rendering with memoization');
    }

    if (criticalBottlenecks.length > 3) {
      recommendations.push('🏗️ Consider architectural refactoring for better performance');
    }

    return recommendations;
  }

  // Real-time monitoring
  startRealTimeMonitoring(callback: (insights: any) => void, interval: number = 5000) {
    return setInterval(() => {
      const insights = this.getPerformanceInsights();
      callback(insights);
    }, interval);
  }

  // Export performance data
  exportData() {
    return {
      profiles: this.completedProfiles,
      bottlenecks: this.bottlenecks,
      thresholds: this.thresholds,
      exportTime: Date.now()
    };
  }

  // Clear all data
  clear() {
    this.profiles.clear();
    this.completedProfiles = [];
    this.bottlenecks = [];
  }

  // Enable/disable auto-detection
  setAutoDetection(enabled: boolean) {
    this.autoDetectionEnabled = enabled;
  }
}

export const performanceProfiler = new PerformanceProfiler();
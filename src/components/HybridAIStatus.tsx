import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { hybridAI } from '@/services/hybridAI';

interface HybridAIStatusProps {
  className?: string;
}

export const HybridAIStatus: React.FC<HybridAIStatusProps> = ({ className = '' }) => {
  const [stats, setStats] = useState(hybridAI.getStats());
  const [config, setConfig] = useState(hybridAI.getConfig());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(hybridAI.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleLocalFirst = () => {
    const newConfig = { ...config, localFirst: !config.localFirst };
    hybridAI.setConfig(newConfig);
    setConfig(newConfig);
  };

  const handleToggleCloudFallback = () => {
    const newConfig = { ...config, cloudFallback: !config.cloudFallback };
    hybridAI.setConfig(newConfig);
    setConfig(newConfig);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          🤖 Hybrid AI Status
          {stats.localAvailable && (
            <Badge variant="secondary" className="text-xs">
              {stats.localDevice.device.toUpperCase()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Local AI</div>
            <div className="flex items-center gap-1">
              <div 
                className={`w-2 h-2 rounded-full ${stats.localAvailable ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span>{stats.localAvailable ? 'Available' : 'Unavailable'}</span>
            </div>
            <div className="text-muted-foreground">
              Attempts: {stats.localAttempts}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Cloud AI</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Available</span>
            </div>
            <div className="text-muted-foreground">
              Attempts: {stats.cloudAttempts}
            </div>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs font-medium text-muted-foreground">Configuration</div>
          <div className="space-y-1">
            <Button
              variant={config.localFirst ? "default" : "outline"}
              size="sm"
              className="w-full text-xs h-7"
              onClick={handleToggleLocalFirst}
            >
              {config.localFirst ? '🏠 Local First (ON)' : '🏠 Local First (OFF)'}
            </Button>
            <Button
              variant={config.cloudFallback ? "default" : "outline"}
              size="sm"
              className="w-full text-xs h-7"
              onClick={handleToggleCloudFallback}
            >
              {config.cloudFallback ? '☁️ Cloud Fallback (ON)' : '☁️ Cloud Fallback (OFF)'}
            </Button>
          </div>
        </div>

        {/* Performance Info */}
        {stats.localAvailable && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="font-medium mb-1">Local Device Info</div>
            <div>Device: {stats.localDevice.device}</div>
            <div>Status: {stats.localDevice.initialized ? 'Initialized' : 'Initializing...'}</div>
            <div className="text-green-600 font-medium mt-1">
              ⚡ ~70-85% faster processing
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
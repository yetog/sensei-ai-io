import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield } from 'lucide-react';

interface SafeModeToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  transcriptCount: number;
  sessionDuration: number;
}

export function SafeModeToggle({ 
  isEnabled, 
  onToggle, 
  transcriptCount, 
  sessionDuration 
}: SafeModeToggleProps) {
  const shouldSuggestSafeMode = transcriptCount > 50 && sessionDuration < 30000;

  return (
    <Card className={`border-2 ${shouldSuggestSafeMode ? 'border-amber-500 bg-amber-50' : 'border-border'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {isEnabled ? (
            <>
              <Shield className="h-4 w-4 text-green-600" />
              Safe Mode Active
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Safe Mode Available
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {shouldSuggestSafeMode && !isEnabled && (
          <div className="text-xs text-amber-800 bg-amber-100 p-2 rounded border border-amber-300">
            ⚠️ High duplicate activity detected! ({transcriptCount} transcripts in {Math.round(sessionDuration/1000)}s)
            <br />
            Safe Mode can help prevent duplicates.
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          {isEnabled ? (
            <>
              <p className="mb-2">Safe Mode is protecting your session:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Manual transcription only</li>
                <li>5-second minimum between transcripts</li>
                <li>Aggressive duplicate blocking</li>
              </ul>
            </>
          ) : (
            <>
              <p className="mb-2">Enable Safe Mode if you experience:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Duplicate transcripts</li>
                <li>Speech recognition issues on custom domain</li>
                <li>Too many suggestions at once</li>
              </ul>
            </>
          )}
        </div>
        
        <Button 
          onClick={onToggle}
          variant={isEnabled ? "default" : "outline"}
          className="w-full"
          size="sm"
        >
          {isEnabled ? (
            <>
              <Shield className="h-3 w-3 mr-1" />
              Disable Safe Mode
            </>
          ) : (
            <>
              <Shield className="h-3 w-3 mr-1" />
              Enable Safe Mode
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

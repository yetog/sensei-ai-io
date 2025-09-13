import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGenesysIntegration } from '@/services/genesysIntegration';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Wifi, 
  WifiOff, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface GenesysConnectionPanelProps {
  className?: string;
}

export const GenesysConnectionPanel: React.FC<GenesysConnectionPanelProps> = ({ 
  className = '' 
}) => {
  const { 
    connection, 
    currentCall, 
    audioLevel, 
    connectToGenesys, 
    startCall, 
    endCall, 
    disconnect,
    isListening 
  } = useGenesysIntegration();

  const [config, setConfig] = useState({
    clientId: '',
    environment: 'mypurecloud.com',
    redirectUri: window.location.origin
  });

  const [showConfig, setShowConfig] = useState(false);

  const getStatusIcon = () => {
    switch (connection.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connection.status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleConnect = async () => {
    if (!config.clientId) {
      alert('Please enter your Genesys Client ID');
      return;
    }
    
    await connectToGenesys(config);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Genesys Integration
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">
              {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
            </span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            {connection.isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>

        {/* Configuration Panel */}
        {showConfig && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="clientId">Genesys Client ID</Label>
              <Input
                id="clientId"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                placeholder="Enter your Genesys Cloud Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Input
                id="environment"
                value={config.environment}
                onChange={(e) => setConfig({ ...config, environment: e.target.value })}
                placeholder="e.g., mypurecloud.com"
              />
            </div>
          </div>
        )}

        {/* Connection Actions */}
        {!connection.isConnected ? (
          <Button 
            onClick={handleConnect} 
            className="w-full"
            disabled={connection.status === 'connecting'}
          >
            {connection.status === 'connecting' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Connect to Genesys
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            {!currentCall ? (
              <Button onClick={startCall} className="w-full">
                <PhoneCall className="h-4 w-4 mr-2" />
                Start Call Monitoring
              </Button>
            ) : (
              <Button onClick={endCall} variant="destructive" className="w-full">
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call Monitoring
              </Button>
            )}
            
            <Button onClick={disconnect} variant="outline" className="w-full">
              Disconnect
            </Button>
          </div>
        )}

        {/* Call Information */}
        {currentCall && (
          <div className="space-y-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Call</span>
              <Badge variant="secondary">{currentCall.participantData.direction}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <div>Customer: {currentCall.participantData.customerPhoneNumber}</div>
              <div>Purpose: {currentCall.participantData.purpose}</div>
            </div>
            
            {/* Audio Level Indicator */}
            {isListening && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Audio Level</span>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Setup Instructions */}
        {!connection.isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              To connect Sensei AI to Genesys Cloud, you'll need your Client ID from the Genesys Cloud admin panel.
              Contact your IT administrator if you don't have access.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
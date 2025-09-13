import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff,
  Settings,
  Brain,
  MessageSquare
} from 'lucide-react';
import { useConversationalAI } from '@/hooks/useConversationalAI';
import { AgentConfig } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';

interface VoiceAgentProps {
  agentConfig?: AgentConfig;
  className?: string;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ 
  agentConfig, 
  className = "" 
}) => {
  const { toast } = useToast();
  const [agentId, setAgentId] = useState<string>('');
  const [volume, setVolume] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const {
    isActive,
    currentAgentId,
    conversationHistory,
    isSpeaking,
    status,
    startConversation,
    endConversation,
    setVolume: setConversationVolume,
    voicePersonalities
  } = useConversationalAI({
    agentConfig,
    onMessage: (message, role) => {
      setMessages(prev => [...prev, { role, content: message }]);
    },
    onInsight: (insight) => {
      setInsights(prev => [...prev.slice(-4), insight]); // Keep last 5 insights
      toast({
        title: "💡 Coaching Insight",
        description: insight,
        duration: 5000,
      });
    }
  });

  useEffect(() => {
    setConversationVolume(volume);
  }, [volume, setConversationVolume]);

  const handleStartConversation = async () => {
    try {
      const agentType = agentConfig?.agentType || 'sales';
      await startConversation(agentType);
      
      toast({
        title: "🎙️ Voice Agent Active",
        description: `${voicePersonalities[agentType]?.firstMessage || 'Ready to assist you!'}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the voice agent. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEndConversation = async () => {
    await endConversation();
    toast({
      title: "Conversation Ended",
      description: "Voice coaching session has been ended.",
    });
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'retention': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'technical': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const agentType = agentConfig?.agentType || 'sales';
  const personality = voicePersonalities[agentType];

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Voice Agent
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getAgentTypeColor(agentType)}>
            {agentType.toUpperCase()}
          </Badge>
          <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
            {status || 'disconnected'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showSettings && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label>Volume: {Math.round(volume * 100)}%</Label>
              <Slider
                value={[volume]}
                onValueChange={([value]) => setVolume(value)}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
            <Separator />
          </div>
        )}

        {/* Connection Controls */}
        <div className="flex gap-2">
          {!isActive ? (
            <Button 
              onClick={handleStartConversation}
              className="flex-1"
              disabled={false}
            >
              <Phone className="h-4 w-4 mr-2" />
              Start Coaching
            </Button>
          ) : (
            <Button 
              onClick={handleEndConversation}
              variant="destructive"
              className="flex-1"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Session
            </Button>
          )}
          
          <Button
            variant="outline"
            size="icon"
            disabled={!isActive}
          >
            {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        {/* Status Indicator */}
        {isActive && (
          <div className="flex items-center justify-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">Agent is speaking...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Listening for your voice...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Recent Coaching Insights
            </Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {insights.slice(-3).map((insight, index) => (
                <div 
                  key={index} 
                  className="text-xs p-2 bg-blue-50 dark:bg-blue-950/30 rounded border-l-2 border-blue-500"
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Personality Info */}
        {personality && !isActive && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            <strong>Voice:</strong> {personality.voiceId === 'CwhRBWXzGAHq8TQ4Fs17' ? 'Roger' : 
                                   personality.voiceId === '9BWtsMINqrJLrRacOk9x' ? 'Aria' : 'Sarah'}
            <br />
            <strong>Style:</strong> {agentType === 'sales' ? 'Confident & Persuasive' : 
                                   agentType === 'retention' ? 'Empathetic & Solution-focused' : 
                                   'Technical & Educational'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
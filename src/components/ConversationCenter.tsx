import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chat } from '@/components/Chat';
import { CallAssistant } from '@/components/CallAssistant';
import { ConversationalDashboard } from '@/components/ConversationalDashboard';
import { useRealTimeCoaching } from '@/hooks/useRealTimeCoaching';
import { 
  Headphones,
  Play,
  Square,
  CheckCircle
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';

interface ConversationCenterProps {
  selectedFileIds?: string[];
  className?: string;
}

export function ConversationCenter({ selectedFileIds = [], className = '' }: ConversationCenterProps) {
  const [activeCallDuration, setActiveCallDuration] = useState(0);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const { messages } = useChat();
  
  const {
    isActive: coachingActive,
    insights,
    startCoaching,
    stopCoaching,
    triggerTestInsight,
    currentCall,
    audioLevel
  } = useRealTimeCoaching({
    agentType: 'sales',
    enableVoiceCoaching: true,
    whisperMode: true,
    autoRespond: false
  });

  useEffect(() => {
    if (coachingActive) {
      const interval = setInterval(() => {
        setActiveCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setActiveCallDuration(0);
    }
  }, [coachingActive]);


  return (
    <div className={`space-y-6 ${className}`}>
      {/* Core objection handling interface - demo sections removed for focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Real-Time Coaching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge variant={coachingActive ? "default" : "secondary"}>
                {coachingActive ? "Active" : "Ready"}
              </Badge>
            </div>
            
            {coachingActive && currentCall && (
              <div className="space-y-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                <div className="text-xs text-muted-foreground">Live Call</div>
                <div className="text-sm font-medium">{currentCall.participantData.customerPhoneNumber}</div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!coachingActive ? (
                <Button onClick={startCoaching} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start Coaching
                </Button>
              ) : (
                <Button onClick={stopCoaching} variant="destructive" className="flex-1">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Coaching
                </Button>
              )}
              
              <Button 
                onClick={() => triggerTestInsight('suggestion')} 
                variant="outline"
                size="sm"
              >
                Test
              </Button>
            </div>

            {/* Recent Insights */}
            {insights.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <div className="text-xs font-medium text-muted-foreground">Recent Insights</div>
                {insights.slice(-3).map((insight) => (
                  <div key={insight.id} className="p-2 text-xs bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-1 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {insight.type}
                      </Badge>
                      {insight.spoken && <CheckCircle className="h-3 w-3 text-green-500" />}
                    </div>
                    <div className="text-xs">{insight.message}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversation Tools */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">AI Chat Assistant</TabsTrigger>
          <TabsTrigger value="voice">Voice Coaching</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="h-[600px]">
            <Chat selectedFileIds={selectedFileIds} className="h-full" />
          </div>
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <ConversationalDashboard className="h-full" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
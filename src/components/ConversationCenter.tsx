import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chat } from '@/components/Chat';
import { CallAssistant } from '@/components/CallAssistant';
import { ConversationalDashboard } from '@/components/ConversationalDashboard';
import { 
  MessageSquare, 
  Phone, 
  Mic, 
  Activity,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';

interface ConversationCenterProps {
  selectedFileIds?: string[];
  className?: string;
}

export function ConversationCenter({ selectedFileIds = [], className = '' }: ConversationCenterProps) {
  const [activeCallDuration, setActiveCallDuration] = useState(0);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [voiceCoachingActive, setVoiceCoachingActive] = useState(false);
  const { messages } = useChat();

  // Mock call statistics
  const callStats = {
    totalToday: 8,
    avgDuration: '12:34',
    successRate: 75,
    voiceCoachingMinutes: 45
  };

  const recentCalls = [
    {
      id: 1,
      contact: 'Sarah Johnson',
      company: 'TechCorp Inc',
      duration: '15:23',
      outcome: 'Proposal Sent',
      score: 85,
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: 2,
      contact: 'Mike Chen',
      company: 'InnovateLab',
      duration: '8:45',
      outcome: 'Follow-up Scheduled',
      score: 72,
      timestamp: new Date(Date.now() - 1000 * 60 * 120)
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Conversation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Chat Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{messages.length}</div>
            <div className="text-sm text-muted-foreground">This session</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Calls Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{callStats.totalToday}</div>
            <div className="text-sm text-muted-foreground">{callStats.avgDuration} avg</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-green-600">{callStats.successRate}%</div>
            <div className="text-sm text-muted-foreground">+5% vs yesterday</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              Voice Coaching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${voiceCoachingActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {voiceCoachingActive ? 'Active' : 'Ready'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">{callStats.voiceCoachingMinutes}m today</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Call Activity */}
      {recentCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Call Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCalls.map(call => (
                <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{call.contact}</h4>
                      <p className="text-sm text-muted-foreground">{call.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{call.duration}</div>
                      <div className="text-xs text-muted-foreground">
                        {call.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Badge variant={call.score >= 80 ? 'default' : call.score >= 70 ? 'secondary' : 'outline'}>
                      {call.score}
                    </Badge>
                    <div className="text-sm text-muted-foreground min-w-[100px]">
                      {call.outcome}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Tools */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">AI Chat Assistant</TabsTrigger>
          <TabsTrigger value="calls">Call Manager</TabsTrigger>
          <TabsTrigger value="voice">Voice Coaching</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="h-[600px]">
            <Chat selectedFileIds={selectedFileIds} className="h-full" />
          </div>
        </TabsContent>

        <TabsContent value="calls" className="mt-6">
          <CallAssistant />
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <ConversationalDashboard 
            onAgentActiveChange={setVoiceCoachingActive}
            className="h-full"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chat } from '@/components/Chat';
import { ConversationalDashboard } from '@/components/ConversationalDashboard';
import { SalesAssistantDashboard } from '@/components/SalesAssistantDashboard';
import { CallPreparationPanel } from '@/components/CallPreparationPanel';
import { useRealTimeCoaching } from '@/hooks/useRealTimeCoaching';
import { 
  Target,
  Phone,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';

interface ConversationCenterProps {
  selectedFileIds?: string[];
  className?: string;
}

export function ConversationCenter({ selectedFileIds = [], className = '' }: ConversationCenterProps) {
  const [activeTab, setActiveTab] = useState('preparation');
  const { messages } = useChat();
  
  const {
    startCoaching
  } = useRealTimeCoaching({
    agentType: 'sales',
    enableVoiceCoaching: true,
    whisperMode: true,
    autoRespond: false
  });

  const handleCallReady = () => {
    setActiveTab('live-coaching');
    startCoaching();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Sales-Focused Workflow */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="preparation" className="flex items-center gap-2 px-3 py-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Call Prep</span>
          </TabsTrigger>
          <TabsTrigger value="live-coaching" className="flex items-center gap-2 px-3 py-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Live Coaching</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2 px-3 py-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">AI Chat</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2 px-3 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Voice Tools</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preparation" className="mt-6">
          <CallPreparationPanel onCallReady={handleCallReady} />
        </TabsContent>

        <TabsContent value="live-coaching" className="mt-6">
          <SalesAssistantDashboard />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <div className="h-[700px]">
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
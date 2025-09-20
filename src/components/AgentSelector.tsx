import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Brain, Target, Shield, PhoneCall, Settings } from 'lucide-react';
import { AgentConfig } from '@/types/agent';
import { agentService } from '@/services/agentService';

interface AgentSelectorProps {
  selectedAgentId?: string;
  onAgentSelect: (agentId: string | null) => void;
  callType: 'incoming_sales' | 'retention' | 'outbound' | 'general';
  isListening: boolean;
}

const getCallTypeIcon = (callType: string) => {
  switch (callType) {
    case 'incoming_sales': return <Target className="h-4 w-4" />;
    case 'retention': return <Shield className="h-4 w-4" />;
    case 'outbound': return <PhoneCall className="h-4 w-4" />;
    default: return <Brain className="h-4 w-4" />;
  }
};

const getCallTypeColor = (callType: string) => {
  switch (callType) {
    case 'incoming_sales': return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'retention': return 'bg-purple-50 border-purple-200 text-purple-700';
    case 'outbound': return 'bg-green-50 border-green-200 text-green-700';
    default: return 'bg-gray-50 border-gray-200 text-gray-700';
  }
};

export function AgentSelector({ selectedAgentId, onAgentSelect, callType, isListening }: AgentSelectorProps) {
  const agents = agentService.list();
  const selectedAgent = selectedAgentId ? agentService.get(selectedAgentId) : null;

  // Filter agents by call type or show all if none match
  const relevantAgents = agents.filter(agent => {
    const agentName = agent.name.toLowerCase();
    switch (callType) {
      case 'incoming_sales':
        return agentName.includes('sales') || agentName.includes('closing');
      case 'retention':
        return agentName.includes('retention') || agentName.includes('support');
      case 'outbound':
        return agentName.includes('outbound') || agentName.includes('prospecting');
      default:
        return true;
    }
  });

  const agentsToShow = relevantAgents.length > 0 ? relevantAgents : agents;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Agent Selection
          <Badge variant="outline" className={getCallTypeColor(callType)}>
            {getCallTypeIcon(callType)}
            {callType.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Select 
            value={selectedAgentId || "none"} 
            onValueChange={(value) => onAgentSelect(value === "none" ? null : value)}
            disabled={isListening}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose coaching agent..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-400" />
                  <span>Generic Coaching</span>
                </div>
              </SelectItem>
              {agentsToShow.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    {getCallTypeIcon(callType)}
                    <span className="font-medium">{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAgent && (
            <div className="text-xs text-muted-foreground p-2 bg-accent/50 rounded">
              <p className="font-medium">Active Agent: {selectedAgent.name}</p>
              <p className="truncate">{selectedAgent.systemPrompt.substring(0, 120)}...</p>
            </div>
          )}

          {agentsToShow.length === 0 && (
            <div className="text-xs text-amber-600 p-2 bg-amber-50 rounded border border-amber-200">
              No specialized agents found for {callType}. Create agents in the Agents tab.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
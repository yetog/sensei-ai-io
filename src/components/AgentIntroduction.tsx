import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, FileText, Database } from 'lucide-react';
import { AgentConfig } from '@/types/agent';
import { agentTrainingService } from '@/services/agentTrainingService';
import { datasetService } from '@/services/datasetService';

interface AgentIntroductionProps {
  agent: AgentConfig;
  onStarterClick: (starter: string) => void;
  onClose: () => void;
}

export const AgentIntroduction: React.FC<AgentIntroductionProps> = ({
  agent,
  onStarterClick,
  onClose
}) => {
  const [personality, setPersonality] = useState(agentTrainingService.getAgentPersonality(agent.id));
  const [datasets, setDatasets] = useState<Array<{ name: string; fileCount: number }>>([]);

  useEffect(() => {
    // Load agent datasets
    if (agent.datasetIds && agent.datasetIds.length > 0) {
      const agentDatasets = agent.datasetIds
        .map(id => datasetService.get(id))
        .filter(Boolean)
        .map(dataset => ({
          name: dataset.name,
          fileCount: dataset.fileIds.length
        }));
      setDatasets(agentDatasets);
    }
  }, [agent.datasetIds]);

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/10 border-primary/20 shadow-lg animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="w-8 h-8 text-primary" />
            <Sparkles className="w-3 h-3 text-primary/60 absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {personality.responseStyle.tone} • {personality.responseStyle.formality}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <p className="text-muted-foreground mb-4 leading-relaxed">
        {personality.greetingMessage}
      </p>

      {/* Capabilities */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <Sparkles className="w-4 h-4 mr-1 text-primary" />
          I can help you with:
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {personality.helpTopics.map((topic, index) => (
            <div key={index} className="flex items-center text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
              {topic}
            </div>
          ))}
        </div>
      </div>

      {/* Available Datasets */}
      {datasets.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Database className="w-4 h-4 mr-1 text-primary" />
            Available Knowledge:
          </h4>
          <div className="space-y-1">
            {datasets.map((dataset, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-muted/30 rounded px-2 py-1">
                <span className="text-foreground">{dataset.name}</span>
                <Badge variant="outline" className="text-xs">
                  {dataset.fileCount} files
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Starters */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Try asking:</h4>
        <div className="grid grid-cols-1 gap-2">
          {personality.conversationStarters.slice(0, 4).map((starter, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="justify-start text-left h-auto py-2 px-3 hover:bg-primary/10 hover:border-primary/30"
              onClick={() => {
                onStarterClick(starter);
                onClose();
              }}
            >
              <span className="text-xs text-muted-foreground mr-2">💬</span>
              <span className="text-sm">{starter}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Click any suggestion above to get started, or type your own question below.
        </p>
      </div>
    </Card>
  );
};
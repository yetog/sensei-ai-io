
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle, MessageSquare, Zap } from 'lucide-react';

interface ScriptAIToolbarProps {
  script: string;
  onQuickAction: (action: string) => void;
  onToggleChat: () => void;
  disabled?: boolean;
}

export const ScriptAIToolbar: React.FC<ScriptAIToolbarProps> = ({
  script,
  onQuickAction,
  onToggleChat,
  disabled = false
}) => {
  const quickActions = [
    {
      label: 'Improve Script',
      action: 'Improve this script for better TTS pronunciation and flow',
      icon: Sparkles
    },
    {
      label: 'Check Flow',
      action: 'Check this script for TTS pronunciation, pacing, and natural flow',
      icon: CheckCircle
    },
    {
      label: 'Make Engaging',
      action: 'Make this script more engaging and compelling for the audience',
      icon: Zap
    }
  ];

  const wordCount = script.trim().split(/\s+/).filter(word => word.length > 0).length;
  const hasScript = script.trim().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-secondary/50 border border-border rounded-lg">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4" />
        <span>AI Assistant:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {quickActions.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onQuickAction(item.action)}
            disabled={disabled || !hasScript}
            className="text-xs"
          >
            <item.icon className="w-3 h-3 mr-1" />
            {item.label}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleChat}
          className="text-xs"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Open Chat
        </Button>
      </div>

      {hasScript && (
        <div className="ml-auto text-xs text-muted-foreground">
          Script loaded ({wordCount} words)
        </div>
      )}
    </div>
  );
};

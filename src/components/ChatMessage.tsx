
import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const downloadImage = () => {
    if (message.imageUrl) {
      const link = document.createElement('a');
      link.href = message.imageUrl;
      link.download = `script-image-${message.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        {message.imageUrl && (
          <div className="mt-3 space-y-2">
            <img 
              src={message.imageUrl} 
              alt="Generated from script" 
              className="max-w-full h-auto rounded-lg border"
            />
            <div className="flex justify-between items-center">
              <Button
                onClick={downloadImage}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
              {message.imagePrompt && (
                <span className="text-xs opacity-70">
                  Prompt: {message.imagePrompt.substring(0, 50)}...
                </span>
              )}
            </div>
          </div>
        )}
        
        <span className="text-xs opacity-70 mt-1 block">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

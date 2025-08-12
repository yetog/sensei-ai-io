
import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Download, FileText, Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Extract file citations from assistant messages
  const extractCitations = (content: string) => {
    const citationRegex = /\[📄([^\]]+)\]/g;
    const citations = [];
    let match;
    
    while ((match = citationRegex.exec(content)) !== null) {
      citations.push(match[1].trim());
    }
    
    return {
      cleanContent: content.replace(citationRegex, '').trim(),
      citations: [...new Set(citations)] // Remove duplicates
    };
  };
  
  const { cleanContent, citations } = !isUser ? extractCitations(message.content) : { cleanContent: message.content, citations: [] };

  const combinedSources = Array.from(new Set([...(message.usedFiles || []), ...(!isUser ? citations : [])]));
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
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          
          <div className={`rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-primary text-primary-foreground ml-2' 
              : 'bg-secondary text-secondary-foreground mr-2'
          }`}>
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {cleanContent}
            </div>
            
            {/* Sources from metadata or inline citations */}
            {combinedSources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center space-x-1 mb-2">
                  <FileText className="w-3 h-3 opacity-60" />
                  <span className="text-xs opacity-60 font-medium">Sources:</span>
                </div>
                <div className="space-y-1">
                  {combinedSources.map((src, index) => (
                    <div key={index} className="text-xs opacity-80 bg-background/20 rounded px-2 py-1">
                      📄 {src}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions when no files matched */}
            {isUser && (!message.usedFiles || message.usedFiles.length === 0) && message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center space-x-1 mb-2">
                  <FileText className="w-3 h-3 opacity-60" />
                  <span className="text-xs opacity-60 font-medium">Did you mean:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {message.suggestions.map((s, i) => (
                    <span key={i} className="text-xs opacity-80 bg-background/20 rounded px-2 py-1">{s}</span>
                  ))}
                </div>
              </div>
            )}
            
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
            
            <div className={`text-xs mt-2 opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

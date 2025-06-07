import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Settings, Send, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/ChatMessage';
import { ionosAI } from '@/services/ionosAI';
import { toast } from 'sonner';

interface ChatBotProps {
  script?: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ script = '' }) => {
  const { messages, isLoading, isOpen, sendMessage, sendQuickAction, generateImage, toggleChat, clearChat } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiToken, setApiToken] = useState(ionosAI.getApiToken() || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue, script);
      setInputValue('');
    }
  };

  const handleQuickAction = (action: string) => {
    sendQuickAction(action, script);
  };

  const handleGenerateImage = () => {
    generateImage(script);
  };

  const handleSaveToken = () => {
    if (apiToken.trim()) {
      ionosAI.setApiToken(apiToken);
      setShowSettings(false);
      toast.success('API token saved successfully');
    } else {
      toast.error('Please enter a valid API token');
    }
  };

  const scriptWordCount = script.trim().split(/\s+/).filter(word => word.length > 0).length;
  const hasScript = script.trim().length > 0;

  const quickPrompts = [
    "Improve this script for better TTS",
    "Make this more engaging", 
    "Check pronunciation and flow",
    "Generate image for this script"
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg pulse-gold"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col shadow-xl border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full pulse-gold"></div>
          <h3 className="font-semibold">AI Assistant</h3>
          {hasScript && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span>{scriptWordCount}w</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleChat}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Script Context Indicator */}
      {hasScript && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center space-x-2 text-xs text-primary">
            <FileText className="w-3 h-3" />
            <span>Script context active ({scriptWordCount} words)</span>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-secondary/50">
          <div className="space-y-3">
            <label className="text-sm font-medium">IONOS API Token:</label>
            <Input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your IONOS API token"
              className="text-xs"
            />
            <div className="flex space-x-2">
              <Button onClick={handleSaveToken} size="sm" className="flex-1">
                Save Token
              </Button>
              <Button onClick={clearChat} variant="outline" size="sm">
                Clear Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm mb-4">
              {hasScript ? 'Ask me about your script!' : 'Add text to your script to get AI assistance!'}
            </p>
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    if (prompt === "Generate image for this script") {
                      handleGenerateImage();
                    } else {
                      handleQuickAction(prompt);
                    }
                  }}
                  disabled={!ionosAI.getApiToken() || !hasScript}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-secondary rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              !ionosAI.getApiToken() 
                ? "Set API token in settings" 
                : hasScript 
                  ? "Ask about your script..." 
                  : "Add script text first..."
            }
            disabled={!ionosAI.getApiToken() || isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || !ionosAI.getApiToken() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

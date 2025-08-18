import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Settings, Send, FileText, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/useChat';
import { useFileContext } from '@/contexts/FileContext';
import { ChatMessage } from '@/components/ChatMessage';
import { ionosAI } from '@/services/ionosAI';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ChatBotProps {
  script?: string;
  projectId?: string;
  selectedFileIds?: string[];
  activeAgentPrompt?: string;
  activeAgentName?: string;
  activeAgentDatasets?: string[];
  onSpeak?: (text: string) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ script = '', projectId, selectedFileIds, activeAgentPrompt, activeAgentName = "AI Assistant", activeAgentDatasets = [], onSpeak }) => {
  const { messages, isLoading, isOpen, sendMessage, sendQuickAction, generateImage, toggleChat, clearChat } = useChat();
  const { files, getRelevantFileContext, getRelevantFileContextDetailed, getContextForFiles } = useFileContext();
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [apiToken, setApiToken] = useState(ionosAI.getApiToken() || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

const handleSendMessage = (e: React.FormEvent) => {
  e.preventDefault();
  if (inputValue.trim() && !isLoading) {
    let context = '';
    let usedFiles: string[] = [];

    if (selectedFileIds && selectedFileIds.length > 0) {
      const res = getContextForFiles(selectedFileIds);
      context = res.context;
      usedFiles = res.files.map(f => f.name);
    } else {
      const detail = getRelevantFileContextDetailed(inputValue);
      context = detail.context;
      usedFiles = detail.files.map(f => f.name);
    }

    const agentContext = activeAgentPrompt ? `${activeAgentPrompt}\n\n` : '';
    sendMessage(inputValue, agentContext + script, context, usedFiles, selectedFileIds && selectedFileIds.length > 0 ? [] : getRelevantFileContextDetailed(inputValue).suggestions, activeAgentName);
    setInputValue('');
  }
};

const handleQuickAction = (action: string) => {
  let context = '';
  let usedFiles: string[] = [];

  if (selectedFileIds && selectedFileIds.length > 0) {
    const res = getContextForFiles(selectedFileIds);
    context = res.context;
    usedFiles = res.files.map(f => f.name);
  } else {
    const detail = getRelevantFileContextDetailed(action);
    context = detail.context;
    usedFiles = detail.files.map(f => f.name);
  }

  const agentContext = activeAgentPrompt ? `${activeAgentPrompt}\n\n` : '';
  sendQuickAction(action, agentContext + script, context, usedFiles, selectedFileIds && selectedFileIds.length > 0 ? [] : getRelevantFileContextDetailed(action).suggestions, activeAgentName);
};

  const handleGenerateImage = async () => {
    console.log('Image generation triggered - showing coming soon message');
    toast.info('Image generation coming soon!');
    // Add a message to the chat as well
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const scriptWordCount = script.trim().split(/\s+/).filter(word => word.length > 0).length;
  const hasScript = script.trim().length > 0;

  const quickPrompts = [
    "Improve this script for better TTS",
    "Make this more engaging", 
    "Check pronunciation and flow",
    "Generate image for this script"
  ];

  // Listen for external quick actions and open requests
  useEffect(() => {
    const openHandler = () => { if (!isOpen) toggleChat(); };
    const actionHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ action: string }>).detail;
      if (detail?.action) {
        if (!isOpen) toggleChat();
        handleQuickAction(detail.action);
      }
    };
    window.addEventListener('chatbot:open', openHandler);
    window.addEventListener('chatbot:action', actionHandler as EventListener);
    return () => {
      window.removeEventListener('chatbot:open', openHandler);
      window.removeEventListener('chatbot:action', actionHandler as EventListener);
    };
  }, [isOpen, toggleChat, handleQuickAction]);

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

  const chatClasses = isFullscreen 
    ? "fixed inset-4 w-auto h-auto max-w-none max-h-none z-50" 
    : "fixed bottom-6 right-6 w-96 h-[500px]";

  return (
    <Card className={`${chatClasses} flex flex-col shadow-xl border-primary/20`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full pulse-gold"></div>
          <h3 className="font-semibold">{activeAgentName}</h3>
          {activeAgentDatasets.length > 0 && (
            <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
              {activeAgentDatasets.length} dataset{activeAgentDatasets.length > 1 ? 's' : ''}
            </div>
          )}
          {(hasScript || files.length > 0) && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {hasScript && (
                <>
                  <FileText className="w-3 h-3" />
                  <span>{scriptWordCount}w</span>
                </>
              )}
              {files.length > 0 && (
                <>
                  <span>•</span>
                  <span>{files.length} files</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
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

      {/* Context Indicators */}
      {(hasScript || files.length > 0) && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center space-x-2 text-xs text-primary">
            <FileText className="w-3 h-3" />
            <div className="flex items-center space-x-3">
              {hasScript && <span>Script: {scriptWordCount} words</span>}
              {files.length > 0 && <span>Files: {files.length} uploaded</span>}
            </div>
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
              {activeAgentPrompt ? 
                `Hi! I'm ${activeAgentName}. How can I assist you today?` :
                'Hi! I\'m your AI assistant. How can I help you today?'
              }
              {hasScript || files.length > 0 && (
                <span className="block text-xs text-muted-foreground mt-1">
                  I can see you have {hasScript ? 'script content' : ''}{hasScript && files.length > 0 ? ' and ' : ''}{files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : ''} ready for analysis.
                </span>
              )}
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
                  disabled={!ionosAI.getApiToken()}
                >
                  {prompt}
                </Button>
              ))}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Tip: Organize sources into datasets to reuse across chats.</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/datasets">Open Datasets</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onSpeak={onSpeak} />
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
      <form onSubmit={handleSendMessage} className={`p-4 border-t border-border ${isFullscreen ? 'pb-6' : ''}`}>
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              !ionosAI.getApiToken() 
                ? "Set API token in settings" 
                : hasScript || files.length > 0
                  ? "Ask a question or request assistance..." 
                  : "How can I help you today?"
            }
            disabled={!ionosAI.getApiToken() || isLoading}
            className={`flex-1 ${isFullscreen ? 'h-12 text-base' : ''}`}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || !ionosAI.getApiToken() || isLoading}
            className={isFullscreen ? 'h-12 w-12' : ''}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

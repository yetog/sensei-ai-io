import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Settings, Send, Sparkles, Download, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/hooks/useChat';
import { useFileContext } from '@/contexts/FileContext';
import { ChatMessage } from '@/components/ChatMessage';
import { TypingIndicator } from '@/components/TypingIndicator';
import { specializedAgents } from '@/services/specializedAgents';
import { ionosAI } from '@/services/ionosAI';
import { toast } from 'sonner';

interface ChatProps {
  selectedFileIds?: string[];
  className?: string;
}

export const Chat: React.FC<ChatProps> = ({ selectedFileIds = [], className = "" }) => {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const { files, getContextForFiles, getRelevantFileContextDetailed } = useFileContext();
  const [inputValue, setInputValue] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<'sales' | 'retention' | 'technical'>('sales');
  const [showSettings, setShowSettings] = useState(false);
  const [apiToken, setApiToken] = useState(ionosAI.getApiToken() || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    let context = '';
    let usedFiles: string[] = [];

    // Get file context
    if (selectedFileIds.length > 0) {
      const res = getContextForFiles(selectedFileIds);
      context = res.context;
      usedFiles = res.files.map(f => f.name);
    } else {
      const detail = getRelevantFileContextDetailed(inputValue);
      context = detail.context;
      usedFiles = detail.files.map(f => f.name);
    }

    // Get specialized response
    const agentPersonality = specializedAgents.getAgentPersonality(selectedAgent);
    // Convert messages to conversation history format
    const conversationHistory = messages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));

    await sendMessage(
      inputValue, 
      '', 
      context, 
      usedFiles, 
      [], 
      `${agentPersonality.agentType.charAt(0).toUpperCase() + agentPersonality.agentType.slice(1)} Specialist`,
      undefined
    );

    setInputValue('');
  };

  const handleQuickAction = async (action: string) => {
    let context = '';
    let usedFiles: string[] = [];

    if (selectedFileIds.length > 0) {
      const res = getContextForFiles(selectedFileIds);
      context = res.context;
      usedFiles = res.files.map(f => f.name);
    }

    const agentPersonality = specializedAgents.getAgentPersonality(selectedAgent);
    await sendMessage(
      action,
      '',
      context,
      usedFiles,
      [],
      `${agentPersonality.agentType.charAt(0).toUpperCase() + agentPersonality.agentType.slice(1)} Specialist`,
      undefined
    );
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

  const exportChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      agent: selectedAgent,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        usedFiles: msg.usedFiles
      }))
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensei-ai-chat-${selectedAgent}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Chat exported successfully');
  };

  const agentPersonality = specializedAgents.getAgentPersonality(selectedAgent);
  const conversationStarters = specializedAgents.getConversationStarters(selectedAgent);

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
          <div>
            <h3 className="font-semibold flex items-center space-x-2">
              <span>{selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Specialist</span>
              <Badge variant="secondary" className="text-xs">
                {agentPersonality.responseStyle}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Specialized in {agentPersonality.expertise.join(', ')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={exportChat}
            className="h-8 w-8"
            disabled={messages.length === 0}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Agent Selection */}
      <div className="p-3 border-b border-border bg-secondary/20">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium">Agent:</label>
          <Select value={selectedAgent} onValueChange={(value: 'sales' | 'retention' | 'technical') => setSelectedAgent(value)}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Specialist</SelectItem>
              <SelectItem value="retention">Retention Expert</SelectItem>
              <SelectItem value="technical">Technical Advisor</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {selectedFileIds.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedFileIds.length} files selected
              </Badge>
            )}
            {files.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {files.length} total files
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-secondary/50">
          <div className="space-y-3">
            <label className="text-sm font-medium">IONOS AI API Token:</label>
            <Input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your IONOS AI API token"
              className="text-xs"
            />
            <div className="flex space-x-2">
              <Button onClick={handleSaveToken} size="sm" className="flex-1">
                Save Token
              </Button>
              <Button onClick={clearChat} variant="outline" size="sm">
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm mb-4">
              Hi! I'm your {selectedAgent} specialist. How can I help you today?
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Expertise: {agentPersonality.expertise.join(' • ')}
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium">Quick starters:</p>
              {conversationStarters.slice(0, 3).map((starter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleQuickAction(starter)}
                  disabled={!ionosAI.getApiToken()}
                >
                  {starter}
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
              <TypingIndicator agentName={`${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Specialist`} />
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
                : `Ask your ${selectedAgent} specialist...`
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
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">
            {!ionosAI.getApiToken() ? 'API token required' : `Connected to ${selectedAgent} specialist`}
          </p>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction("What should I focus on in this call?")}
              disabled={!ionosAI.getApiToken() || isLoading}
              className="text-xs"
            >
              Focus
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction("Help me handle objections")}
              disabled={!ionosAI.getApiToken() || isLoading}
              className="text-xs"
            >
              Objections
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};
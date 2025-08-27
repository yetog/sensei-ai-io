
import { useState, useCallback } from 'react';
import { ChatMessage, ChatState } from '@/types/chat';
import { ionosAI } from '@/services/ionosAI';
import { agentTrainingService } from '@/services/agentTrainingService';
import { AgentConfig } from '@/types/agent';
import { toast } from 'sonner';

export const useChat = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isOpen: false
  });

  const sendMessage = useCallback(async (content: string, scriptContext?: string, fileContext?: string, usedFiles?: string[], suggestions?: string[], agentName?: string, agent?: AgentConfig) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      usedFiles,
      suggestions
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    try {
      const apiMessages = chatState.messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Use enhanced system prompt if agent is provided
      let systemPrompt = '';
      if (agent) {
        systemPrompt = agentTrainingService.getEnhancedSystemPrompt(agent);
      }
      
      // Build enhanced message with contexts (all optional now)
      let messageContent = content;
      let contextParts: string[] = [];
      
      // Include script context if provided (optional)
      if (scriptContext && scriptContext.trim()) {
        contextParts.push(`Current script context (${scriptContext.trim().split(/\s+/).length} words):\n"${scriptContext}"`);
      }
      
      // Include file context if provided (optional)
      if (fileContext && fileContext.trim()) {
        contextParts.push(`Relevant file content:\n${fileContext}`);
      }
      
      if (contextParts.length > 0) {
        messageContent = `${contextParts.join('\n\n')}\n\nUser question: ${content}

IMPORTANT: When referencing information from uploaded files, cite them using the format [📄filename.ext] in your response.`;
      }
      
      // Add system message first if we have enhanced prompt
      const finalMessages = systemPrompt ? 
        [{ role: 'system' as const, content: systemPrompt }, ...apiMessages, { role: 'user' as const, content: messageContent }] :
        [...apiMessages, { role: 'user' as const, content: messageContent }];

      const response = await ionosAI.sendMessage(finalMessages, agentName);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        usedFiles
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }));
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please check your API token.');
      setChatState(prev => ({ ...prev, isLoading: false }));
    }
  }, [chatState.messages]);

  const sendQuickAction = useCallback(async (action: string, scriptContext?: string, fileContext?: string, usedFiles?: string[], suggestions?: string[], agentName?: string, agent?: AgentConfig) => {
    // Quick actions now work without script context
    await sendMessage(action, scriptContext, fileContext, usedFiles, suggestions, agentName, agent);
  }, [sendMessage]);

  const generateImage = useCallback(async (scriptContext?: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: scriptContext ? 'Generate an image for this script' : 'Generate an image',
      timestamp: new Date()
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Image generation coming soon! This feature is currently being developed and will be available in a future update.',
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage]
    }));

    toast.info('Image generation coming soon!');
  }, []);

  const toggleChat = useCallback(() => {
    setChatState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const clearChat = useCallback(() => {
    setChatState(prev => ({ ...prev, messages: [] }));
  }, []);

  return {
    ...chatState,
    sendMessage,
    sendQuickAction,
    generateImage,
    toggleChat,
    clearChat
  };
};

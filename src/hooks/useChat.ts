
import { useState, useCallback } from 'react';
import { ChatMessage, ChatState } from '@/types/chat';
import { ionosAI } from '@/services/ionosAI';
import { toast } from 'sonner';

export const useChat = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isOpen: false
  });

  const sendMessage = useCallback(async (content: string, scriptContext?: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
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
      
      // Include script context if provided
      let messageContent = content;
      if (scriptContext && scriptContext.trim()) {
        messageContent = `Current script (${scriptContext.trim().split(/\s+/).length} words):\n\n"${scriptContext}"\n\nUser question: ${content}`;
      }
      
      apiMessages.push({ role: 'user', content: messageContent });

      const response = await ionosAI.sendMessage(apiMessages);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
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

  const sendQuickAction = useCallback(async (action: string, scriptContext: string) => {
    if (!scriptContext.trim()) {
      toast.error('Please add some text to your script first');
      return;
    }
    await sendMessage(action, scriptContext);
  }, [sendMessage]);

  const generateImage = useCallback(async (scriptContext: string) => {
    if (!scriptContext.trim()) {
      toast.error('Please add some text to your script first');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Generate an image for this script',
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


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

  const sendMessage = useCallback(async (content: string) => {
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
      
      apiMessages.push({ role: 'user', content });

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

  const toggleChat = useCallback(() => {
    setChatState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const clearChat = useCallback(() => {
    setChatState(prev => ({ ...prev, messages: [] }));
  }, []);

  return {
    ...chatState,
    sendMessage,
    toggleChat,
    clearChat
  };
};

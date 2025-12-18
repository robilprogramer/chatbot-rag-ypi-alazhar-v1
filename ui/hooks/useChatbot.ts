// hooks/useChatbot.ts

import { useState, useCallback, useEffect } from 'react';
import { Message, ChatbotMode } from '@/types/chatbot';
import { ChatbotService } from '@/services/chatbot.service';

interface UseChatbotReturn {
  messages: Message[];
  loading: boolean;
  sessionId: string;
  mode: ChatbotMode;
  sendMessage: (content: string) => Promise<void>;
  setMode: (mode: ChatbotMode) => void;
  clearMessages: () => void;
}

export const useChatbot = (initialMode: ChatbotMode = 'informational'): UseChatbotReturn => {
  const [mode, setModeState] = useState<ChatbotMode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => ChatbotService.generateSessionId());

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chatbot-messages-${sessionId}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })));
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
  }, [sessionId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chatbot-messages-${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date(),
        mode,
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        // Call API
        const response = await ChatbotService.sendMessage(content, sessionId, mode);

        // Add assistant message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          content: response.answer,
          role: 'assistant',
          timestamp: new Date(),
          mode,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error sending message:', error);

        // Add error message
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          role: 'assistant',
          timestamp: new Date(),
          mode,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, mode]
  );

  const setMode = useCallback((newMode: ChatbotMode) => {
    setModeState(newMode);
    // Optionally clear messages when switching modes
    // setMessages([]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(`chatbot-messages-${sessionId}`);
  }, [sessionId]);

  return {
    messages,
    loading,
    sessionId,
    mode,
    sendMessage,
    setMode,
    clearMessages,
  };
};
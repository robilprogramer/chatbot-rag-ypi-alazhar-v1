// services/chatbot.service.ts

import { ChatRequest, ChatResponse, ChatbotMode } from '@/types/chatbot';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export class ChatbotService {
  private static getEndpoint(mode: ChatbotMode): string {
    return mode === 'informational' 
      ? `${BASE_URL}/api/chat`
      : `${BASE_URL}/api/transaction`;
  }

  static async sendMessage(
    question: string,
    sessionId: string,
    mode: ChatbotMode = 'informational'
  ): Promise<ChatResponse> {
    try {
      const endpoint = this.getEndpoint(mode);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          session_id: sessionId,
          mode,
        } as ChatRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static generateSessionId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async streamMessage(
    question: string,
    sessionId: string,
    mode: ChatbotMode,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const endpoint = this.getEndpoint(mode);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        session_id: sessionId,
        mode,
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No reader available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  }
}
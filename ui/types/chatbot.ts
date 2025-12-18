// types/chatbot.ts

export type ChatbotMode = 'informational' | 'transactional';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  mode?: ChatbotMode;
}

export interface QuickQuestion {
  id: string;
  question: string;
  category?: string;
}

export interface ChatSession {
  session_id: string;
  mode: ChatbotMode;
  messages: Message[];
  createdAt: Date;
}

export interface ChatRequest {
  question: string;
  session_id: string;
  mode?: ChatbotMode;
}

export interface ChatResponse {
  answer: string;
  session_id: string;
  sources?: string[];
  confidence?: number;
}

export interface QuickQuestionsConfig {
  informational: QuickQuestion[];
  transactional: QuickQuestion[];
}
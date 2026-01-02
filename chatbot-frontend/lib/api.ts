// API Service untuk komunikasi dengan backend
import axios, { AxiosInstance } from 'axios';
import { ChatResponse, SessionInfo, RegistrationSummary } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ChatbotAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Chat endpoints
  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    const response = await this.client.post<ChatResponse>('/api/v3/chatbot/chat', {
      message,
      session_id: sessionId,
    });
    return response.data;
  }

  // Session management
  async createNewSession(): Promise<{ session_id: string; message: string; current_step: string }> {
    const response = await this.client.post('/api/v3/chatbot/session/new');
    return response.data;
  }

  async getSession(sessionId: string): Promise<SessionInfo> {
    const response = await this.client.get<SessionInfo>(`/api/v3/chatbot/session/${sessionId}`);
    return response.data;
  }

  async deleteSession(sessionId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/api/v3/chatbot/session/${sessionId}`);
    return response.data;
  }

  // Document upload
  async uploadDocument(
    sessionId: string,
    documentType: string,
    file: File
  ): Promise<{ success: boolean; message: string; file_path?: string }> {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('document_type', documentType);
    formData.append('file', file);

    const response = await this.client.post('/api/v3/chatbot/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Registration
  async getRegistrationSummary(sessionId: string): Promise<RegistrationSummary> {
    const response = await this.client.get<RegistrationSummary>(
      `/api/v3/chatbot/registration/summary/${sessionId}`
    );
    return response.data;
  }

  async confirmRegistration(sessionId: string): Promise<{
    success: boolean;
    registration_number: string;
    message: string;
    next_steps: string[];
  }> {
    const response = await this.client.post(`/api/v3/chatbot/registration/confirm/${sessionId}`);
    return response.data;
  }

  async getRegistrationStatus(registrationNumber: string): Promise<{
    registration_number: string;
    status: string;
    last_updated: string;
    message: string;
  }> {
    const response = await this.client.get(
      `/api/v3/chatbot/registration/status/${registrationNumber}`
    );
    return response.data;
  }
}

export const chatbotAPI = new ChatbotAPI();

// Main Chat Interface Component
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, RotateCcw } from 'lucide-react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ProgressBar from './ProgressBar';
import FileUpload from './FileUpload';
import { Message } from '@/types';
import { chatbotAPI } from '@/lib/api';
import { cn, saveToLocalStorage, getFromLocalStorage } from '@/lib/utils';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState('greeting');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      // Try to load existing session from localStorage
      const savedSessionId = getFromLocalStorage<string>('chatbot_session_id');
      
      if (savedSessionId) {
        setSessionId(savedSessionId);
        // Optionally load previous messages
        const savedMessages = getFromLocalStorage<Message[]>('chatbot_messages');
        if (savedMessages) {
          setMessages(savedMessages);
        }
      } else {
        // Create new session
        try {
          const response = await chatbotAPI.createNewSession();
          setSessionId(response.session_id);
          saveToLocalStorage('chatbot_session_id', response.session_id);
          
          // Add welcome message
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Selamat datang di layanan pendaftaran siswa baru YPI Al-Azhar Jakarta! 👋\n\nSaya adalah asisten virtual yang akan membantu Anda dalam proses pendaftaran. Saya siap membantu Anda dengan:\n\n- Informasi umum tentang sekolah\n- Proses pendaftaran siswa baru\n- Pengisian formulir pendaftaran secara interaktif\n\nApa yang bisa saya bantu hari ini?',
            timestamp: new Date(),
          };
          
          setMessages([welcomeMessage]);
          saveToLocalStorage('chatbot_messages', [welcomeMessage]);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    };

    initSession();
  }, []);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await chatbotAPI.sendMessage(inputMessage, sessionId);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        metadata: {
          current_step: response.current_step,
          completion_percentage: response.completion_percentage,
          missing_fields: response.metadata.missing_fields,
        },
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        saveToLocalStorage('chatbot_messages', updated);
        return updated;
      });
      
      setCurrentStep(response.current_step);
      setCompletionPercentage(response.completion_percentage);

      // Show file upload if in document_upload step
      if (response.current_step === 'document_upload') {
        setShowFileUpload(true);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File, documentType: string) => {
    if (!sessionId) return;

    try {
      await chatbotAPI.uploadDocument(sessionId, documentType, file);
      
      // Send confirmation message
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✓ Dokumen ${documentType.replace('_', ' ')} berhasil diupload!`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, confirmMessage]);
    } catch (error) {
      throw error;
    }
  };

  // Reset conversation
  const handleReset = async () => {
    if (!confirm('Yakin ingin memulai percakapan baru? Data yang belum tersimpan akan hilang.')) {
      return;
    }

    try {
      if (sessionId) {
        await chatbotAPI.deleteSession(sessionId);
      }
      
      const response = await chatbotAPI.createNewSession();
      setSessionId(response.session_id);
      setMessages([]);
      setCurrentStep('greeting');
      setCompletionPercentage(0);
      setShowFileUpload(false);
      
      saveToLocalStorage('chatbot_session_id', response.session_id);
      saveToLocalStorage('chatbot_messages', []);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Selamat datang kembali! Saya siap membantu proses pendaftaran Anda. Silakan mulai dengan memberitahu saya apa yang Anda butuhkan.',
        timestamp: new Date(),
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error resetting conversation:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">YPI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                Al-Azhar Chatbot
              </h1>
              <p className="text-xs text-gray-600">Asisten Pendaftaran Siswa Baru</p>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col px-4 py-6">
          {/* Progress Bar */}
          {currentStep !== 'greeting' && currentStep !== 'informational' && (
            <ProgressBar
              currentStep={currentStep}
              completionPercentage={completionPercentage}
            />
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {isTyping && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </div>

          {/* File Upload Section */}
          {showFileUpload && currentStep === 'document_upload' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Upload Dokumen Persyaratan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUpload
                  documentType="akta_kelahiran"
                  label="Akta Kelahiran"
                  onUpload={(file) => handleFileUpload(file, 'akta_kelahiran')}
                />
                <FileUpload
                  documentType="kartu_keluarga"
                  label="Kartu Keluarga"
                  onUpload={(file) => handleFileUpload(file, 'kartu_keluarga')}
                />
                <FileUpload
                  documentType="foto_siswa"
                  label="Foto Siswa"
                  description="3x4"
                  onUpload={(file) => handleFileUpload(file, 'foto_siswa')}
                />
                <FileUpload
                  documentType="ijazah_terakhir"
                  label="Ijazah Terakhir"
                  onUpload={(file) => handleFileUpload(file, 'ijazah_terakhir')}
                />
                <FileUpload
                  documentType="rapor_terakhir"
                  label="Rapor Semester Terakhir"
                  onUpload={(file) => handleFileUpload(file, 'rapor_terakhir')}
                />
                <FileUpload
                  documentType="surat_keterangan_sehat"
                  label="Surat Keterangan Sehat"
                  onUpload={(file) => handleFileUpload(file, 'surat_keterangan_sehat')}
                />
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="relative">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex items-center gap-2 p-2">
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowFileUpload(!showFileUpload)}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan Anda..."
                className="flex-1 px-3 py-2 outline-none text-gray-800 placeholder-gray-400"
                disabled={isTyping}
              />
              
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className={cn(
                  'p-3 rounded-lg transition-all',
                  inputMessage.trim() && !isTyping
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

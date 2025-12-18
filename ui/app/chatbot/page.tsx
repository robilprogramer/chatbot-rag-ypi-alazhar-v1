'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, ChatbotMode } from '@/types/chatbot';
import { ChatbotService } from '@/services/chatbot.service';
import { quickQuestions } from '@/config/quick-questions';

import { MessageCircle, Sparkles } from 'lucide-react';
import { ModeSelector } from '@/components/chatbot/ModeSelector';
import { QuickQuestions } from '@/components/chatbot/QuickQuestions';
import { ChatMessage } from '@/components/chatbot/ChatMessage';
import { ChatInput } from '@/components/chatbot/ChatInput';

export default function ChatbotPage() {
  const [mode, setMode] = useState<ChatbotMode>('informational');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => ChatbotService.generateSessionId());
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset messages when mode changes
  const handleModeChange = (newMode: ChatbotMode) => {
    setMode(newMode);
    setMessages([]);
    setShowQuickQuestions(true);
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Hide quick questions after first message
    setShowQuickQuestions(false);

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
      const response = await ChatbotService.sendMessage(
        content,
        sessionId,
        mode
      );

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
  };

  // Handle quick question click
  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
            >
              <MessageCircle className="text-white" size={24} />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                Al-Azhar Assistant
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Asisten Virtual YPI Al-Azhar Jakarta
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-180px)]">
          
          {/* Mode Selector */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <ModeSelector selectedMode={mode} onModeChange={handleModeChange} />
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center mb-4 sm:mb-6"
                  >
                    <Sparkles className="text-white" size={40} />
                  </motion.div>

                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {mode === 'informational'
                      ? 'Ada yang bisa saya bantu?'
                      : 'Siap membantu transaksi Anda'}
                  </h2>

                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mb-6">
                    {mode === 'informational'
                      ? 'Tanyakan tentang biaya, fasilitas, program, atau informasi lainnya'
                      : 'Lakukan pendaftaran, ajukan beasiswa, atau layanan lainnya'}
                  </p>

                  {/* Quick Questions */}
                  {mode === 'informational' && (
                    <div className="w-full max-w-2xl">
                      <QuickQuestions
                        questions={quickQuestions.informational}
                        onQuestionClick={handleQuickQuestion}
                        show={showQuickQuestions}
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3 mb-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                        <MessageCircle size={18} className="text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: 0,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: 0.2,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: 0.4,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            loading={loading}
            placeholder={
              mode === 'informational'
                ? 'Tanyakan tentang Al-Azhar...'
                : 'Apa yang ingin Anda lakukan?'
            }
          />
        </div>
      </main>
    </div>
  );
}
// Chat Message Component
'use client';

import { Message } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 mb-4 chat-bubble-enter',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
        )}
      >
        <div className="prose prose-sm max-w-none">
          {isUser ? (
            <p className="text-white m-0">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="my-2 ml-4">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 ml-4">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Metadata display */}
        {message.metadata && !isUser && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {message.metadata.completion_percentage !== undefined && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${message.metadata.completion_percentage}%` }}
                  />
                </div>
                <span className="font-medium">
                  {message.metadata.completion_percentage.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-1 text-xs opacity-60">
          {formatDate(message.timestamp)}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}

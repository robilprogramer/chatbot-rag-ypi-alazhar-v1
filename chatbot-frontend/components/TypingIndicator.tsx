// Typing Indicator Component
'use client';

import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>

      <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm border border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
        </div>
      </div>
    </div>
  );
}

// // components/ChatMessage.tsx

// 'use client';

// import { Message } from '@/types/chatbot';
// import { motion } from 'framer-motion';
// import { Bot, User } from 'lucide-react';

// interface ChatMessageProps {
//   message: Message;
// }

// export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
//   const isUser = message.role === 'user';

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.3 }}
//       className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
//     >
//       {/* Avatar */}
//       <div
//         className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
//           isUser
//             ? 'bg-blue-600 text-white'
//             : 'bg-gradient-to-br from-green-400 to-blue-500 text-white'
//         }`}
//       >
//         {isUser ? <User size={18} /> : <Bot size={18} />}
//       </div>

//       {/* Message bubble */}
//       <motion.div
//         initial={{ scale: 0.95 }}
//         animate={{ scale: 1 }}
//         className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
//           isUser
//             ? 'bg-blue-600 text-white rounded-tr-sm'
//             : 'bg-gray-100 text-gray-800 rounded-tl-sm dark:bg-gray-800 dark:text-gray-100'
//         }`}
//       >
//         <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
//           {message.content}
//         </p>
//         <span className="text-xs opacity-70 mt-1 block">
//           {message.timestamp.toLocaleTimeString('id-ID', {
//             hour: '2-digit',
//             minute: '2-digit',
//           })}
//         </span>
//       </motion.div>
//     </motion.div>
//   );
// };

// components/chatbot/ChatMessage.tsx
'use client';

import { Message } from '@/types/chatbot';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4 group`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gradient-to-br from-green-400 to-blue-500 text-white'
        }`}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Message bubble */}
      <div className="flex flex-col max-w-[75%] sm:max-w-[70%]">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className={`relative rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm dark:bg-gray-800 dark:text-gray-100'
          }`}
        >
          {/* Message Content with Markdown */}
          {isUser ? (
            // User messages: plain text
            <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            // Assistant messages: Markdown rendering
            <div className="markdown-content text-sm sm:text-base">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Headings
                  h1: ({ node, ...props }) => (
                    <h1 className="text-xl font-bold mb-3 mt-2" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-lg font-bold mb-2 mt-2" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-base font-semibold mb-2 mt-2" {...props} />
                  ),
                  
                  // Paragraphs
                  p: ({ node, ...props }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
                  ),
                  
                  // Bold text
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-blue-700 dark:text-blue-300" {...props} />
                  ),
                  
                  // Italic text
                  em: ({ node, ...props }) => (
                    <em className="italic text-gray-700 dark:text-gray-300" {...props} />
                  ),
                  
                  // Lists
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside mb-3 space-y-1 ml-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside mb-3 space-y-1 ml-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="leading-relaxed" {...props} />
                  ),
                  
                  // Code blocks
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="my-3 rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-950">
                        <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 flex justify-between items-center">
                          <span>{match ? match[1] : 'code'}</span>
                        </div>
                        <pre className="p-4 overflow-x-auto">
                          <code className="text-sm text-gray-100 font-mono" {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code
                        className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  
                  // Links
                  a: ({ node, ...props }) => (
                    <a
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  
                  // Blockquotes
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-blue-500 pl-4 py-2 my-3 italic bg-blue-50 dark:bg-blue-900/20 rounded-r"
                      {...props}
                    />
                  ),
                  
                  // Horizontal rule
                  hr: ({ node, ...props }) => (
                    <hr className="my-4 border-gray-300 dark:border-gray-600" {...props} />
                  ),
                  
                  // Tables
                  table: ({ node, ...props }) => (
                    <div className="my-3 overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-gray-200 dark:bg-gray-700" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2" {...props} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Copy button (only for assistant messages) */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-md hover:shadow-lg"
              title="Copy message"
            >
              {copied ? (
                <Check size={14} className="text-green-600" />
              ) : (
                <Copy size={14} className="text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}
        </motion.div>

        {/* Timestamp */}
        <span className={`text-xs opacity-70 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  );
};
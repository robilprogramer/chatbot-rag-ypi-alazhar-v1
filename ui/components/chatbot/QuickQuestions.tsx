// components/QuickQuestions.tsx

'use client';

import { QuickQuestion } from '@/types/chatbot';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface QuickQuestionsProps {
  questions: QuickQuestion[];
  onQuestionClick: (question: string) => void;
  show: boolean;
}

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({
  questions,
  onQuestionClick,
  show,
}) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mb-4"
    >
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
        <Sparkles size={16} className="text-yellow-500" />
        <span>Pertanyaan Cepat</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {questions.map((q, index) => (
          <motion.button
            key={q.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onQuestionClick(q.question)}
            className="text-left p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {q.question}
            </p>
            {q.category && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">
                {q.category}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
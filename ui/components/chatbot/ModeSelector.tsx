// components/ModeSelector.tsx

'use client';

import { ChatbotMode } from '@/types/chatbot';
import { motion } from 'framer-motion';
import { Info, ShoppingCart } from 'lucide-react';

interface ModeSelectorProps {
  selectedMode: ChatbotMode;
  onModeChange: (mode: ChatbotMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onModeChange,
}) => {
  const modes = [
    {
      id: 'informational' as ChatbotMode,
      label: 'Informasi',
      description: 'Tanya tentang biaya, fasilitas, & program',
      icon: Info,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'transactional' as ChatbotMode,
      label: 'Transaksi',
      description: 'Daftar, ajukan beasiswa, & layanan',
      icon: ShoppingCart,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {modes.map((mode) => {
        const isSelected = selectedMode === mode.id;
        const Icon = mode.icon;

        return (
          <motion.button
            key={mode.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onModeChange(mode.id)}
            className={`flex-1 relative overflow-hidden rounded-2xl p-4 transition-all ${
              isSelected
                ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900'
                : 'hover:shadow-lg'
            }`}
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} transition-opacity ${
                isSelected ? 'opacity-100' : 'opacity-10'
              }`}
            />

            {/* Content */}
            <div className="relative z-10 flex items-start gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon size={24} />
              </div>

              <div className="flex-1 text-left">
                <h3
                  className={`font-semibold text-base sm:text-lg ${
                    isSelected
                      ? 'text-white'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {mode.label}
                </h3>
                <p
                  className={`text-xs sm:text-sm mt-1 ${
                    isSelected
                      ? 'text-white/90'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {mode.description}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  layoutId="selected-indicator"
                  className="w-3 h-3 rounded-full bg-white"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
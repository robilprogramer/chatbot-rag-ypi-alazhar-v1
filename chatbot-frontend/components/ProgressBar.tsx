// Progress Bar Component
'use client';

import { getStepIcon, getStepTitle } from '@/lib/utils';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  key: string;
  title: string;
  completed: boolean;
  current: boolean;
}

interface ProgressBarProps {
  currentStep: string;
  completionPercentage: number;
}

const steps = [
  'greeting',
  'student_data',
  'parent_data',
  'academic_data',
  'document_upload',
  'confirmation',
];

export default function ProgressBar({ currentStep, completionPercentage }: ProgressBarProps) {
  const currentStepIndex = steps.indexOf(currentStep);

  const stepsList: Step[] = steps.map((step, index) => ({
    key: step,
    title: getStepTitle(step),
    completed: index < currentStepIndex,
    current: index === currentStepIndex,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Progress Pendaftaran</h3>
        <span className="text-sm font-medium text-blue-600">
          {completionPercentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stepsList.map((step, index) => (
          <div
            key={step.key}
            className={cn(
              'relative flex flex-col items-center p-3 rounded-lg transition-all',
              step.current && 'bg-blue-50 border border-blue-200',
              step.completed && 'bg-emerald-50'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 transition-all',
                step.completed && 'bg-emerald-500 text-white',
                step.current && 'bg-blue-500 text-white ring-4 ring-blue-100',
                !step.completed && !step.current && 'bg-gray-200 text-gray-500'
              )}
            >
              {step.completed ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{getStepIcon(step.key)}</span>
              )}
            </div>
            <span
              className={cn(
                'text-xs text-center font-medium',
                step.current && 'text-blue-700',
                step.completed && 'text-emerald-700',
                !step.completed && !step.current && 'text-gray-500'
              )}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

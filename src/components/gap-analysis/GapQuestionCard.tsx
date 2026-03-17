import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Send } from 'lucide-react';
import type { GapQuestion } from '@/types/gap-analysis';

interface GapQuestionCardProps {
  question: GapQuestion;
  onAnswer: (questionId: string, answer: string, selectedOptions?: string[]) => void;
  onSnooze: (questionId: string) => void;
}

export function GapQuestionCard({ question, onAnswer, onSnooze }: GapQuestionCardProps) {
  const [freeText, setFreeText] = useState('');
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);

  const isCritical = question.priority === 'critical';

  const canSubmit = (() => {
    switch (question.inputType) {
      case 'free_text':
        return freeText.trim().length > 0;
      case 'single_choice':
        return selectedSingle !== null;
      case 'multi_choice':
        return selectedMulti.length > 0;
      default:
        return false;
    }
  })();

  const handleSubmit = () => {
    if (!canSubmit) return;

    switch (question.inputType) {
      case 'free_text':
        onAnswer(question.id, freeText.trim());
        break;
      case 'single_choice': {
        const label = question.options?.find((o) => o.id === selectedSingle)?.label ?? '';
        onAnswer(question.id, label, selectedSingle ? [selectedSingle] : undefined);
        break;
      }
      case 'multi_choice': {
        const labels = selectedMulti
          .map((id) => question.options?.find((o) => o.id === id)?.label ?? '')
          .filter(Boolean)
          .join(', ');
        onAnswer(question.id, labels, selectedMulti);
        break;
      }
    }
  };

  const toggleMulti = (optionId: string) => {
    setSelectedMulti((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border-2 border-gray-200 bg-white p-5"
    >
      {/* Priority badge */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            isCritical
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isCritical ? 'Critical' : 'Nice to Have'}
        </span>
      </div>

      {/* Question text */}
      <p className="text-sm font-bold text-navy leading-relaxed">
        {question.question}
      </p>

      {/* Context note */}
      {question.context && (
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          {question.context}
        </p>
      )}

      {/* Input area */}
      <div className="mt-4">
        {question.inputType === 'free_text' && (
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Type your answer..."
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-navy placeholder-gray-400 focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue resize-none"
          />
        )}

        {question.inputType === 'single_choice' && question.options && (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2.5 cursor-pointer rounded-md border border-gray-200 px-3 py-2.5 hover:border-blue/40 transition-colors"
              >
                <input
                  type="radio"
                  name={`gap-q-${question.id}`}
                  value={option.id}
                  checked={selectedSingle === option.id}
                  onChange={() => setSelectedSingle(option.id)}
                  className="h-4 w-4 text-blue accent-blue"
                />
                <span className="text-sm text-navy">{option.label}</span>
              </label>
            ))}
          </div>
        )}

        {question.inputType === 'multi_choice' && question.options && (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2.5 cursor-pointer rounded-md border border-gray-200 px-3 py-2.5 hover:border-blue/40 transition-colors"
              >
                <input
                  type="checkbox"
                  value={option.id}
                  checked={selectedMulti.includes(option.id)}
                  onChange={() => toggleMulti(option.id)}
                  className="h-4 w-4 text-blue accent-blue rounded"
                />
                <span className="text-sm text-navy">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 rounded-lg bg-blue px-4 py-2 text-xs font-medium text-white uppercase tracking-wider hover:bg-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-3 w-3" />
          Submit Answer
        </button>
        <button
          onClick={() => onSnooze(question.id)}
          className="flex items-center gap-1.5 rounded-lg border-2 border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:border-gray-300 hover:text-navy transition-colors"
        >
          <Moon className="h-3 w-3" />
          Snooze
        </button>
      </div>
    </motion.div>
  );
}

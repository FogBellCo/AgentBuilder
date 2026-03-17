import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GapQuestion } from '@/types/gap-analysis';

interface UnansweredQuestionsPanelProps {
  questions: GapQuestion[];
  onAnswer: (id: string, answer: string, selectedOptions?: string[]) => void;
}

export function UnansweredQuestionsPanel({
  questions,
  onAnswer,
}: UnansweredQuestionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string[]>>({});

  if (questions.length === 0) return null;

  const handleSubmit = (q: GapQuestion) => {
    if (q.inputType === 'free_text') {
      const answer = answers[q.id]?.trim();
      if (answer) {
        onAnswer(q.id, answer);
        setAnswers((prev) => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
      }
    } else {
      const opts = selectedOpts[q.id];
      if (opts && opts.length > 0) {
        onAnswer(q.id, opts.join(','), opts);
        setSelectedOpts((prev) => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
      }
    }
  };

  const handleOptionToggle = (questionId: string, optionId: string, inputType: string) => {
    setSelectedOpts((prev) => {
      const current = prev[questionId] ?? [];
      if (inputType === 'single_choice') {
        return { ...prev, [questionId]: [optionId] };
      }
      // multi_choice
      return {
        ...prev,
        [questionId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  return (
    <div data-unanswered-panel className="rounded-lg border-2 border-gold/30 bg-gold/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <span className="text-xs font-bold text-navy uppercase tracking-wider">
          Unanswered Questions ({questions.length})
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-3">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs text-gray-400 font-medium shrink-0">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {q.priority === 'critical' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Critical
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <Sparkles className="h-2.5 w-2.5" />
                            Nice to Have
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-navy font-medium">{q.question}</p>
                      {q.context && (
                        <p className="text-xs text-gray-500 mt-0.5">{q.context}</p>
                      )}
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="mt-3">
                    {q.inputType === 'free_text' ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={answers[q.id] ?? ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          placeholder="Type your answer..."
                          className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue/40 focus:ring-1 focus:ring-blue/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit(q);
                          }}
                        />
                        <button
                          onClick={() => handleSubmit(q)}
                          disabled={!answers[q.id]?.trim()}
                          className={cn(
                            'rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors',
                            answers[q.id]?.trim()
                              ? 'bg-navy text-white hover:bg-blue'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                          )}
                        >
                          Submit
                        </button>
                      </div>
                    ) : q.options && q.options.length > 0 ? (
                      <div className="space-y-1.5">
                        {q.options.map((opt) => {
                          const isSelected = (selectedOpts[q.id] ?? []).includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              onClick={() =>
                                handleOptionToggle(q.id, opt.id, q.inputType)
                              }
                              className={cn(
                                'w-full text-left rounded-md border px-3 py-2 text-xs transition-colors',
                                isSelected
                                  ? 'border-blue bg-blue/5 text-navy font-medium'
                                  : 'border-gray-200 text-gray-600 hover:border-blue/30',
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handleSubmit(q)}
                          disabled={!(selectedOpts[q.id]?.length)}
                          className={cn(
                            'mt-1 rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors',
                            selectedOpts[q.id]?.length
                              ? 'bg-navy text-white hover:bg-blue'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                          )}
                        >
                          Submit
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No options available for this question.</p>
                    )}
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-gray-400 italic text-center pt-1">
                Answering a question will regenerate your summary with the new
                information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

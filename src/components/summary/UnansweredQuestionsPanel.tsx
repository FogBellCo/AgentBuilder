import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Sparkles, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GapQuestion } from '@/types/gap-analysis';

const PREVIEW_COUNT = 3;
const OTHER_OPTION_ID = '__other__';

interface UnansweredQuestionsPanelProps {
  questions: GapQuestion[];
  onAnswer: (id: string, answer: string, selectedOptions?: string[]) => void;
}

export function UnansweredQuestionsPanel({
  questions,
  onAnswer,
}: UnansweredQuestionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string[]>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});

  // Sort: critical first, then nice_to_have
  const sorted = useMemo(
    () =>
      [...questions].sort((a, b) => {
        if (a.priority === 'critical' && b.priority !== 'critical') return -1;
        if (a.priority !== 'critical' && b.priority === 'critical') return 1;
        return 0;
      }),
    [questions],
  );

  const criticalCount = sorted.filter((q) => q.priority === 'critical').length;
  const visibleQuestions = showAll ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hasMore = sorted.length > PREVIEW_COUNT;

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
        const otherText = otherTexts[q.id]?.trim() ?? '';
        // Build label string: map option IDs to labels, use "Other: <text>" for the other option
        const labels = opts
          .map((id) => {
            if (id === OTHER_OPTION_ID) return `Other: ${otherText}`;
            return q.options?.find((o) => o.id === id)?.label ?? '';
          })
          .filter(Boolean)
          .join(', ');
        onAnswer(q.id, labels, opts);
        setSelectedOpts((prev) => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
        setOtherTexts((prev) => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
      }
    }
  };

  const isOtherSelected = (questionId: string) =>
    (selectedOpts[questionId] ?? []).includes(OTHER_OPTION_ID);

  const canSubmitChoice = (q: GapQuestion) => {
    const opts = selectedOpts[q.id];
    if (!opts || opts.length === 0) return false;
    if (opts.includes(OTHER_OPTION_ID) && !otherTexts[q.id]?.trim()) return false;
    return true;
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
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageCircleQuestion className="h-4 w-4 text-gold shrink-0" />
          <div>
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              {questions.length} Unanswered Question{questions.length !== 1 ? 's' : ''}
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {criticalCount > 0
                ? `${criticalCount} critical — answering these will improve your summary`
                : 'Answering these will improve your summary'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
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
              {visibleQuestions.map((q, i) => (
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
                        {/* Other (please specify) */}
                        <button
                          onClick={() =>
                            handleOptionToggle(q.id, OTHER_OPTION_ID, q.inputType)
                          }
                          className={cn(
                            'w-full text-left rounded-md border px-3 py-2 text-xs transition-colors',
                            isOtherSelected(q.id)
                              ? 'border-blue bg-blue/5 text-navy font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-blue/30',
                          )}
                        >
                          Other (please specify)
                        </button>
                        {isOtherSelected(q.id) && (
                          <input
                            type="text"
                            value={otherTexts[q.id] ?? ''}
                            onChange={(e) =>
                              setOtherTexts((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            placeholder="Please describe..."
                            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue/40 focus:ring-1 focus:ring-blue/20"
                          />
                        )}
                        <button
                          onClick={() => handleSubmit(q)}
                          disabled={!canSubmitChoice(q)}
                          className={cn(
                            'mt-1 rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors',
                            canSubmitChoice(q)
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

              {/* Show all / Show fewer toggle */}
              {hasMore && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-center text-xs font-medium text-blue hover:text-navy transition-colors py-2 uppercase tracking-wider"
                >
                  {showAll
                    ? 'Show fewer'
                    : `Show all ${sorted.length} questions`}
                </button>
              )}

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

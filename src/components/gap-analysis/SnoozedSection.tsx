import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, ChevronDown, ChevronRight, Play } from 'lucide-react';
import type { GapQuestion } from '@/types/gap-analysis';

interface SnoozedSectionProps {
  questions: GapQuestion[];
  onUnsnooze: (questionId: string) => void;
}

export function SnoozedSection({ questions, onUnsnooze }: SnoozedSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (questions.length === 0) return null;

  return (
    <section className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left hover:bg-gray-100 transition-colors"
      >
        <Moon className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">
          Snoozed questions
        </span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] font-semibold text-gray-600">
          {questions.length}
        </span>
        <span className="ml-auto">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-3">
              <AnimatePresence mode="popLayout">
                {questions.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.25 }}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <Moon className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                            q.priority === 'critical'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {q.priority === 'critical' ? 'Critical' : 'Nice to Have'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {q.question}
                      </p>
                    </div>
                    <button
                      onClick={() => onUnsnooze(q.id)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue/30 bg-blue/5 px-3 py-1.5 text-[10px] font-medium text-blue uppercase tracking-wider hover:bg-blue/10 transition-colors"
                    >
                      <Play className="h-3 w-3" />
                      Answer now
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

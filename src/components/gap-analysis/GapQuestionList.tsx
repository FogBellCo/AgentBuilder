import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { GapQuestionCard } from './GapQuestionCard';
import { SnoozedSection } from './SnoozedSection';
import type { GapQuestion } from '@/types/gap-analysis';

interface GapQuestionListProps {
  questions: GapQuestion[];
  onAnswer: (questionId: string, answer: string, selectedOptions?: string[]) => void;
  onSnooze: (questionId: string) => void;
  onUnsnooze: (questionId: string) => void;
}

export function GapQuestionList({ questions, onAnswer, onSnooze, onUnsnooze }: GapQuestionListProps) {
  const pending = questions.filter((q) => q.status === 'pending');
  const snoozed = questions.filter((q) => q.status === 'snoozed');
  const critical = pending.filter((q) => q.priority === 'critical');
  const niceToHave = pending.filter((q) => q.priority === 'nice_to_have');

  return (
    <div className="space-y-6">
      {/* Critical section */}
      {critical.length > 0 && (
        <section>
          <motion.div
            layout
            className="mb-3 flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
              Critical
            </h2>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
              {critical.length}
            </span>
          </motion.div>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {critical.map((q) => (
                <GapQuestionCard
                  key={q.id}
                  question={q}
                  onAnswer={onAnswer}
                  onSnooze={onSnooze}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Nice to Have section */}
      {niceToHave.length > 0 && (
        <section>
          <motion.div
            layout
            className="mb-3 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
              Nice to Have
            </h2>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-600">
              {niceToHave.length}
            </span>
          </motion.div>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {niceToHave.map((q) => (
                <GapQuestionCard
                  key={q.id}
                  question={q}
                  onAnswer={onAnswer}
                  onSnooze={onSnooze}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Snoozed section */}
      <SnoozedSection questions={snoozed} onUnsnooze={onUnsnooze} />
    </div>
  );
}

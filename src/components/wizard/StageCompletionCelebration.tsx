import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Stage } from '@/types/decision-tree';

const sectionLabels: Record<Stage, string> = {
  GATHER: 'Your Data',
  REFINE: 'Your Task',
  PRESENT: 'Your Output',
};

interface StageCompletionCelebrationProps {
  stage: Stage;
  onComplete: () => void;
}

export function StageCompletionCelebration({
  stage,
  onComplete,
}: StageCompletionCelebrationProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <div className="text-center">
        <motion.div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green/10"
          initial={prefersReducedMotion ? { scale: 1 } : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.15 }
              : { type: 'spring', stiffness: 300, damping: 20 }
          }
        >
          <Check className="h-10 w-10 text-green" />
        </motion.div>
        <motion.h2
          className="text-xl font-bold text-navy"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: 0.3 }}
        >
          {sectionLabels[stage]} section complete!
        </motion.h2>
        <motion.p
          className="mt-2 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: 0.3 }}
        >
          Nice work. Moving on...
        </motion.p>
      </div>
    </div>
  );
}

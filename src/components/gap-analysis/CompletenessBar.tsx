import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { ReadinessLabel } from '@/types/gap-analysis';
import { getReadinessText } from '@/lib/gap-scoring';

interface CompletenessBarProps {
  score: number;
  readinessLabel: ReadinessLabel;
  /** Optional: description text below the bar */
  description?: string;
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

function getBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function getTrackColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 50) return 'bg-amber-100';
  return 'bg-red-100';
}

export function CompletenessBar({ score, readinessLabel, description }: CompletenessBarProps) {
  const readinessText = getReadinessText(readinessLabel);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      {/* Score and label row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {score >= 80 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}
            >
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </motion.div>
          )}
          <span className="text-2xl font-bold text-navy">
            {score}%
          </span>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${getBadgeClasses(score)}`}
        >
          {readinessText}
        </span>
      </div>

      {/* Progress bar */}
      <div className={`h-2.5 w-full rounded-full ${getTrackColor(score)} overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${getBarColor(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Description text */}
      {description && (
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

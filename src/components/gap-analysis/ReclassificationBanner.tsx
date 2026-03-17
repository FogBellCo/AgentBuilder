import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, ShieldX } from 'lucide-react';
import type { Reclassification } from '@/types/gap-analysis';

const levelLabels: Record<string, string> = {
  P1: 'P1 (Public)',
  P2: 'P2 (Internal)',
  P3: 'P3 (Confidential)',
  P4: 'P4 (Restricted)',
};

interface ReclassificationBannerProps {
  reclassification: Reclassification;
  onAccept: () => void;
  onDismiss: () => void;
}

export function ReclassificationBanner({
  reclassification,
  onAccept,
  onDismiss,
}: ReclassificationBannerProps) {
  const { currentLevel, suggestedLevel, reason } = reclassification;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border-2 border-amber-300 bg-amber-50 p-5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-navy mb-1">
            Protection Level Change Suggested
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            {reason}
          </p>

          {/* Level change display */}
          <div className="mb-4 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 font-medium text-gray-700">
              <ShieldX className="h-3.5 w-3.5" />
              {levelLabels[currentLevel] ?? currentLevel}
            </span>
            <span className="text-gray-400 font-bold">&rarr;</span>
            <span className="flex items-center gap-1.5 rounded-md bg-amber-100 px-3 py-1.5 font-medium text-amber-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              {levelLabels[suggestedLevel] ?? suggestedLevel}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onAccept}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white uppercase tracking-wider hover:bg-amber-700 transition-colors"
            >
              Accept Reclassification
            </button>
            <button
              onClick={onDismiss}
              className="rounded-lg border-2 border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:border-gray-300 hover:text-navy transition-colors"
            >
              Keep Current Level
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

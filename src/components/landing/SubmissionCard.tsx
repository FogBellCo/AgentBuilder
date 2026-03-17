import { motion } from 'framer-motion';
import { cn, timeAgo } from '@/lib/utils';
import type { SubmissionListItem } from '@/lib/api-client';

interface SubmissionCardProps {
  submission: SubmissionListItem;
  onSelect: (id: string) => void;
  index: number;
}

export function SubmissionCard({ submission, onSelect, index }: SubmissionCardProps) {
  const isDraft = submission.status.toLowerCase() === 'draft';

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onSelect(submission.id)}
      className="rounded-lg border-2 border-gray-200 bg-white p-5 text-left hover:border-blue/40 transition-colors w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-navy truncate">
          {submission.title || 'Untitled Project'}
        </h3>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase',
            isDraft
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-100 text-green-700',
          )}
        >
          {submission.status}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Updated {timeAgo(submission.updatedAt)}
      </p>
    </motion.button>
  );
}

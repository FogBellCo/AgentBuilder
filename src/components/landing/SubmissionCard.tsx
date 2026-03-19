import { motion } from 'framer-motion';
import { cn, timeAgo } from '@/lib/utils';
import type { SubmissionListItem } from '@/lib/api-client';

interface SubmissionCardProps {
  submission: SubmissionListItem;
  onSelect: (id: string) => void;
  index: number;
}

function statusBadgeStyle(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-amber-100 text-amber-700';
    case 'submitted':
      return 'bg-blue-100 text-blue-700';
    case 'in_review':
      return 'bg-purple-100 text-purple-700';
    case 'needs_info':
      return 'bg-red-100 text-red-700';
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'building':
      return 'bg-teal-100 text-teal-700';
    case 'complete':
      return 'bg-green-200 text-green-800';
    case 'archived':
      return 'bg-gray-200 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function friendlyStatus(status: string): string {
  const map: Record<string, string> = {
    draft: 'In Progress',
    submitted: 'Submitted',
    in_review: 'Under Review',
    needs_info: 'Action Needed',
    approved: 'Approved',
    building: 'In Development',
    complete: 'Complete',
    archived: 'Archived',
  };
  return map[status] || status;
}

export function SubmissionCard({ submission, onSelect, index }: SubmissionCardProps) {
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
          {submission.title || 'Untitled Request'}
        </h3>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase',
            statusBadgeStyle(submission.status),
          )}
        >
          {friendlyStatus(submission.status)}
        </span>
      </div>
      {submission.completenessPercent > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-medium">Progress</span>
            <span className="text-[10px] text-gray-500 font-bold">{submission.completenessPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue transition-all duration-300"
              style={{ width: `${submission.completenessPercent}%` }}
            />
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-gray-400">
        Updated {timeAgo(submission.updatedAt)}
      </p>
    </motion.button>
  );
}

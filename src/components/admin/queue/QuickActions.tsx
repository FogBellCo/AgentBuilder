import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_STATUSES, STATUS_LABELS } from '@/types/admin';

interface QuickActionsProps {
  submissionId: string;
  currentStatus: string;
  flagged: boolean;
  onChangeStatus: (id: string, status: string) => void;
  onToggleFlag: (id: string, flagged: boolean) => void;
}

export function QuickActions({
  submissionId,
  currentStatus,
  flagged,
  onChangeStatus,
  onToggleFlag,
}: QuickActionsProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {/* Status dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setStatusOpen(!statusOpen)}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Change status"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        {statusOpen && (
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChangeStatus(submissionId, s);
                  setStatusOpen(false);
                }}
                disabled={s === currentStatus}
                className={cn(
                  'block w-full px-3 py-1.5 text-left text-xs',
                  s === currentStatus
                    ? 'bg-gray-50 font-medium text-gray-400'
                    : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Flag toggle */}
      <button
        onClick={() => onToggleFlag(submissionId, !flagged)}
        className={cn(
          'rounded p-1 transition-colors',
          flagged
            ? 'text-p4 hover:bg-red-50'
            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
        )}
        title={flagged ? 'Remove flag' : 'Flag submission'}
      >
        <Flag className={cn('h-4 w-4', flagged && 'fill-current')} />
      </button>
    </div>
  );
}

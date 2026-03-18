import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Archive, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_STATUSES, STATUS_LABELS } from '@/types/admin';
import { ConfirmDialog } from '../ConfirmDialog';

interface BatchActionBarProps {
  selectedCount: number;
  onChangeStatus: (status: string) => void;
  onArchive: () => void;
  onDeselectAll: () => void;
}

export function BatchActionBar({
  selectedCount,
  onChangeStatus,
  onArchive,
  onDeselectAll,
}: BatchActionBarProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-[220px] right-0 z-30 border-t border-gray-200 bg-white px-6 py-3 shadow-lg">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-navy">
          {selectedCount} selected
        </span>

        {/* Change Status dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium',
              'text-gray-700 transition-colors hover:bg-gray-50',
            )}
          >
            Change Status
            <ChevronDown className="h-3 w-3" />
          </button>
          {statusOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onChangeStatus(s);
                    setStatusOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setArchiveConfirm(true)}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Archive className="h-3.5 w-3.5" />
          Archive
        </button>

        <ConfirmDialog
          isOpen={archiveConfirm}
          title="Archive Submissions"
          message={`Are you sure you want to archive ${selectedCount} submission${selectedCount === 1 ? '' : 's'}? They can be unarchived later.`}
          confirmLabel="Archive"
          confirmVariant="danger"
          onConfirm={() => { onArchive(); setArchiveConfirm(false); }}
          onCancel={() => setArchiveConfirm(false)}
        />

        <div className="flex-1" />

        <button
          onClick={onDeselectAll}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          <XCircle className="h-3.5 w-3.5" />
          Deselect All
        </button>
      </div>
    </div>
  );
}

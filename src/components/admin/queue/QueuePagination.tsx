import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueuePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [25, 50, 100];

export function QueuePagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: QueuePaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'rounded p-1 text-gray-600 transition-colors',
            page <= 1 ? 'cursor-not-allowed opacity-30' : 'hover:bg-gray-100',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-gray-600">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'rounded p-1 text-gray-600 transition-colors',
            page >= totalPages ? 'cursor-not-allowed opacity-30' : 'hover:bg-gray-100',
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

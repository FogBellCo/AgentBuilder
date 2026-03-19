import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  customFrom?: string;
  customTo?: string;
  onCustomFromChange?: (value: string) => void;
  onCustomToChange?: (value: string) => void;
}

const PRESETS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

export function DateRangeSelector({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: DateRangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">Date Range:</span>
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            value === preset.value
              ? 'bg-navy text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50',
          )}
        >
          {preset.label}
        </button>
      ))}
      {value === 'custom' && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={customFrom || ''}
            onChange={(e) => onCustomFromChange?.(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <span className="text-xs text-gray-400">&mdash;</span>
          <input
            type="date"
            value={customTo || ''}
            onChange={(e) => onCustomToChange?.(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          />
        </div>
      )}
    </div>
  );
}

export function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();

  switch (preset) {
    case '7d':
      return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), to };
    case '30d':
      return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), to };
    case '90d':
      return { from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), to };
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to };
    case 'all':
    default:
      return { from: '2000-01-01T00:00:00Z', to };
  }
}

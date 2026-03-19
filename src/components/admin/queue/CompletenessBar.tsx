import { cn } from '@/lib/utils';

interface CompletenessBarProps {
  value: number;
  className?: string;
}

function getBarColor(value: number): string {
  if (value >= 75) return 'bg-green';
  if (value >= 50) return 'bg-yellow';
  if (value >= 25) return 'bg-orange';
  return 'bg-p4';
}

export function CompletenessBar({ value, className }: CompletenessBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs font-medium text-gray-700">{Math.round(value)}%</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(value))}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

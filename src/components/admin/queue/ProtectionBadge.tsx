import { cn } from '@/lib/utils';

const P_LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  P1: { bg: 'bg-p1/15', text: 'text-p1' },
  P2: { bg: 'bg-p2/15', text: 'text-p2' },
  P3: { bg: 'bg-p3/15', text: 'text-p3' },
  P4: { bg: 'bg-p4/15', text: 'text-p4' },
};

interface ProtectionBadgeProps {
  level: string | null;
  className?: string;
}

export function ProtectionBadge({ level, className }: ProtectionBadgeProps) {
  if (!level) {
    return (
      <span className={cn('text-xs text-gray-400', className)}>--</span>
    );
  }

  const styles = P_LEVEL_STYLES[level] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        styles.bg,
        styles.text,
        className,
      )}
    >
      {level}
    </span>
  );
}

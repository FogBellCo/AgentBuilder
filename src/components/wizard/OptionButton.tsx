import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DecisionOption } from '@/types/decision-tree';

interface OptionButtonProps {
  option: DecisionOption;
  index: number;
  onSelect: (optionId: string) => void;
  isSelected?: boolean;
  isMultiMode?: boolean;
  isDimmed?: boolean;
  showKeyboardBadge?: boolean;
  isConfirmation?: boolean;
}

export function OptionButton({
  option,
  index,
  onSelect,
  isSelected,
  isMultiMode,
  isDimmed,
  showKeyboardBadge = true,
  isConfirmation,
}: OptionButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = option.icon
    ? (LucideIcons[option.icon as keyof typeof LucideIcons] as LucideIcon | undefined)
    : null;

  const selected = isSelected === true;
  const cappedDelay = Math.min(index, 5) * 0.05;

  // Is this the "I'm not sure" / exclusive option?
  const isExclusiveOption = option.id === 'dont-know';

  // Confirmation buttons are rendered differently (smaller, inline)
  if (isConfirmation) {
    const isPrimary = index === 0;
    return (
      <motion.button
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.25,
          delay: prefersReducedMotion ? 0 : cappedDelay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        onClick={() => onSelect(option.id)}
        className={cn(
          'rounded-lg px-6 py-3 text-sm font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
          'active:scale-[0.98]',
          isPrimary
            ? 'bg-blue text-white hover:bg-navy'
            : 'border-2 border-gray-200 text-navy hover:border-blue',
          selected && 'border-blue bg-blue/5',
        )}
        aria-label={`Option ${index + 1}: ${option.label}`}
      >
        {option.label}
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: isDimmed ? 0.4 : 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: prefersReducedMotion ? 0 : cappedDelay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onClick={() => onSelect(option.id)}
      disabled={isDimmed}
      className={cn(
        'group flex w-full items-center gap-4 rounded-xl border-2 bg-white text-left transition-all',
        'px-4 py-4 md:px-6 md:py-5',
        'min-h-[56px] md:min-h-[64px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
        'active:scale-[0.97] md:active:scale-[0.98]',
        selected
          ? 'border-blue bg-blue/5 shadow-sm'
          : 'border-gray-200 hover:border-blue/60 hover:bg-blue/[0.02] hover:shadow-sm',
        isDimmed && 'pointer-events-none',
        isExclusiveOption && isMultiMode && 'mt-4 pt-4 border-t border-gray-100',
      )}
      role={isMultiMode ? 'checkbox' : 'radio'}
      aria-checked={isMultiMode ? selected : undefined}
      aria-label={`Option ${index + 1}: ${option.label}`}
      aria-describedby={option.description ? `option-desc-${option.id}` : undefined}
    >
      {Icon && (
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
            selected
              ? 'bg-blue text-white'
              : 'bg-gray-100 text-gray-600 group-hover:bg-blue/10 group-hover:text-blue',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-navy">{option.label}</div>
        {option.description && (
          <div
            id={`option-desc-${option.id}`}
            className="mt-1 text-xs text-gray-500 leading-relaxed"
          >
            {option.description}
          </div>
        )}
      </div>

      {/* Right side: checkbox (multi), checkmark (selected single), or keyboard badge */}
      {isMultiMode ? (
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors mt-0.5',
            selected
              ? 'border-blue bg-blue text-white'
              : 'border-gray-300',
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </div>
      ) : selected ? (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="shrink-0"
        >
          <Check className="h-5 w-5 text-blue" />
        </motion.div>
      ) : showKeyboardBadge ? (
        <div className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-mono font-semibold text-gray-500 group-hover:bg-blue/10 group-hover:text-blue">
          {index + 1}
        </div>
      ) : null}
    </motion.button>
  );
}

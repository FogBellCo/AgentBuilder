import { motion } from 'framer-motion';
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
}

export function OptionButton({ option, index, onSelect, isSelected, isMultiMode }: OptionButtonProps) {
  const Icon = option.icon
    ? (LucideIcons[option.icon as keyof typeof LucideIcons] as LucideIcon | undefined)
    : null;

  const selected = isSelected === true;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onClick={() => onSelect(option.id)}
      className={cn(
        'group flex w-full items-start gap-4 rounded-lg border-2 bg-white p-5 text-left transition-all hover:border-blue hover:shadow-md',
        selected ? 'border-blue bg-blue/5' : 'border-gray-200',
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
            selected
              ? 'bg-blue text-white'
              : 'bg-sand text-navy group-hover:bg-blue group-hover:text-white',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1">
        <div className="text-sm font-medium text-navy">{option.label}</div>
        {option.description && (
          <div className="mt-1 text-xs text-gray-500 leading-relaxed">{option.description}</div>
        )}
      </div>
      {isMultiMode && (
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
      )}
    </motion.button>
  );
}

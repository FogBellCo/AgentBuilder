import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { DecisionOption } from '@/types/decision-tree';

interface OptionButtonProps {
  option: DecisionOption;
  index: number;
  onSelect: (optionId: string) => void;
}

export function OptionButton({ option, index, onSelect }: OptionButtonProps) {
  const Icon = option.icon
    ? (LucideIcons[option.icon as keyof typeof LucideIcons] as LucideIcon | undefined)
    : null;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onClick={() => onSelect(option.id)}
      className="group flex w-full items-start gap-4 rounded-lg border-2 border-gray-200 bg-white p-5 text-left transition-all hover:border-blue hover:shadow-md"
    >
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand text-navy transition-colors group-hover:bg-blue group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1">
        <div className="text-sm font-medium text-navy">{option.label}</div>
        {option.description && (
          <div className="mt-1 text-xs text-gray-500 leading-relaxed">{option.description}</div>
        )}
      </div>
    </motion.button>
  );
}

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutputFormatInfo } from '@/types/decision-tree';

interface OutputCardProps {
  format: OutputFormatInfo;
  index: number;
  onSelect: (format: OutputFormatInfo) => void;
  isSelected?: boolean;
  isMultiMode?: boolean;
  description?: string;
  onDescriptionChange?: (description: string) => void;
}

export function OutputCard({
  format,
  index,
  onSelect,
  isSelected = false,
  isMultiMode = false,
  description = '',
  onDescriptionChange,
}: OutputCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[format.icon] as React.ComponentType<{ className?: string }> | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <button
        onClick={() => onSelect(format)}
        className={cn(
          'group flex w-full flex-col items-center gap-3 rounded-lg border-2 bg-white p-6 text-center transition-all hover:shadow-md',
          isSelected
            ? 'border-blue bg-blue/5'
            : 'border-gray-200 hover:border-blue',
        )}
      >
        <div className="relative">
          {Icon && (
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                isSelected
                  ? 'bg-blue text-white'
                  : 'bg-sand text-navy group-hover:bg-blue group-hover:text-white',
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          {isSelected && (
            <CheckCircle2 className="absolute -top-1 -right-1 h-5 w-5 text-blue" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-navy">{format.label}</h4>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            {format.description}
          </p>
        </div>
        {format.technicalOnly && (
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
            Technical
          </span>
        )}
      </button>

      {isMultiMode && isSelected && onDescriptionChange && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2"
        >
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Describe what this output should contain (optional)"
            className="w-full rounded-lg border-2 border-blue/20 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors"
          />
        </motion.div>
      )}
    </motion.div>
  );
}

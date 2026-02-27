import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import type { OutputFormatInfo } from '@/types/decision-tree';

interface OutputCardProps {
  format: OutputFormatInfo;
  index: number;
  onSelect: (format: OutputFormatInfo) => void;
}

export function OutputCard({ format, index, onSelect }: OutputCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[format.icon] as React.ComponentType<{ className?: string }> | undefined;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      onClick={() => onSelect(format)}
      className="group flex flex-col items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-blue hover:shadow-md"
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-navy transition-colors group-hover:bg-blue group-hover:text-white">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div>
        <h4 className="text-sm font-bold text-navy">{format.label}</h4>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{format.description}</p>
      </div>
      {format.technicalOnly && (
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
          Technical
        </span>
      )}
    </motion.button>
  );
}

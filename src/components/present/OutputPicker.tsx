import { motion } from 'framer-motion';
import { outputFormats } from '@/data/output-formats';
import { OutputCard } from './OutputCard';
import type { OutputFormatInfo } from '@/types/decision-tree';

interface OutputPickerProps {
  onSelect: (format: OutputFormatInfo) => void;
}

export function OutputPicker({ onSelect }: OutputPickerProps) {
  const mainFormats = outputFormats.filter((f) => !f.technicalOnly);
  const techFormats = outputFormats.filter((f) => f.technicalOnly);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-navy">How do you want to see the results?</h2>
        <p className="mt-2 text-sm text-gray-500">
          Choose the format that best fits how you and your audience will use the AI output.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {mainFormats.map((format, i) => (
          <OutputCard key={format.format} format={format} index={i} onSelect={onSelect} />
        ))}
      </div>

      {techFormats.length > 0 && (
        <>
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium text-center">
              Technical Options
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techFormats.map((format, i) => (
              <OutputCard
                key={format.format}
                format={format}
                index={mainFormats.length + i}
                onSelect={onSelect}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

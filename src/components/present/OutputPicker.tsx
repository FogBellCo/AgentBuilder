import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { outputFormats } from '@/data/output-formats';
import { OutputCard } from './OutputCard';
import type { OutputFormat, OutputFormatInfo } from '@/types/decision-tree';

interface OutputPickerProps {
  onSelect: (format: OutputFormatInfo) => void;
  onMultiSelect?: (outputs: Array<{ format: OutputFormat; description: string }>) => void;
}

export function OutputPicker({ onSelect, onMultiSelect }: OutputPickerProps) {
  const [selected, setSelected] = useState<
    Map<OutputFormat, string>
  >(new Map());

  const allFormats = outputFormats;

  const handleToggle = (format: OutputFormatInfo) => {
    if (!onMultiSelect) {
      onSelect(format);
      return;
    }
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(format.format)) {
        next.delete(format.format);
      } else {
        next.set(format.format, '');
      }
      return next;
    });
  };

  const handleDescriptionChange = (format: OutputFormat, description: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(format, description);
      return next;
    });
  };

  const handleContinue = () => {
    if (!onMultiSelect || selected.size === 0) return;
    const outputs = Array.from(selected.entries()).map(([format, description]) => ({
      format,
      description,
    }));
    onMultiSelect(outputs);
  };

  const isMultiMode = !!onMultiSelect;

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
          {isMultiMode
            ? 'Select one or more output formats. You can add a description for each.'
            : 'Choose the format that best fits how you and your audience will use the AI output.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {allFormats.map((format, i) => (
          <OutputCard
            key={format.format}
            format={format}
            index={i}
            onSelect={() => handleToggle(format)}
            isSelected={selected.has(format.format)}
            isMultiMode={isMultiMode}
            description={selected.get(format.format) ?? ''}
            onDescriptionChange={(desc) =>
              handleDescriptionChange(format.format, desc)
            }
          />
        ))}
      </div>

      {isMultiMode && selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <button
            onClick={handleContinue}
            className="group flex items-center gap-3 rounded-lg bg-blue px-8 py-3 text-white font-medium tracking-wide uppercase text-sm hover:bg-navy transition-colors"
          >
            Continue with {selected.size} format{selected.size > 1 ? 's' : ''}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Info } from 'lucide-react';
import type { DecisionNode } from '@/types/decision-tree';
import { OptionButton } from './OptionButton';

interface QuestionCardProps {
  node: DecisionNode;
  onSelectOption: (optionId: string) => void;
  onSelectMultiple?: (optionIds: string[]) => void;
}

export function QuestionCard({ node, onSelectOption, onSelectMultiple }: QuestionCardProps) {
  const isResult = node.inputType === 'confirmation';
  const isMulti = node.inputType === 'multi_choice';
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleToggle = (optionId: string) => {
    if (!isMulti) {
      onSelectOption(optionId);
      return;
    }

    // "I'm not sure" (dont-know) is exclusive — selecting it clears others
    const isExclusive = optionId === 'dont-know';

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        if (isExclusive) {
          // Clear all others when selecting exclusive option
          next.clear();
          next.add(optionId);
        } else {
          // Remove exclusive option if selecting a non-exclusive one
          next.delete('dont-know');
          next.add(optionId);
        }
      }
      return next;
    });
  };

  const handleContinue = () => {
    if (isMulti && selected.size > 0 && onSelectMultiple) {
      onSelectMultiple(Array.from(selected));
    }
  };

  // Check if description looks like guidance/hint text (for Refine callout styling)
  const isGuidanceDescription =
    node.description && node.description.toLowerCase().includes('you can combine');

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl"
    >
      <div className={`mb-8 ${isResult ? 'text-center' : ''}`}>
        <h2 className="text-2xl font-bold text-navy leading-tight">
          {node.question}
        </h2>
        {node.description && (
          isGuidanceDescription ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border-2 border-blue/20 bg-blue/5 px-4 py-3">
              <Info className="h-4 w-4 text-blue shrink-0 mt-0.5" />
              <p className="text-sm text-blue font-medium leading-relaxed">
                {node.description}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {node.description}
            </p>
          )
        )}
      </div>

      <div className="flex flex-col gap-3">
        {node.options.map((option, i) => (
          <OptionButton
            key={option.id}
            option={option}
            index={i}
            onSelect={handleToggle}
            isSelected={isMulti ? selected.has(option.id) : undefined}
            isMultiMode={isMulti}
          />
        ))}
      </div>

      {isMulti && selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex justify-center"
        >
          <button
            onClick={handleContinue}
            className="group flex items-center gap-3 rounded-lg bg-blue px-8 py-3 text-white font-medium tracking-wide uppercase text-sm hover:bg-navy transition-colors"
          >
            Continue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

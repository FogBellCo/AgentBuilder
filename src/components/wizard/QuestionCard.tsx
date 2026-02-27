import { motion } from 'framer-motion';
import type { DecisionNode } from '@/types/decision-tree';
import { OptionButton } from './OptionButton';

interface QuestionCardProps {
  node: DecisionNode;
  onSelectOption: (optionId: string) => void;
}

export function QuestionCard({ node, onSelectOption }: QuestionCardProps) {
  const isResult = node.inputType === 'confirmation';

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
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            {node.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {node.options.map((option, i) => (
          <OptionButton
            key={option.id}
            option={option}
            index={i}
            onSelect={onSelectOption}
          />
        ))}
      </div>
    </motion.div>
  );
}

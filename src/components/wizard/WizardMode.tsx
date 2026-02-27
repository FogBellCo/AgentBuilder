import { ArrowLeft } from 'lucide-react';
import { useDecisionTree } from '@/hooks/use-decision-tree';
import { QuestionCard } from './QuestionCard';
import type { Stage } from '@/types/decision-tree';

interface WizardModeProps {
  stage: Stage;
}

const stageLabels: Record<Stage, string> = {
  GATHER: 'Gather',
  REFINE: 'Refine',
  PRESENT: 'Present',
};

export function WizardMode({ stage }: WizardModeProps) {
  const { currentNode, selectOption, goBack, canGoBack } = useDecisionTree(stage);

  if (!currentNode) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-2xl mb-6">
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
          )}
          <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
            Stage: {stageLabels[stage]}
          </span>
        </div>
      </div>

      <QuestionCard node={currentNode} onSelectOption={selectOption} />
    </div>
  );
}

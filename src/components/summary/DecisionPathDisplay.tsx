import { ChevronRight } from 'lucide-react';
import type { Stage, DecisionNode } from '@/types/decision-tree';
import { gatherTree } from '@/data/gather-tree';
import { refineTree } from '@/data/refine-tree';
import { presentTree } from '@/data/present-tree';

interface DecisionPathDisplayProps {
  stage: Stage;
  stageAnswers: Record<string, string>;
}

const treeLookup: Record<Stage, DecisionNode[]> = {
  GATHER: gatherTree,
  REFINE: refineTree,
  PRESENT: presentTree,
};

interface PathStep {
  question: string;
  selectedLabels: string[];
}

function reconstructPath(
  tree: DecisionNode[],
  answers: Record<string, string>,
): PathStep[] {
  const steps: PathStep[] = [];
  const nodeMap = new Map(tree.map((n) => [n.id, n]));

  for (const [nodeId, answerValue] of Object.entries(answers)) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    // Handle multi_choice (comma-separated IDs) and single_choice
    const selectedIds = answerValue.split(',').filter(Boolean);
    const selectedLabels = selectedIds
      .map((id) => {
        const opt = node.options.find((o) => o.id === id);
        return opt?.label ?? id;
      })
      .filter(Boolean);

    if (selectedLabels.length > 0) {
      steps.push({
        question: node.question,
        selectedLabels,
      });
    }
  }

  return steps;
}

export function DecisionPathDisplay({ stage, stageAnswers }: DecisionPathDisplayProps) {
  const tree = treeLookup[stage];
  const steps = reconstructPath(tree, stageAnswers);

  if (steps.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">No decision path recorded.</p>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-navy">Decision Path:</span>
      <div className="ml-2 space-y-1.5">
        {steps.map((step, i) => (
          <div key={i} className="text-xs">
            <p className="text-gray-500">{step.question}</p>
            {step.selectedLabels.map((label, j) => (
              <div key={j} className="flex items-center gap-1 ml-2 mt-0.5">
                <ChevronRight className="h-3 w-3 text-blue shrink-0" />
                <span className="text-navy font-medium">{label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

import type {
  DecisionNode,
  Stage,
  ProtectionLevel,
  OutputFormat,
  FeasibilityResult,
} from '@/types/decision-tree';
import { gatherTree } from '@/data/gather-tree';
import { refineTree } from '@/data/refine-tree';
import { presentTree } from '@/data/present-tree';
import { feasibilityMatrix } from '@/data/feasibility-matrix';

const treeLookup: Record<Stage, DecisionNode[]> = {
  GATHER: gatherTree,
  REFINE: refineTree,
  PRESENT: presentTree,
};

export function getTreeForStage(stage: Stage): DecisionNode[] {
  return treeLookup[stage];
}

export function getStartNode(stage: Stage): DecisionNode {
  const tree = treeLookup[stage];
  return tree[0];
}

export function getNodeById(stage: Stage, nodeId: string): DecisionNode | undefined {
  return treeLookup[stage].find((n) => n.id === nodeId);
}

export function classifyProtectionLevel(
  answers: Record<string, string>,
  stage: Stage,
): ProtectionLevel | undefined {
  const tree = treeLookup[stage];
  for (const node of tree) {
    if (!node.classifiesProtectionLevel) continue;
    const selectedOptionId = answers[node.id];
    if (!selectedOptionId) continue;
    const option = node.options.find((o) => o.id === selectedOptionId);
    if (option?.mapsToProtectionLevel) {
      return option.mapsToProtectionLevel;
    }
  }
  return undefined;
}

export function checkFeasibility(
  outputFormat: OutputFormat,
  protectionLevel: ProtectionLevel,
): FeasibilityResult {
  return feasibilityMatrix[outputFormat][protectionLevel];
}

export function mapOptionIdToOutputFormat(optionId: string): OutputFormat | undefined {
  const mapping: Record<string, OutputFormat> = {
    'pick-chat': 'chat',
    'pick-dashboard': 'dashboard',
    'pick-report': 'static_report',
    'pick-app': 'interactive_app',
    'pick-email': 'email_digest',
    'pick-slides': 'slide_deck',
    'pick-alerts': 'smart_alerts',
    'pick-kb': 'knowledge_base',
    'pick-api': 'api_feed',
  };
  return mapping[optionId];
}

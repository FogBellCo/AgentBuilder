import type { Node, Edge } from '@xyflow/react';
import type { Stage, StageStatus } from '@/types/decision-tree';

export interface StageNodeData {
  stage: Stage;
  label: string;
  tagline: string;
  icon: string;
  status: StageStatus;
  [key: string]: unknown;
}

const stageConfig: Array<{ stage: Stage; label: string; tagline: string; icon: string }> = [
  { stage: 'GATHER', label: 'Gather', tagline: 'Where is your data?', icon: 'Search' },
  { stage: 'REFINE', label: 'Refine', tagline: 'What will AI do?', icon: 'Sliders' },
  { stage: 'PRESENT', label: 'Present', tagline: 'How to show results?', icon: 'Monitor' },
];

export function buildPipelineNodes(
  statuses: Record<Stage, StageStatus>,
): Node<StageNodeData>[] {
  return stageConfig.map((cfg, i) => ({
    id: cfg.stage,
    type: 'stageNode',
    position: { x: i * 320, y: 0 },
    data: {
      stage: cfg.stage,
      label: cfg.label,
      tagline: cfg.tagline,
      icon: cfg.icon,
      status: statuses[cfg.stage],
    },
  }));
}

export function buildPipelineEdges(): Edge[] {
  return [
    {
      id: 'gather-refine',
      source: 'GATHER',
      target: 'REFINE',
      type: 'stageEdge',
      animated: true,
    },
    {
      id: 'refine-present',
      source: 'REFINE',
      target: 'PRESENT',
      type: 'stageEdge',
      animated: true,
    },
  ];
}

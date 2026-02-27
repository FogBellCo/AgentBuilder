import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

export function StageEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{ stroke: '#CED4DA', strokeWidth: 2 }}
    />
  );
}

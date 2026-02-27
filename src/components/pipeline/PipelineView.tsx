import { useCallback, useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, type NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';
import { buildPipelineNodes, buildPipelineEdges } from '@/lib/flow-layout';
import { StageNode } from './StageNode';
import { StageEdge } from './StageEdge';
import type { Stage } from '@/types/decision-tree';

const nodeTypes = { stageNode: StageNode };
const edgeTypes = { stageEdge: StageEdge };

function PipelineFlow() {
  const navigate = useNavigate();
  const { stages, setCurrentStage } = useSessionStore();

  const statuses = useMemo(
    () => ({
      GATHER: stages.GATHER.status,
      REFINE: stages.REFINE.status,
      PRESENT: stages.PRESENT.status,
    }),
    [stages],
  );

  const initialNodes = useMemo(() => buildPipelineNodes(statuses), [statuses]);
  const initialEdges = useMemo(() => buildPipelineEdges(), []);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const stage = node.id as Stage;

      // If stage is P4-complete, go to guidance instead
      if (stages[stage].status === 'complete' && stages[stage].result?.protectionLevel === 'P4') {
        navigate('/guidance/p4');
        return;
      }

      setCurrentStage(stage);
      navigate(`/stage/${stage.toLowerCase()}`);
    },
    [navigate, setCurrentStage, stages],
  );

  return (
    <div className="h-[300px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
      />
    </div>
  );
}

export function PipelineView() {
  return (
    <ReactFlowProvider>
      <PipelineFlow />
    </ReactFlowProvider>
  );
}

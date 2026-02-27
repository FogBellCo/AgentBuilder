import { useCallback } from 'react';
import { useSessionStore } from '@/store/session-store';
import { getStartNode, getNodeById, classifyProtectionLevel, mapOptionIdToOutputFormat } from '@/lib/tree-engine';
import type { Stage, DecisionNode } from '@/types/decision-tree';

export function useDecisionTree(stage: Stage) {
  const {
    currentNodeId,
    setCurrentNode,
    recordAnswer,
    completeStage,
    pushHistory,
    popHistory,
    stageAnswers,
    stages,
  } = useSessionStore();

  const startNode = getStartNode(stage);
  const currentNode: DecisionNode | undefined = currentNodeId
    ? getNodeById(stage, currentNodeId)
    : startNode;

  const selectOption = useCallback(
    (optionId: string) => {
      if (!currentNode) return;

      recordAnswer(stage, currentNode.id, optionId);
      pushHistory(stage, currentNode.id);

      const option = currentNode.options.find((o) => o.id === optionId);
      if (!option) return;

      if (option.nextNodeId === null) {
        // End of stage
        const answers = { ...stageAnswers[stage], [currentNode.id]: optionId };
        const protectionLevel = classifyProtectionLevel(answers, stage) ??
          (stages.GATHER.result?.protectionLevel ?? 'P1');

        const outputFormat = stage === 'PRESENT'
          ? mapOptionIdToOutputFormat(answers['present-format'] ?? '')
          : undefined;

        completeStage(stage, protectionLevel, outputFormat);
      } else {
        setCurrentNode(option.nextNodeId);
      }
    },
    [currentNode, stage, stageAnswers, stages, recordAnswer, pushHistory, completeStage, setCurrentNode],
  );

  const goBack = useCallback(() => {
    const prev = popHistory();
    if (prev) {
      setCurrentNode(prev.nodeId);
    }
  }, [popHistory, setCurrentNode]);

  return {
    currentNode,
    selectOption,
    goBack,
    canGoBack: useSessionStore.getState().history.length > 0,
  };
}

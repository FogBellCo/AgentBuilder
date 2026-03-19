import { useCallback } from 'react';
import { useSessionStore } from '@/store/session-store';
import { getStartNode, getNodeById, classifyProtectionLevel, mapOptionIdToOutputFormat } from '@/lib/tree-engine';
import type { Stage, DecisionNode, ProtectionLevel } from '@/types/decision-tree';

const protectionLevelRank: Record<string, number> = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
};

const confirmNodeForLevel: Record<string, string> = {
  P1: 'gather-confirm-p1',
  P2: 'gather-confirm-p2',
  P3: 'gather-confirm-p3',
  P4: 'gather-p4-stop',
};

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

      // For free_text nodes, use node-level nextNodeId
      if (currentNode.inputType === 'free_text') {
        const nextId = currentNode.nextNodeId;
        if (nextId === null || nextId === undefined) {
          // End of stage
          const answers = { ...stageAnswers[stage], [currentNode.id]: optionId };
          const protectionLevel = classifyProtectionLevel(answers, stage) ??
            (stages.GATHER.result?.protectionLevel ?? 'P1');
          const outputFormat = stage === 'PRESENT'
            ? mapOptionIdToOutputFormat(answers['present-format'] ?? '')
            : undefined;
          completeStage(stage, protectionLevel, outputFormat);
        } else {
          setCurrentNode(nextId);
        }
        return;
      }

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

  const selectMultipleOptions = useCallback(
    (optionIds: string[]) => {
      if (!currentNode) return;

      // Store as comma-separated IDs
      const combinedId = optionIds.join(',');
      recordAnswer(stage, currentNode.id, combinedId);
      pushHistory(stage, currentNode.id);

      // Handle "I'm not sure" — exclusive, go to help flow
      if (optionIds.length === 1 && optionIds[0] === 'dont-know') {
        const option = currentNode.options.find((o) => o.id === 'dont-know');
        if (option?.nextNodeId) {
          setCurrentNode(option.nextNodeId);
        }
        return;
      }

      // If this node classifies protection level, find the most restrictive and navigate to confirm
      if (currentNode.classifiesProtectionLevel) {
        let highestLevel: ProtectionLevel = 'P1';
        let highestRank = 0;

        for (const optId of optionIds) {
          const option = currentNode.options.find((o) => o.id === optId);
          if (!option) continue;

          if (option.mapsToProtectionLevel) {
            const rank = protectionLevelRank[option.mapsToProtectionLevel] ?? 0;
            if (rank > highestRank) {
              highestRank = rank;
              highestLevel = option.mapsToProtectionLevel;
            }
          }
        }

        const confirmNodeId = confirmNodeForLevel[highestLevel];
        if (confirmNodeId) {
          setCurrentNode(confirmNodeId);
        }
        return;
      }

      // For non-classification multi-choice: navigate using the first selected option's nextNodeId
      const firstSelectedOption = currentNode.options.find((o) => optionIds.includes(o.id));
      if (firstSelectedOption) {
        if (firstSelectedOption.nextNodeId === null) {
          // End of stage
          const answers = { ...stageAnswers[stage], [currentNode.id]: combinedId };
          const protectionLevel = classifyProtectionLevel(answers, stage) ??
            (stages.GATHER.result?.protectionLevel ?? 'P1');
          const outputFormat = stage === 'PRESENT'
            ? mapOptionIdToOutputFormat(answers['present-format'] ?? '')
            : undefined;
          completeStage(stage, protectionLevel, outputFormat);
        } else {
          setCurrentNode(firstSelectedOption.nextNodeId);
        }
      }
    },
    [currentNode, stage, stageAnswers, stages, recordAnswer, pushHistory, setCurrentNode, completeStage],
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
    selectMultipleOptions,
    goBack,
    canGoBack: useSessionStore.getState().history.length > 0,
  };
}

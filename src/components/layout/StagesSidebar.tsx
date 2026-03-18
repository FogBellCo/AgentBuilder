import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Lightbulb,
  Search,
  Sliders,
  Monitor,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { getNodeById } from '@/lib/tree-engine';
import { cn } from '@/lib/utils';
import type { Stage } from '@/types/decision-tree';

const stageOrder: Stage[] = ['GATHER', 'REFINE', 'PRESENT'];

const stageConfig: Record<Stage, { label: string; icon: typeof Search }> = {
  GATHER: { label: 'Your Data', icon: Search },
  REFINE: { label: 'Your Task', icon: Sliders },
  PRESENT: { label: 'Your Output', icon: Monitor },
};

interface QuestionItem {
  id: string;
  label: string;
  status: 'answered' | 'current' | 'upcoming';
  nodeId?: string;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + '...' : text;
}

export function StagesSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    stages,
    projectIdea,
    currentStage,
    currentNodeId,
    history,
    gatherDetails,
    refineDetails,
    presentDetails,
    setCurrentStage,
    setCurrentNode,
  } = useSessionStore();

  const path = location.pathname;

  // Hide on landing and describe pages
  if (path === '/' || path === '/describe') {
    return null;
  }

  const allComplete = stageOrder.every((s) => stages[s].status === 'complete');

  const isStageBlocked = (stage: Stage): boolean => {
    if (stage === 'GATHER') return false;
    if (stage === 'REFINE') return stages.GATHER.status !== 'complete';
    if (stage === 'PRESENT') return stages.REFINE.status !== 'complete';
    return false;
  };

  // Build question items for GATHER and REFINE stages (tree-based)
  function buildTreeItems(stage: Stage): QuestionItem[] {
    const items: QuestionItem[] = [];
    const status = stages[stage].status;

    if (status === 'not_started') return items;

    // Get answered nodes in order from history
    const stageHistory = history
      .filter((h) => h.stage === stage)
      .map((h) => h.nodeId);

    // Deduplicate while preserving order
    const seen = new Set<string>();
    const orderedNodeIds: string[] = [];
    for (const nodeId of stageHistory) {
      if (!seen.has(nodeId)) {
        seen.add(nodeId);
        orderedNodeIds.push(nodeId);
      }
    }

    // Add answered questions
    for (const nodeId of orderedNodeIds) {
      const node = getNodeById(stage, nodeId);
      if (node) {
        items.push({
          id: nodeId,
          label: truncate(node.question, 35),
          status: 'answered',
          nodeId,
        });
      }
    }

    // Add current node if stage is in progress
    if (status === 'in_progress' && currentStage === stage && currentNodeId) {
      if (!seen.has(currentNodeId)) {
        const node = getNodeById(stage, currentNodeId);
        if (node) {
          items.push({
            id: currentNodeId,
            label: truncate(node.question, 35),
            status: 'current',
            nodeId: currentNodeId,
          });
        }
      }
    }

    // Add detail form item for completed stages
    if (status === 'complete') {
      if (stage === 'GATHER') {
        items.push({
          id: 'gather-details',
          label: 'More about your data',
          status: gatherDetails ? 'answered' : 'current',
        });
      }
      if (stage === 'REFINE') {
        items.push({
          id: 'refine-details',
          label: 'More about your tasks',
          status: refineDetails ? 'answered' : 'current',
        });
      }
    }

    return items;
  }

  // Build items for PRESENT stage (no tree, uses OutputPicker flow)
  function buildPresentItems(): QuestionItem[] {
    const items: QuestionItem[] = [];
    const status = stages.PRESENT.status;

    if (status === 'not_started') return items;

    if (status === 'in_progress') {
      // We don't know the internal presentStep from here,
      // so show the stage as a single active item
      items.push({
        id: 'present-pick',
        label: 'Pick output format',
        status: 'current',
      });
    }

    if (status === 'complete') {
      items.push({
        id: 'present-pick',
        label: 'Pick output format',
        status: 'answered',
      });
      items.push({
        id: 'present-feasibility',
        label: 'Compatibility check',
        status: presentDetails ? 'answered' : 'current',
      });
    }

    return items;
  }

  function handleStageHeaderClick(stage: Stage) {
    if (isStageBlocked(stage)) return;
    if (allComplete) return;

    // P4-complete GATHER goes to guidance
    if (
      stage === 'GATHER' &&
      stages.GATHER.status === 'complete' &&
      stages.GATHER.result?.protectionLevel === 'P4'
    ) {
      navigate('/guidance/p4');
      return;
    }

    setCurrentStage(stage);
    navigate(`/stage/${stage.toLowerCase()}`);
  }

  function handleQuestionClick(stage: Stage, item: QuestionItem) {
    if (allComplete) return;

    if (item.id === 'gather-details' || item.id === 'refine-details') {
      // Navigate to the stage page; Stage.tsx handles showing the detail form
      navigate(`/stage/${stage.toLowerCase()}`);
      return;
    }

    if (item.id === 'present-pick' || item.id === 'present-feasibility') {
      navigate('/stage/present');
      return;
    }

    // Navigate to a specific tree node
    if (item.nodeId) {
      setCurrentStage(stage);
      setCurrentNode(item.nodeId);
      navigate(`/stage/${stage.toLowerCase()}`);
    }
  }

  const isOnStage = (stage: Stage) =>
    path === `/stage/${stage.toLowerCase()}` ||
    (stage === 'GATHER' && path.startsWith('/guidance/'));

  return (
    <aside data-sidebar className="hidden md:block w-60 border-r border-gray-200 bg-white shrink-0">
      <nav className="sticky top-0 py-5 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">

        {/* Your Idea */}
        <button
          onClick={() => navigate('/describe')}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
            path === '/describe' ? 'bg-blue/5 text-blue' : 'text-navy hover:bg-gray-50',
          )}
        >
          {projectIdea
            ? <CheckCircle2 className="h-3.5 w-3.5 text-green shrink-0" />
            : <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          }
          <Lightbulb className={cn('h-3.5 w-3.5 shrink-0', path === '/describe' ? 'text-blue' : 'text-gray-400')} />
          <span className="text-xs font-semibold uppercase tracking-wider">Your Request</span>
        </button>

        {/* Stage sections */}
        {stageOrder.map((stage) => {
          const config = stageConfig[stage];
          const status = stages[stage].status;
          const blocked = isStageBlocked(stage);
          const active = isOnStage(stage);
          const items = stage === 'PRESENT' ? buildPresentItems() : buildTreeItems(stage);

          const StageIcon = config.icon;

          return (
            <div key={stage} className="mt-2">
              {/* Stage header */}
              <button
                onClick={() => handleStageHeaderClick(stage)}
                disabled={blocked}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                  active && !blocked && 'bg-blue/5 text-blue',
                  !active && !blocked && 'text-navy hover:bg-gray-50',
                  blocked && 'text-gray-300 cursor-not-allowed',
                )}
              >
                {status === 'complete'
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green shrink-0" />
                  : status === 'in_progress'
                    ? <ChevronRight className="h-3.5 w-3.5 text-blue shrink-0" />
                    : <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                }
                <StageIcon className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  active && !blocked ? 'text-blue' : blocked ? 'text-gray-300' : 'text-gray-400',
                )} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {config.label}
                </span>
              </button>

              {/* Question items (only if stage has been started) */}
              {items.length > 0 && (
                <ul className="ml-4 mt-0.5 space-y-px border-l border-gray-100 pl-2">
                  {items.map((item) => {
                    const isCurrent = item.status === 'current';
                    const isAnswered = item.status === 'answered';

                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleQuestionClick(stage, item)}
                          className={cn(
                            'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors',
                            isCurrent && 'bg-blue/5 text-blue',
                            isAnswered && 'text-gray-600 hover:bg-gray-50',
                            !isCurrent && !isAnswered && 'text-gray-400',
                          )}
                        >
                          {isAnswered
                            ? <CheckCircle2 className="h-3 w-3 text-green shrink-0" />
                            : isCurrent
                              ? <ChevronRight className="h-3 w-3 text-blue shrink-0" />
                              : <Circle className="h-3 w-3 text-gray-300 shrink-0" />
                          }
                          <span className="text-[11px] leading-tight truncate">
                            {item.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        {/* Divider + Summary */}
        <div className="my-3 border-t border-gray-100" />

        <button
          onClick={() => allComplete && navigate('/summary')}
          disabled={!allComplete}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
            path === '/summary' && 'bg-blue/5 text-blue',
            path !== '/summary' && allComplete && 'text-navy hover:bg-gray-50',
            !allComplete && 'text-gray-300 cursor-not-allowed',
          )}
        >
          {allComplete
            ? <CheckCircle2 className="h-3.5 w-3.5 text-green shrink-0" />
            : <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          }
          <FileText className={cn(
            'h-3.5 w-3.5 shrink-0',
            path === '/summary' ? 'text-blue' : allComplete ? 'text-gray-400' : 'text-gray-300',
          )} />
          <span className="text-xs font-semibold uppercase tracking-wider">Summary</span>
        </button>
      </nav>
    </aside>
  );
}

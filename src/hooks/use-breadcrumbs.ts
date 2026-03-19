import { useMemo } from 'react';
import { useSessionStore } from '@/store/session-store';
import { getNodeById } from '@/lib/tree-engine';

export interface Breadcrumb {
  label: string;
  path?: string;
}

export function useBreadcrumbs(): Breadcrumb[] {
  const { currentStage, currentNodeId } = useSessionStore();

  return useMemo(() => {
    const crumbs: Breadcrumb[] = [{ label: 'Home', path: '/' }];

    if (!currentStage) {
      crumbs.push({ label: 'Your Request', path: '/pipeline' });
      return crumbs;
    }

    crumbs.push({ label: 'Your Request', path: '/pipeline' });

    const stageLabels = { GATHER: 'Your Data', REFINE: 'Your Task', PRESENT: 'Your Output' };
    crumbs.push({ label: stageLabels[currentStage], path: `/stage/${currentStage.toLowerCase()}` });

    if (currentNodeId) {
      const node = getNodeById(currentStage, currentNodeId);
      if (node) {
        const shortLabel = node.question.length > 30
          ? node.question.substring(0, 30) + '...'
          : node.question;
        crumbs.push({ label: shortLabel });
      }
    }

    return crumbs;
  }, [currentStage, currentNodeId]);
}

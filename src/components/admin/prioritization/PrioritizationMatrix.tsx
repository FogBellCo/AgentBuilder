import { useState, useMemo } from 'react';
import { ScatterChart as ScatterIcon, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminSubmissions } from '@/hooks/use-admin-submissions';
import { ScatterPlotView } from './ScatterPlot';
import { RankedList } from './RankedList';

type ViewMode = 'scatter' | 'list';

export function PrioritizationMatrix() {
  const [view, setView] = useState<ViewMode>('scatter');

  // Fetch all non-archived submissions
  const { data, isLoading, error } = useAdminSubmissions({
    page: 1,
    pageSize: 100,
    status: ['submitted', 'in_review', 'needs_info', 'approved', 'building'],
  });

  const submissions = data?.submissions ?? [];

  // Use pre-computed priority scores from the backend
  const scoredData = useMemo(() => {
    return submissions
      .filter((sub) => sub.priorityScores !== null)
      .map((sub) => ({
        id: sub.id,
        title: sub.title,
        impact: sub.priorityScores!.impact,
        effort: sub.priorityScores!.effort,
        priority: sub.priorityScores!.priority,
        status: sub.status,
        protectionLevel: sub.protectionLevel,
      }));
  }, [submissions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Prioritization Matrix</h1>
        <div className="flex items-center rounded-lg border border-gray-300 bg-white">
          <button
            onClick={() => setView('scatter')}
            className={cn(
              'flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'scatter' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            <ScatterIcon className="h-3.5 w-3.5" />
            Scatter
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'list' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            <List className="h-3.5 w-3.5" />
            Ranked List
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue" />
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-red-500">
          Failed to load submissions.
        </div>
      ) : view === 'scatter' ? (
        <ScatterPlotView data={scoredData} />
      ) : (
        <RankedList data={scoredData} />
      )}
    </div>
  );
}

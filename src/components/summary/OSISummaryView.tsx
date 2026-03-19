import type { OSISummary } from '@/types/summaries';
import { OSIProcessOverview } from './OSIProcessOverview';
import { OSIScoringColumns } from './OSIScoringColumns';
import { OSINarrativeColumns } from './OSINarrativeColumns';
import { OSISavingsSection } from './OSISavingsSection';

interface OSISummaryViewProps {
  summary: OSISummary;
}

/**
 * Full UCSD template layout for the OSI-facing summary.
 * Admin-only — never shown to end users.
 */
export function OSISummaryView({ summary }: OSISummaryViewProps) {
  return (
    <div className="space-y-6">
      {/* Process Overview */}
      <OSIProcessOverview processOverview={summary.processOverview} />

      {/* Three-Column Scoring */}
      <OSIScoringColumns
        desirability={summary.desirability}
        viability={summary.viability}
        feasibility={summary.feasibility}
      />

      {/* Metadata Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            VC Area
          </h4>
          <p className="text-sm text-navy font-medium">{summary.metadata.vcArea}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Submitted by
          </h4>
          <p className="text-sm text-navy font-medium">{summary.metadata.submittedBy}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            On behalf of
          </h4>
          <p className="text-sm text-navy font-medium">{summary.metadata.onBehalfOf}</p>
        </div>
      </div>

      {/* Context / Challenge / Request */}
      <OSINarrativeColumns
        context={summary.context}
        challenge={summary.challenge}
        request={summary.request}
      />

      {/* Savings */}
      <OSISavingsSection savings={summary.savings} />
    </div>
  );
}

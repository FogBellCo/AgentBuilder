import type { OSISummary } from '@/types/summaries';

interface OSIProcessOverviewProps {
  processOverview: OSISummary['processOverview'];
}

export function OSIProcessOverview({ processOverview }: OSIProcessOverviewProps) {
  return (
    <div className="rounded-lg border-2 border-navy/20 bg-white overflow-hidden">
      <div className="bg-navy px-5 py-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">
          Process Overview
        </h3>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Purpose
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {processOverview.purpose}
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Description
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {processOverview.description}
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Key Points
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {processOverview.keyPoints.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Solution Considerations */}
      <div className="border-t border-gray-200 bg-navy/5 px-5 py-3">
        <h3 className="text-xs font-bold text-navy uppercase tracking-widest">
          AI Solution Considerations
        </h3>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Potential Impact
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {processOverview.potentialImpact.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Questions & Considerations
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {processOverview.questionsAndConsiderations.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

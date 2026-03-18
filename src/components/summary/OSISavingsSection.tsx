import type { OSISummary } from '@/types/summaries';

interface OSISavingsSectionProps {
  savings: OSISummary['savings'];
}

export function OSISavingsSection({ savings }: OSISavingsSectionProps) {
  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
      <div className="bg-navy/5 px-5 py-3">
        <h3 className="text-xs font-bold text-navy uppercase tracking-widest">
          Savings
        </h3>
      </div>
      <div className="p-5 space-y-3">
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Time Savings
          </h4>
          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex justify-between">
              <span>Expected Volume</span>
              <span className="font-medium text-navy">{savings.expectedVolume}</span>
            </div>
            <div className="flex justify-between">
              <span>Time spent per instance</span>
              <span className="font-medium text-navy">{savings.timePerInstance}</span>
            </div>
            <div className="flex justify-between">
              <span>Potential time savings per instance</span>
              <span className="font-medium text-navy">{savings.savingsPercentage}</span>
            </div>
            <div className="flex justify-between">
              <span>Time savings</span>
              <span className="font-medium text-navy">{savings.timeSavings}</span>
            </div>
          </div>
        </div>

        {savings.impactBullets.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Impact
            </h4>
            <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
              {savings.impactBullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

import type { OSISummary } from '@/types/summaries';

interface OSIScoringColumnsProps {
  desirability: OSISummary['desirability'];
  viability: OSISummary['viability'];
  feasibility: OSISummary['feasibility'];
}

function ScoringField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline text-xs py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-navy text-right">{value}</span>
    </div>
  );
}

export function OSIScoringColumns({
  desirability,
  viability,
  feasibility,
}: OSIScoringColumnsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Desirability */}
      <div className="rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
        <div className="bg-blue/10 px-4 py-2.5">
          <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest">
            Desirability
          </h4>
        </div>
        <div className="px-4 py-3">
          <ScoringField label="Customer Size" value={desirability.customerSize} />
          <ScoringField label="Customer Need" value={desirability.customerNeed} />
        </div>
      </div>

      {/* Viability */}
      <div className="rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
        <div className="bg-blue/10 px-4 py-2.5">
          <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest">
            Viability
          </h4>
        </div>
        <div className="px-4 py-3">
          <ScoringField label="Process Volume" value={viability.processVolume} />
          <ScoringField label="Savings per Cycle" value={viability.potentialSavingsPerCycle} />
          <ScoringField label="Savings per Month" value={viability.potentialSavingsPerMonth} />
        </div>
      </div>

      {/* Feasibility */}
      <div className="rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
        <div className="bg-blue/10 px-4 py-2.5">
          <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest">
            Feasibility
          </h4>
        </div>
        <div className="px-4 py-3">
          <ScoringField label="Alignment w/ Existing" value={feasibility.alignmentWithExisting} />
          <ScoringField label="Data Availability" value={feasibility.dataAvailability} />
          <ScoringField label="Complexity" value={feasibility.complexity} />
        </div>
      </div>
    </div>
  );
}

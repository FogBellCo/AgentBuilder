import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePriorityScores } from '@/lib/priority-score';
import type { ScoreOverrides } from '@/types/admin';

interface ScoreOverridePanelProps {
  sessionState: Record<string, unknown>;
  overrides: ScoreOverrides | null;
  onSave: (overrides: ScoreOverrides) => void;
  isSaving?: boolean;
}

export function ScoreOverridePanel({ sessionState, overrides, onSave, isSaving }: ScoreOverridePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const autoScores = calculatePriorityScores(sessionState);
  const currentScores = calculatePriorityScores(sessionState, overrides);

  const [localDesirability, setLocalDesirability] = useState<string>(String(overrides?.desirability ?? ''));
  const [localViability, setLocalViability] = useState<string>(String(overrides?.viability ?? ''));
  const [localFeasibility, setLocalFeasibility] = useState<string>(String(overrides?.feasibility ?? ''));

  function handleSave() {
    const o: ScoreOverrides = {};
    const d = parseInt(localDesirability);
    const v = parseInt(localViability);
    const f = parseInt(localFeasibility);
    if (!isNaN(d) && d >= 0 && d <= 100) o.desirability = d;
    if (!isNaN(v) && v >= 0 && v <= 100) o.viability = v;
    if (!isNaN(f) && f >= 0 && f <= 100) o.feasibility = f;
    onSave(o);
  }

  function handleReset() {
    setLocalDesirability('');
    setLocalViability('');
    setLocalFeasibility('');
    onSave({});
  }

  const hasOverrides = overrides && (overrides.desirability !== undefined || overrides.viability !== undefined || overrides.feasibility !== undefined);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-navy">OSI Scores</h3>
          {hasOverrides && (
            <span className="rounded bg-yellow/20 px-1.5 py-0.5 text-[10px] font-medium text-gold">Manual</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-4 py-3">
          {/* Current scores display */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <ScoreDisplay label="Impact" value={currentScores.impact} />
            <ScoreDisplay label="Effort" value={currentScores.effort} />
            <ScoreDisplay label="Priority" value={currentScores.priority} />
          </div>

          {/* Override inputs */}
          <div className="space-y-3">
            <ScoreInput
              label="Desirability"
              autoValue={autoScores.desirability}
              value={localDesirability}
              onChange={setLocalDesirability}
              isOverridden={overrides?.desirability !== undefined}
            />
            <ScoreInput
              label="Viability"
              autoValue={autoScores.viability}
              value={localViability}
              onChange={setLocalViability}
              isOverridden={overrides?.viability !== undefined}
            />
            <ScoreInput
              label="Feasibility"
              autoValue={autoScores.feasibility}
              value={localFeasibility}
              onChange={setLocalFeasibility}
              isOverridden={overrides?.feasibility !== undefined}
            />
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                'rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white',
                'hover:bg-navy/90 disabled:opacity-50',
              )}
            >
              {isSaving ? 'Saving...' : 'Save Overrides'}
            </button>
            {hasOverrides && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to Auto
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreDisplay({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-gray-50 p-2 text-center">
      <div className="text-xl font-bold text-navy">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function ScoreInput({
  label,
  autoValue,
  value,
  onChange,
  isOverridden,
}: {
  label: string;
  autoValue: number;
  value: string;
  onChange: (v: string) => void;
  isOverridden: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs text-gray-500">{label}</span>
      <span className="w-12 text-xs text-gray-400">Auto: {autoValue}</span>
      <input
        type="number"
        min={0}
        max={100}
        placeholder={String(autoValue)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-20 rounded border px-2 py-1 text-xs outline-none',
          isOverridden ? 'border-yellow bg-yellow/5' : 'border-gray-300',
          'focus:border-blue focus:ring-1 focus:ring-blue',
        )}
      />
      {isOverridden && (
        <span className="rounded bg-yellow/20 px-1 py-0.5 text-[10px] text-gold">Manual</span>
      )}
    </div>
  );
}

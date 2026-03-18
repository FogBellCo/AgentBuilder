import { Clock } from 'lucide-react';

interface TimeSavingsDisplayProps {
  displayText: string;
  monthlyHours: number;
}

/**
 * Shows the calculated time savings in a friendly format.
 * Never editable — the numbers are derived from user inputs.
 */
export function TimeSavingsDisplay({ displayText, monthlyHours }: TimeSavingsDisplayProps) {
  // Convert markdown-style bold to JSX
  const parts = displayText.split(/(\*\*[^*]+\*\*)/g);

  return (
    <div data-summary-section className="rounded-lg border-2 border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-blue" />
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
          Time Savings
        </h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="font-bold text-navy">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </p>

      {/* Visual indicator */}
      {monthlyHours >= 5 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue transition-all duration-500"
              style={{ width: `${Math.min((monthlyHours / 160) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider shrink-0">
            {monthlyHours >= 160 ? '1+ FTE' : `${Math.round(monthlyHours / 160 * 100)}% FTE`}
          </span>
        </div>
      )}
    </div>
  );
}

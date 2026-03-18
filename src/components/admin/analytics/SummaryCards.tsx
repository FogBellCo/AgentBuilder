import { FileText, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import type { AnalyticsSummary } from '@/types/admin';

interface SummaryCardsProps {
  summary: AnalyticsSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Submissions',
      value: summary.totalSubmissions,
      icon: FileText,
      color: 'text-blue',
      bg: 'bg-blue/10',
    },
    {
      label: 'Avg Completeness',
      value: `${Math.round(summary.avgCompleteness)}%`,
      icon: TrendingUp,
      color: 'text-green',
      bg: 'bg-green/10',
    },
    {
      label: 'Avg Time to Review',
      value: summary.avgTimeToReview > 0 ? `${summary.avgTimeToReview.toFixed(1)}d` : 'N/A',
      icon: Clock,
      color: 'text-gold',
      bg: 'bg-yellow/10',
    },
    {
      label: 'Needs Attention',
      value: summary.needsAttention,
      icon: AlertTriangle,
      color: 'text-orange',
      bg: 'bg-orange/10',
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-navy">{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

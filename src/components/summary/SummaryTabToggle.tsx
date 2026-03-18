import { cn } from '@/lib/utils';

export type SummaryTab = 'your-summary' | 'my-answers';

interface SummaryTabToggleProps {
  activeTab: SummaryTab;
  onTabChange: (tab: SummaryTab) => void;
}

const tabs: { id: SummaryTab; label: string }[] = [
  { id: 'your-summary', label: 'Your Summary' },
  { id: 'my-answers', label: 'My Answers' },
];

export function SummaryTabToggle({ activeTab, onTabChange }: SummaryTabToggleProps) {
  return (
    <div data-tab-toggle className="flex border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors',
            activeTab === tab.id
              ? 'text-navy border-b-2 border-navy'
              : 'text-gray-400 hover:text-gray-600',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

import type { ProtectionLevel } from '@/types/decision-tree';
import type { UserSummarySections } from '@/types/summaries';
import type { FallbackItem } from '@/lib/user-summary-builder';
import { UserSummarySection } from './UserSummarySection';
import { TimeSavingsDisplay } from './TimeSavingsDisplay';
import { WhatsNextSection } from './WhatsNextSection';

interface UserFriendlySummaryProps {
  /** AI-generated sections (null if not yet available) */
  sections: UserSummarySections | null;
  /** Manual edits keyed by section key */
  manualEdits: Record<string, string>;
  /** Handler when user edits a section */
  onEdit: (sectionKey: string, content: string) => void;
  /** Time savings display text (null if not calculable) */
  timeSavings: { displayText: string; monthlyHours: number } | null;
  /** What's Next content (pre-built template text) */
  whatsNext: string;
  /** Fallback data for when AI is unavailable */
  fallback: {
    yourProject: FallbackItem[];
    theData: FallbackItem[];
    whatAIWouldHandle: FallbackItem[];
    howYoudSeeResults: FallbackItem[];
  } | null;
  /** Protection level for display purposes */
  _protectionLevel: ProtectionLevel;
}

const sectionConfig: {
  key: keyof UserSummarySections;
  storeKey: string;
  title: string;
}[] = [
  { key: 'yourProject', storeKey: 'user_yourProject', title: 'Your Project' },
  { key: 'theData', storeKey: 'user_theData', title: 'The Data' },
  { key: 'whatAIWouldHandle', storeKey: 'user_whatAIWouldHandle', title: 'What AI Would Handle' },
  { key: 'howYoudSeeResults', storeKey: 'user_howYoudSeeResults', title: "How You'd See Results" },
];

export function UserFriendlySummary({
  sections,
  manualEdits,
  onEdit,
  timeSavings,
  whatsNext,
  fallback,
}: UserFriendlySummaryProps) {
  return (
    <div className="space-y-4">
      {sectionConfig.map((sec) => {
        const content = sections?.[sec.key] ?? '';
        const fallbackKey = sec.key as keyof NonNullable<typeof fallback>;
        const fallbackItems = !content && fallback ? fallback[fallbackKey] : undefined;

        return (
          <UserSummarySection
            key={sec.storeKey}
            sectionKey={sec.storeKey}
            title={sec.title}
            content={content}
            manualEdit={manualEdits[sec.storeKey]}
            onEdit={onEdit}
            editable
            fallbackItems={fallbackItems}
          />
        );
      })}

      {/* Time Savings — only shown if calculable */}
      {timeSavings && (
        <TimeSavingsDisplay
          displayText={timeSavings.displayText}
          monthlyHours={timeSavings.monthlyHours}
        />
      )}

      {/* What's Next — always shown */}
      <WhatsNextSection content={whatsNext} />
    </div>
  );
}

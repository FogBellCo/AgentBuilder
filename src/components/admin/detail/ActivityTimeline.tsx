import { Circle } from 'lucide-react';
import type { ActivityEvent } from '@/types/admin';

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

const EVENT_LABELS: Record<string, string> = {
  status_change: 'Status changed',
  note_added: 'Note added',
  question_sent: 'Follow-up question sent',
  assigned: 'Assigned',
  flagged: 'Flagged',
  score_override: 'Score overridden',
  exported: 'Exported',
  submission_created: 'Submission created',
  submission_updated: 'Submission updated',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        No activity yet
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-bold text-navy">Activity Timeline</h3>
      <div className="space-y-0">
        {events.map((event, i) => (
          <div key={event.id} className="relative flex gap-3 pb-4">
            {/* Vertical connector line */}
            {i < events.length - 1 && (
              <div className="absolute left-[7px] top-4 h-full w-px bg-gray-200" />
            )}
            {/* Dot */}
            <div className="relative z-10 mt-0.5 shrink-0">
              <Circle className="h-3.5 w-3.5 fill-blue text-blue" />
            </div>
            {/* Content */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {EVENT_LABELS[event.eventType] ?? event.eventType}
                {event.details?.toStatus ? (
                  <span className="ml-1 font-normal text-gray-500">
                    to &quot;{String(event.details.toStatus)}&quot;
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-gray-400">
                by {event.actor} &mdash; {formatDate(event.createdAt)}
              </p>
              {event.details?.content ? (
                <p className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-600 italic">
                  &quot;{String(event.details.content)}&quot;
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ArrowRight } from 'lucide-react';

interface WhatsNextSectionProps {
  content: string;
}

/**
 * Template-based "What's Next" section — never editable.
 * Content is pre-built by buildWhatsNext() based on protection level.
 */
export function WhatsNextSection({ content }: WhatsNextSectionProps) {
  // Split on double newlines to handle paragraphs (snoozed questions note)
  const paragraphs = content.split('\n\n').filter(Boolean);

  return (
    <div data-summary-section className="rounded-lg border-2 border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRight className="h-4 w-4 text-blue" />
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
          What's Next
        </h3>
      </div>
      <div className="space-y-2">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-sm text-gray-700 leading-relaxed">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

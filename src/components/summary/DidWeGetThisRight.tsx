import { Lightbulb, X } from 'lucide-react';

interface DidWeGetThisRightProps {
  onDismiss: () => void;
}

/**
 * Dismissible banner at the top of the user-facing summary.
 * Appears on first view, dismisses when user clicks "Got it" or edits any section.
 */
export function DidWeGetThisRight({ onDismiss }: DidWeGetThisRightProps) {
  return (
    <div className="rounded-lg border-2 border-blue/20 bg-blue/5 p-5 mb-6">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-navy mb-1">
            Did we get this right?
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Take a look through the summary below. You can click any section to
            edit it — we want to make sure this accurately represents your
            project.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex justify-end mt-3">
        <button
          onClick={onDismiss}
          className="rounded-lg bg-navy px-4 py-2 text-xs font-medium text-white uppercase tracking-wider hover:bg-blue transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

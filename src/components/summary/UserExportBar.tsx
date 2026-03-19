import { Download, Share2, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserExportBarProps {
  onDownloadPdf: () => void;
  onShare: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Simplified export bar for the user-facing summary.
 * Only shows: Download a copy (PDF), Share with a colleague, Submit to TritonAI.
 */
export function UserExportBar({
  onDownloadPdf,
  onShare,
  onSubmit,
  isSubmitting,
}: UserExportBarProps) {
  return (
    <div
      data-export-bar
      className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center pt-6 border-t border-gray-200 mt-6"
    >
      <button
        onClick={onDownloadPdf}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-xs font-medium text-navy hover:border-blue transition-colors uppercase tracking-wider"
      >
        <Download className="h-3.5 w-3.5" />
        Download a copy
      </button>
      <button
        onClick={onShare}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-xs font-medium text-navy hover:border-blue transition-colors uppercase tracking-wider"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share with a colleague
      </button>
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className={cn(
          'flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium text-white uppercase tracking-wider transition-colors',
          isSubmitting
            ? 'bg-navy/60 cursor-not-allowed'
            : 'bg-navy hover:bg-blue',
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5" />
            Submit to TritonAI
          </>
        )}
      </button>
    </div>
  );
}

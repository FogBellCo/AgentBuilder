import { Download, Copy, Share2, Printer, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryExportBarProps {
  onDownloadJson: () => void;
  onCopyMarkdown: () => void;
  onShareEmail: () => void;
  onPrint: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function SummaryExportBar({
  onDownloadJson,
  onCopyMarkdown,
  onShareEmail,
  onPrint,
  onSubmit,
  isSubmitting,
}: SummaryExportBarProps) {
  return (
    <div data-export-bar className="flex flex-wrap gap-3 justify-center pt-6 border-t border-gray-200 mt-6">
      <button
        onClick={onDownloadJson}
        className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-xs font-medium text-navy hover:border-blue transition-colors uppercase tracking-wider"
      >
        <Download className="h-3.5 w-3.5" />
        Download JSON
      </button>
      <button
        onClick={onCopyMarkdown}
        className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-xs font-medium text-navy hover:border-blue transition-colors uppercase tracking-wider"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy as Markdown
      </button>
      <button
        onClick={onShareEmail}
        className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-xs font-medium text-navy hover:border-blue transition-colors uppercase tracking-wider"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share via Email
      </button>
      <button
        onClick={onPrint}
        className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-xs font-medium text-navy hover:border-blue transition-colors uppercase tracking-wider"
      >
        <Printer className="h-3.5 w-3.5" />
        Print / Save as PDF
      </button>
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className={cn(
          'flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium text-white uppercase tracking-wider transition-colors',
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

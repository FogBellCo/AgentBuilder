import { useState } from 'react';
import { Copy, Download, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface PromptBundlePreviewProps {
  markdown: string | null;
  isLoading: boolean;
  onGenerate: () => void;
}

/**
 * Preview/copy/download UI for the Claude Code prompt bundle.
 * Admin-only component.
 */
export function PromptBundlePreview({
  markdown,
  isLoading,
  onGenerate,
}: PromptBundlePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'claude-code-prompt-bundle.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => {
          if (!markdown && !isLoading) {
            onGenerate();
          }
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-bold text-navy uppercase tracking-wider">
          Claude Code Prompt Bundle
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-blue animate-spin mr-2" />
              <span className="text-sm text-gray-500">Generating prompt bundle...</span>
            </div>
          ) : markdown ? (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[10px] font-medium text-navy uppercase tracking-wider hover:border-blue transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[10px] font-medium text-navy uppercase tracking-wider hover:border-blue transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download .md
                </button>
              </div>
              <pre className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-xs text-gray-700 leading-relaxed overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                {markdown}
              </pre>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-3">
                Generate a structured prompt bundle for Claude Code.
              </p>
              <button
                onClick={onGenerate}
                className="rounded-lg bg-navy px-4 py-2 text-xs font-medium text-white uppercase tracking-wider hover:bg-blue transition-colors"
              >
                Generate Bundle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

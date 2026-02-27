import { ArrowRight, RefreshCw } from 'lucide-react';
import type { ProtectionLevel, OutputFormat } from '@/types/decision-tree';
import { checkFeasibility } from '@/lib/tree-engine';

interface NextStepsProps {
  protectionLevel: ProtectionLevel;
  outputFormat?: OutputFormat;
  onStartOver: () => void;
}

export function NextSteps({ protectionLevel, outputFormat, onStartOver }: NextStepsProps) {
  const feasibility = outputFormat
    ? checkFeasibility(outputFormat, protectionLevel)
    : null;

  const steps: string[] = [];

  if (protectionLevel === 'P1') {
    steps.push('Your data is public — you can get started right away with any UCSD-approved AI tool.');
  } else if (protectionLevel === 'P2') {
    steps.push('Ensure you have UCSD SSO access configured for your AI tool.');
    steps.push('Verify your team has the same access permissions before sharing results.');
  } else if (protectionLevel === 'P3') {
    steps.push('Contact your data steward to obtain API key credentials.');
    steps.push('Set up VPN access if required by your data source.');
    steps.push('Ensure audit logging is enabled for your AI processing pipeline.');
  } else {
    steps.push('This data cannot be processed by AI tools under current UC policy.');
    steps.push('Consider working with a de-identified subset of the data.');
    steps.push('Consult UCSD IT Security for alternative approaches.');
  }

  if (feasibility?.conditions) {
    steps.push(feasibility.conditions);
  }

  return (
    <div className="rounded-lg border-2 border-blue/20 bg-blue/5 p-6">
      <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">
        Recommended Next Steps
      </h3>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue text-white text-xs font-bold">
              {i + 1}
            </span>
            <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onStartOver}
          className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:border-blue transition-colors uppercase tracking-wider"
        >
          <RefreshCw className="h-3 w-3" />
          Start Over
        </button>
        <a
          href="https://support.ucsd.edu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-xs font-medium text-white hover:bg-navy transition-colors uppercase tracking-wider"
        >
          UCSD IT Help
          <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

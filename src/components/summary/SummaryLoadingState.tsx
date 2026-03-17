import { Loader2 } from 'lucide-react';

interface SummaryLoadingStateProps {
  message?: string;
}

export function SummaryLoadingState({
  message = 'Generating your summary...',
}: SummaryLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Loader2 className="h-8 w-8 text-blue animate-spin mb-4" />
      <p className="text-sm text-gray-500 font-medium">{message}</p>
    </div>
  );
}

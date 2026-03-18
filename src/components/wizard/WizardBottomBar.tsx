import { ArrowLeft } from 'lucide-react';

interface WizardBottomBarProps {
  canGoBack: boolean;
  onBack: () => void;
}

export function WizardBottomBar({
  canGoBack,
  onBack,
}: WizardBottomBarProps) {
  if (!canGoBack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden">
      <div className="flex h-16 items-center px-5 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={onBack}
          className="flex h-11 min-w-[80px] items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-gray-600 transition-colors active:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </div>
  );
}

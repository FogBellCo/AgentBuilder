import { useEffect } from 'react';

interface UseWizardKeyboardOptions {
  optionCount: number;
  onSelectOption: (index: number) => void;
  onConfirm: (() => void) | null;
  onBack: (() => void) | null;
  enabled: boolean;
}

export function useWizardKeyboard({
  optionCount,
  onSelectOption,
  onConfirm,
  onBack,
  enabled,
}: UseWizardKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= Math.min(optionCount, 9)) {
        e.preventDefault();
        onSelectOption(num - 1); // convert to 0-based index
        return;
      }

      if (e.key === 'Enter' && onConfirm) {
        e.preventDefault();
        onConfirm();
        return;
      }

      if ((e.key === 'Backspace' || e.key === 'Escape') && onBack) {
        e.preventDefault();
        onBack();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [optionCount, onSelectOption, onConfirm, onBack, enabled]);
}

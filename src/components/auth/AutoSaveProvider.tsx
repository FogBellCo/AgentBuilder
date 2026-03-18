import { useAutoSave } from '@/hooks/use-auto-save';

/**
 * Headless component that activates auto-save.
 * Must be placed inside AuthProvider so useAutoSave can access auth context.
 */
export function AutoSaveProvider() {
  useAutoSave();
  return null;
}

import { X } from 'lucide-react';

interface ManualEditConflictProps {
  sectionKey: string;
  sectionTitle: string;
  currentEdit: string;
  newGenerated: string;
  onKeepEdit: () => void;
  onAcceptNew: () => void;
}

export function ManualEditConflict({
  sectionTitle,
  currentEdit,
  newGenerated,
  onKeepEdit,
  onAcceptNew,
}: ManualEditConflictProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
            Edit Conflict — {sectionTitle}
          </h3>
          <button
            onClick={onKeepEdit}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-500 mb-4">
            You previously edited this section. The AI has generated a new version.
            Choose which version to keep.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Current Edit */}
            <div className="rounded-lg border-2 border-blue/20 bg-blue/5 p-4">
              <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-2">
                Your Edit
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {currentEdit}
              </p>
            </div>

            {/* New Generated */}
            <div className="rounded-lg border-2 border-gold/20 bg-gold/5 p-4">
              <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-2">
                New AI Version
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {newGenerated}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onKeepEdit}
            className="rounded-lg border-2 border-gray-200 px-5 py-2.5 text-xs font-medium text-navy uppercase tracking-wider hover:border-blue transition-colors"
          >
            Keep My Edit
          </button>
          <button
            onClick={onAcceptNew}
            className="rounded-lg bg-navy px-5 py-2.5 text-xs font-medium text-white uppercase tracking-wider hover:bg-blue transition-colors"
          >
            Accept New Version
          </button>
        </div>
      </div>
    </div>
  );
}

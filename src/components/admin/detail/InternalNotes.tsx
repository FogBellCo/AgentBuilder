import { useState } from 'react';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import type { AdminNote } from '@/types/admin';

interface InternalNotesProps {
  notes: AdminNote[];
  onAddNote: (content: string) => void;
  isSubmitting?: boolean;
}

export function InternalNotes({ notes, onAddNote, isSubmitting }: InternalNotesProps) {
  const [expanded, setExpanded] = useState(true);
  const [content, setContent] = useState('');

  function handleSubmit() {
    if (!content.trim() || isSubmitting) return;
    onAddNote(content.trim());
    setContent('');
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <h3 className="text-sm font-bold text-navy">
          Internal Notes (OSI Only)
          <span className="ml-2 text-xs font-normal text-gray-400">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        </h3>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-4 py-3">
          {/* Add note form */}
          <div className="mb-4 flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className={cn(
                'flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none',
                'focus:border-blue focus:ring-1 focus:ring-blue',
              )}
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-md',
                'bg-navy text-white transition-colors hover:bg-navy/90',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">No notes yet</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-navy">{note.author}</span>
                    <span className="text-gray-400">&mdash;</span>
                    <span className="text-gray-400">{timeAgo(note.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

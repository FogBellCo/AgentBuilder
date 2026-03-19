import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowUpModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onSend: (question: string) => void;
  isSending?: boolean;
}

export function FollowUpModal({ email, isOpen, onClose, onSend, isSending }: FollowUpModalProps) {
  const [question, setQuestion] = useState('');

  if (!isOpen) return null;

  function handleSend() {
    if (!question.trim() || isSending) return;
    onSend(question.trim());
    setQuestion('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-bold text-navy">Send Follow-Up Question</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          <div>
            <span className="text-xs font-medium text-gray-500">To:</span>
            <span className="ml-2 text-sm text-gray-800">{email}</span>
          </div>

          <div>
            <label htmlFor="follow-up-question" className="mb-1 block text-xs font-medium text-gray-500">
              Question:
            </label>
            <textarea
              id="follow-up-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question..."
              rows={4}
              className={cn(
                'w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none',
                'focus:border-blue focus:ring-1 focus:ring-blue',
              )}
              autoFocus
            />
          </div>

          <div className="rounded border border-yellow/30 bg-yellow/5 p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-700">This will:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Change status to &quot;Needs Info&quot;</li>
              <li>Log this question in the activity timeline</li>
              <li>The user will see the question when they return to their submission</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!question.trim() || isSending}
            className={cn(
              'rounded-md bg-navy px-4 py-2 text-sm font-medium text-white',
              'hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {isSending ? 'Sending...' : 'Send Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

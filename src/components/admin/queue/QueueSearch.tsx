import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function QueueSearch({ value, onChange }: QueueSearchProps) {
  const [local, setLocal] = useState(value);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(local);
    }, 300);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  // Sync from parent
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search by title, email, or description..."
        className={cn(
          'w-full rounded-md border border-gray-300 py-2 pl-9 pr-9 text-sm outline-none',
          'focus:border-blue focus:ring-1 focus:ring-blue',
        )}
      />
      {local && (
        <button
          onClick={() => {
            setLocal('');
            onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_STATUSES, STATUS_LABELS } from '@/types/admin';

interface QueueFiltersProps {
  statusFilter: string[];
  pLevelFilter: string[];
  onStatusChange: (statuses: string[]) => void;
  onPLevelChange: (levels: string[]) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const P_LEVELS = ['P1', 'P2', 'P3', 'P4'];

export function QueueFilters({
  statusFilter,
  pLevelFilter,
  onStatusChange,
  onPLevelChange,
  onClearAll,
  hasActiveFilters,
}: QueueFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectDropdown
        label="Status"
        options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        selected={statusFilter}
        onChange={onStatusChange}
      />
      <MultiSelectDropdown
        label="Protection Level"
        options={P_LEVELS.map((l) => ({ value: l, label: l }))}
        selected={pLevelFilter}
        onChange={onPLevelChange}
      />
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-blue hover:underline"
        >
          <X className="h-3 w-3" />
          Clear all filters
        </button>
      )}
    </div>
  );
}

interface MultiSelectDropdownProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
          selected.length > 0
            ? 'border-blue bg-blue/5 text-blue'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50',
        )}
      >
        {label}
        {selected.length > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue text-[10px] text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 min-w-[180px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue focus:ring-blue"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

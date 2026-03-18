import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FallbackItem } from '@/lib/user-summary-builder';

interface UserSummarySectionProps {
  sectionKey: string;
  title: string;
  content: string;
  manualEdit?: string;
  onEdit: (key: string, content: string) => void;
  editable?: boolean;
  /** If provided, renders fallback bullet list instead of AI narrative */
  fallbackItems?: FallbackItem[];
}

export function UserSummarySection({
  sectionKey,
  title,
  content,
  manualEdit,
  onEdit,
  editable = true,
  fallbackItems,
}: UserSummarySectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayContent = manualEdit ?? content;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (textareaRef.current) {
      const newContent = textareaRef.current.value.trim();
      if (newContent !== content) {
        onEdit(sectionKey, newContent);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  const handleClick = () => {
    if (editable && !isEditing) {
      setIsEditing(true);
    }
  };

  // If we have fallback items and no AI content, show bullets
  const showFallback = fallbackItems && fallbackItems.length > 0 && !displayContent;

  return (
    <div
      data-summary-section
      className={cn(
        'rounded-lg border-2 bg-white p-5 transition-colors',
        isEditing
          ? 'border-blue/40'
          : isHovered && editable
            ? 'border-blue/20'
            : 'border-gray-200',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
          {title}
        </h3>
        {editable && isHovered && !isEditing && (
          <button
            data-edit-button
            onClick={handleClick}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          defaultValue={displayContent}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[80px] rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-blue/40 focus:ring-1 focus:ring-blue/20"
          onChange={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />
      ) : showFallback ? (
        <div className="space-y-1.5">
          {fallbackItems.map((item, i) => (
            <div key={i} className="text-sm text-gray-700 leading-relaxed">
              <span className="font-medium text-navy">{item.label}:</span>{' '}
              {item.value}
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            'text-sm text-gray-700 leading-relaxed whitespace-pre-wrap',
            editable && 'cursor-pointer',
          )}
        >
          {displayContent || (
            <span className="text-gray-400 italic">Generating...</span>
          )}
        </div>
      )}

      {manualEdit && manualEdit !== content && (
        <p className="mt-2 text-[10px] text-gray-400 italic">
          Edited
        </p>
      )}
    </div>
  );
}

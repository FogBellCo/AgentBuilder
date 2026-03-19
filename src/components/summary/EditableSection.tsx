import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableSectionProps {
  sectionKey: string;
  title: string;
  content: string;
  manualEdit?: string;
  onEdit: (key: string, content: string) => void;
  editable?: boolean;
}

export function EditableSection({
  sectionKey,
  title,
  content,
  manualEdit,
  onEdit,
  editable = true,
}: EditableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayContent = manualEdit ?? content;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
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
            // Auto-resize on input
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            'text-sm text-gray-700 leading-relaxed whitespace-pre-wrap',
            editable && 'cursor-pointer',
          )}
        >
          {displayContent || (
            <span className="text-gray-400 italic">No content generated yet.</span>
          )}
        </div>
      )}

      {manualEdit && manualEdit !== content && (
        <p className="mt-2 text-[10px] text-gray-400 italic">
          Manually edited
        </p>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Download, MessageSquare, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ALL_STATUSES, STATUS_LABELS } from '@/types/admin';
import { StatusBadge } from '../queue/StatusBadge';
import { CompletenessBar } from '../queue/CompletenessBar';

interface DetailHeaderProps {
  title: string;
  email: string;
  status: string;
  completeness: number;
  assignedTo: string | null;
  submittedAt: string | null;
  onStatusChange: (status: string) => void;
  onAskQuestion: () => void;
  onExport: (format: string) => void;
  teamMembers?: Array<{ id: string; name: string }>;
  onAssign?: (assignedTo: string | null) => void;
}

export function DetailHeader({
  title,
  email,
  status,
  completeness,
  assignedTo,
  submittedAt,
  onStatusChange,
  onAskQuestion,
  onExport,
  teamMembers = [],
  onAssign,
}: DetailHeaderProps) {
  const navigate = useNavigate();
  const [statusOpen, setStatusOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const assignRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssignOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const assignedMember = teamMembers.find((m) => m.id === assignedTo);

  return (
    <div className="space-y-3">
      {/* Back link */}
      <button
        onClick={() => navigate('/admin/submissions')}
        className="flex items-center gap-1 text-sm text-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Submissions
      </button>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-navy">{title || 'Untitled Request'}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submitted by {email}
            {submittedAt && ` on ${new Date(submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </p>
          {/* Assignment dropdown */}
          {onAssign && (
            <div className="relative mt-1 inline-block" ref={assignRef}>
              <button
                onClick={() => setAssignOpen(!assignOpen)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <UserCircle className="h-3.5 w-3.5" />
                {assignedMember ? `Assigned to: ${assignedMember.name}` : assignedTo ? `Assigned to: ${assignedTo}` : 'Unassigned'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {assignOpen && (
                <div className="absolute left-0 z-20 mt-1 w-52 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {assignedTo && (
                    <button
                      onClick={() => { onAssign(null); setAssignOpen(false); }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50"
                    >
                      Unassign
                    </button>
                  )}
                  {teamMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { onAssign(m.id); setAssignOpen(false); }}
                      disabled={m.id === assignedTo}
                      className={cn(
                        'block w-full px-3 py-1.5 text-left text-xs',
                        m.id === assignedTo
                          ? 'bg-gray-50 font-medium text-gray-400'
                          : 'text-gray-700 hover:bg-gray-50',
                      )}
                    >
                      {m.name}
                    </button>
                  ))}
                  {teamMembers.length === 0 && !assignedTo && (
                    <p className="px-3 py-2 text-xs text-gray-400">No team members yet</p>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="mt-2">
            <CompletenessBar value={completeness} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Status dropdown */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"
            >
              <StatusBadge status={status} />
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {statusOpen && (
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(s); setStatusOpen(false); }}
                    disabled={s === status}
                    className={cn(
                      'block w-full px-3 py-1.5 text-left text-xs',
                      s === status ? 'bg-gray-50 font-medium text-gray-400' : 'text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ask question */}
          <button
            onClick={onAskQuestion}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask User
          </button>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
              <ChevronDown className="h-3 w-3" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                {['json', 'markdown'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => { onExport(fmt); setExportOpen(false); }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                  >
                    {fmt === 'json' ? 'JSON' : 'Markdown'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

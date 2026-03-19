import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowUpDown, ArrowUp, ArrowDown, Flag, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import { useAdminSubmissions, useUpdateStatus, useToggleFlag, useBatchAction } from '@/hooks/use-admin-submissions';
import type { SubmissionFilters, AdminSubmissionRow } from '@/types/admin';
import { QueueSearch } from './QueueSearch';
import { QueueFilters } from './QueueFilters';
import { QueuePagination } from './QueuePagination';
import { BatchActionBar } from './BatchActionBar';
import { StatusBadge } from './StatusBadge';
import { ProtectionBadge } from './ProtectionBadge';
import { CompletenessBar } from './CompletenessBar';
import { QuickActions } from './QuickActions';
import { exportSubmissions } from '@/lib/admin-api-client';

type SortField = 'title' | 'department' | 'status' | 'protectionLevel' | 'completeness' | 'updatedAt';

export function SubmissionQueue() {
  const navigate = useNavigate();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [pLevelFilter, setPLevelFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filters: SubmissionFilters = {
    q: search || undefined,
    status: statusFilter.length ? statusFilter : undefined,
    pLevel: pLevelFilter.length ? pLevelFilter : undefined,
    sort: sortField,
    order: sortOrder,
    page,
    pageSize,
  };

  const { data, isLoading, error } = useAdminSubmissions(filters);
  const updateStatus = useUpdateStatus();
  const flagMutation = useToggleFlag();
  const batchMutation = useBatchAction();

  const submissions = data?.submissions ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasActiveFilters = statusFilter.length > 0 || pLevelFilter.length > 0;

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);

  const handleRowClick = useCallback((id: string) => {
    navigate(`/admin/submissions/${id}`);
  }, [navigate]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selected.size === submissions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(submissions.map((s) => s.id)));
    }
  }, [selected.size, submissions]);

  const handleStatusChange = useCallback((id: string, status: string) => {
    updateStatus.mutate({ id, status });
  }, [updateStatus]);

  const handleFlagToggle = useCallback((id: string, flagged: boolean) => {
    flagMutation.mutate({ id, flagged });
  }, [flagMutation]);

  const handleBatchStatus = useCallback((status: string) => {
    batchMutation.mutate({
      ids: Array.from(selected),
      action: 'change_status',
      params: { status },
    });
    setSelected(new Set());
  }, [batchMutation, selected]);

  const handleBatchArchive = useCallback(() => {
    batchMutation.mutate({
      ids: Array.from(selected),
      action: 'archive',
    });
    setSelected(new Set());
  }, [batchMutation, selected]);

  const handleExportCSV = useCallback(async () => {
    try {
      const blob = await exportSubmissions(filters, 'csv');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'submissions-export.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    }
  }, [filters]);

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Submissions</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <span className="text-xs text-gray-500">
            Showing {submissions.length} of {total} submissions
          </span>
        </div>
      </div>

      {/* Search */}
      <QueueSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} />

      {/* Filters */}
      <QueueFilters
        statusFilter={statusFilter}
        pLevelFilter={pLevelFilter}
        onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
        onPLevelChange={(v) => { setPLevelFilter(v); setPage(1); }}
        onClearAll={() => { setStatusFilter([]); setPLevelFilter([]); setPage(1); }}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-500">
            Failed to load submissions. Please try again.
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            No submissions found.
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.size === submissions.length && submissions.length > 0}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                  </th>
                  <SortableHeader field="title" label="Title" current={sortField} order={sortOrder} onSort={handleSort} icon={renderSortIcon('title')} />
                  <SortableHeader field="department" label="Department" current={sortField} order={sortOrder} onSort={handleSort} icon={renderSortIcon('department')} className="w-[140px]" />
                  <SortableHeader field="status" label="Status" current={sortField} order={sortOrder} onSort={handleSort} icon={renderSortIcon('status')} className="w-[120px]" />
                  <SortableHeader field="protectionLevel" label="Protection" current={sortField} order={sortOrder} onSort={handleSort} icon={renderSortIcon('protectionLevel')} className="w-20" />
                  <SortableHeader field="completeness" label="Completeness" current={sortField} order={sortOrder} onSort={handleSort} icon={renderSortIcon('completeness')} className="w-[120px]" />
                  <SortableHeader field="updatedAt" label="Updated" current={sortField} order={sortOrder} onSort={handleSort} icon={renderSortIcon('updatedAt')} className="w-[110px]" />
                  <th className="w-[80px] px-3 py-2.5 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub) => (
                  <SubmissionRow
                    key={sub.id}
                    submission={sub}
                    selected={selected.has(sub.id)}
                    onToggleSelect={toggleSelect}
                    onClick={handleRowClick}
                    onChangeStatus={handleStatusChange}
                    onToggleFlag={handleFlagToggle}
                  />
                ))}
              </tbody>
            </table>

            <QueuePagination
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </>
        )}
      </div>

      {/* Batch action bar */}
      <BatchActionBar
        selectedCount={selected.size}
        onChangeStatus={handleBatchStatus}
        onArchive={handleBatchArchive}
        onDeselectAll={() => setSelected(new Set())}
      />
    </div>
  );
}

// --- Sub-components ---

function SortableHeader({
  field,
  label,
  current: _current,
  order: _order,
  onSort,
  icon,
  className,
}: {
  field: SortField;
  label: string;
  current?: SortField;
  order?: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn('cursor-pointer select-none px-3 py-2.5', className)}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
        {label}
        {icon}
      </div>
    </th>
  );
}

function SubmissionRow({
  submission,
  selected,
  onToggleSelect,
  onClick,
  onChangeStatus,
  onToggleFlag,
}: {
  submission: AdminSubmissionRow;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (id: string) => void;
  onChangeStatus: (id: string, status: string) => void;
  onToggleFlag: (id: string, flagged: boolean) => void;
}) {
  return (
    <tr
      className={cn(
        'cursor-pointer transition-colors hover:bg-gray-50',
        selected && 'bg-blue/5',
      )}
      onClick={() => onClick(submission.id)}
    >
      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(submission.id)}
          className="h-3.5 w-3.5 rounded border-gray-300"
        />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          {submission.flagged && <Flag className="h-3.5 w-3.5 shrink-0 fill-current text-p4" />}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-navy">
              {submission.title || 'Untitled Request'}
            </div>
            <div className="truncate text-xs text-gray-500">{submission.email}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-600">
        {submission.department || '--'}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={submission.status} />
      </td>
      <td className="px-3 py-2.5">
        <ProtectionBadge level={submission.protectionLevel} />
      </td>
      <td className="px-3 py-2.5">
        <CompletenessBar value={submission.completeness} />
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-500" title={submission.updatedAt}>
        {timeAgo(submission.updatedAt)}
      </td>
      <td className="px-3 py-2.5">
        <QuickActions
          submissionId={submission.id}
          currentStatus={submission.status}
          flagged={submission.flagged}
          onChangeStatus={onChangeStatus}
          onToggleFlag={onToggleFlag}
        />
      </td>
    </tr>
  );
}

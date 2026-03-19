import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../queue/StatusBadge';
import { ProtectionBadge } from '../queue/ProtectionBadge';

interface RankedItem {
  id: string;
  title: string;
  impact: number;
  effort: number;
  priority: number;
  status: string;
  protectionLevel: string | null;
}

interface RankedListProps {
  data: RankedItem[];
}

export function RankedList({ data }: RankedListProps) {
  const navigate = useNavigate();

  // Sort by priority descending
  const sorted = [...data].sort((a, b) => b.priority - a.priority);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="w-12 px-3 py-2.5 text-xs font-medium text-gray-500">#</th>
            <th className="px-3 py-2.5 text-xs font-medium text-gray-500">Title</th>
            <th className="w-20 px-3 py-2.5 text-center text-xs font-medium text-gray-500">Impact</th>
            <th className="w-20 px-3 py-2.5 text-center text-xs font-medium text-gray-500">Effort</th>
            <th className="w-20 px-3 py-2.5 text-center text-xs font-medium text-gray-500">Priority</th>
            <th className="w-24 px-3 py-2.5 text-xs font-medium text-gray-500">Status</th>
            <th className="w-20 px-3 py-2.5 text-xs font-medium text-gray-500">P-Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((item, i) => (
            <tr
              key={item.id}
              onClick={() => navigate(`/admin/submissions/${item.id}`)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="px-3 py-2.5 text-xs font-medium text-gray-400">{i + 1}</td>
              <td className="px-3 py-2.5 text-sm font-medium text-navy">
                {item.title || 'Untitled'}
              </td>
              <td className="px-3 py-2.5 text-center text-xs font-bold text-navy">{item.impact}</td>
              <td className="px-3 py-2.5 text-center text-xs font-bold text-navy">{item.effort}</td>
              <td className="px-3 py-2.5 text-center">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                  {item.priority}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-3 py-2.5">
                <ProtectionBadge level={item.protectionLevel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          No submissions to prioritize
        </div>
      )}
    </div>
  );
}

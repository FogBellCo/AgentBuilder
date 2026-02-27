import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Search, Sliders, Monitor, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StageNodeData } from '@/lib/flow-layout';

const iconMap: Record<string, typeof Search> = {
  Search,
  Sliders,
  Monitor,
};

const statusConfig = {
  not_started: { icon: Circle, label: 'Not started', color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200' },
  in_progress: { icon: Loader2, label: 'In progress', color: 'text-blue', bg: 'bg-blue/5 border-blue' },
  complete: { icon: CheckCircle2, label: 'Complete', color: 'text-green', bg: 'bg-green/5 border-green' },
};

export const StageNode = memo(function StageNode({ data }: NodeProps) {
  const nodeData = data as unknown as StageNodeData;
  const Icon = iconMap[nodeData.icon] ?? Search;
  const status = statusConfig[nodeData.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'cursor-pointer rounded-lg border-2 px-8 py-6 text-center transition-all duration-300 hover:shadow-lg min-w-[200px]',
        status.bg,
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-300 !w-2 !h-2" />

      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-navy">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
            {nodeData.label}
          </h3>
          <p className="mt-1 text-xs text-gray-500">{nodeData.tagline}</p>
        </div>
        <div className={cn('flex items-center gap-1', status.color)}>
          <StatusIcon className={cn('h-3 w-3', nodeData.status === 'in_progress' && 'animate-spin')} />
          <span className="text-[10px] uppercase tracking-widest font-medium">{status.label}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-gray-300 !w-2 !h-2" />
    </div>
  );
});

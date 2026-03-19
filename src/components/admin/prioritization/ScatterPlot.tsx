import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

interface ScatterDataPoint {
  id: string;
  title: string;
  impact: number;
  effort: number;
  status: string;
  protectionLevel: string | null;
  priority: number;
}

interface ScatterPlotProps {
  data: ScatterDataPoint[];
}

const STATUS_HEX: Record<string, string> = {
  draft: '#868E96',
  submitted: '#00629B',
  in_review: '#C69214',
  needs_info: '#FC8900',
  approved: '#6E963B',
  building: '#00C6D7',
  complete: '#182B49',
  archived: '#ADB5BD',
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterDataPoint }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-medium text-navy">{d.title || 'Untitled'}</p>
      <p className="text-gray-500">Impact: {d.impact} | Effort: {d.effort}</p>
      <p className="text-gray-500">Priority: {d.priority}</p>
      <p className="text-gray-500">Status: {d.status} | {d.protectionLevel || 'N/A'}</p>
    </div>
  );
}

export function ScatterPlotView({ data }: ScatterPlotProps) {
  const navigate = useNavigate();

  function handleClick(entry: ScatterDataPoint) {
    navigate(`/admin/submissions/${entry.id}`);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="relative h-[500px]">
        {/* Quadrant labels */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <span className="absolute left-[15%] top-[10%] text-xs text-gray-300 font-medium">Quick Wins</span>
          <span className="absolute right-[15%] top-[10%] text-xs text-gray-300 font-medium">Major Projects</span>
          <span className="absolute left-[15%] bottom-[10%] text-xs text-gray-300 font-medium">Easy Improvements</span>
          <span className="absolute right-[15%] bottom-[10%] text-xs text-gray-300 font-medium">Reconsider</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
            <XAxis
              type="number"
              dataKey="effort"
              domain={[0, 100]}
              name="Effort"
              tick={{ fontSize: 11 }}
              label={{ value: 'Effort (Easy -> Hard)', position: 'bottom', offset: 0, style: { fontSize: 11, fill: '#868E96' } }}
            />
            <YAxis
              type="number"
              dataKey="impact"
              domain={[0, 100]}
              name="Impact"
              tick={{ fontSize: 11 }}
              label={{ value: 'Impact', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#868E96' } }}
            />
            <ZAxis range={[60, 300]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={data}
              onClick={(_data, _index, e) => {
                // The data in Scatter onClick is the actual data point
                const point = _data as unknown as ScatterDataPoint;
                if (point?.id) handleClick(point);
                e?.stopPropagation();
              }}
              cursor="pointer"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={STATUS_HEX[entry.status] ?? '#ADB5BD'}
                  fillOpacity={0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


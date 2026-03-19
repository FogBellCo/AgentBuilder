import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ProtectionLevelChartProps {
  data: Array<{ level: string; count: number }>;
}

const P_COLORS: Record<string, string> = {
  P1: '#6E963B',
  P2: '#00629B',
  P3: '#FC8900',
  P4: '#C0392B',
};

export function ProtectionLevelChart({ data }: ProtectionLevelChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    );
  }

  // Ensure P1-P4 order
  const ordered = ['P1', 'P2', 'P3', 'P4'].map((level) => ({
    level,
    count: data.find((d) => d.level === level)?.count ?? 0,
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-bold text-navy">Protection Level Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ordered}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="level" tick={{ fontSize: 11 }} width={55} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E9ECEF' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {ordered.map((entry) => (
                <Cell key={entry.level} fill={P_COLORS[entry.level] ?? '#ADB5BD'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

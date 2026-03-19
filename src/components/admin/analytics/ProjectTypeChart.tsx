import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProjectTypeChartProps {
  data: Array<{ type: string; count: number }>;
}

const COLORS = ['#00629B', '#182B49', '#FFCD00', '#00C6D7', '#D462AD', '#6E963B'];

export function ProjectTypeChart({ data }: ProjectTypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    name: d.type,
    value: d.count,
    percent: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-bold text-navy">Project Type Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown, name: unknown) => [`${value} (${chartData.find(d => d.name === String(name))?.percent ?? 0}%)`, String(name)]}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E9ECEF' }}
            />
            <Legend
              formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

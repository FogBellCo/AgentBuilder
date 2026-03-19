import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DepartmentChartProps {
  data: Array<{ department: string; count: number }>;
}

export function DepartmentChart({ data }: DepartmentChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    );
  }

  // Sort descending and take top 10
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-bold text-navy">Submissions by Department</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="department"
              tick={{ fontSize: 11 }}
              width={75}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E9ECEF' }}
            />
            <Bar dataKey="count" fill="#00629B" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useAdminAnalytics } from '@/hooks/use-admin-analytics';
import { SummaryCards } from './SummaryCards';
import { SubmissionsChart } from './SubmissionsChart';
import { DepartmentChart } from './DepartmentChart';
import { ProjectTypeChart } from './ProjectTypeChart';
import { ProtectionLevelChart } from './ProtectionLevelChart';
import { DataSourcesChart } from './DataSourcesChart';
import { DateRangeSelector, getDateRange } from './DateRangeSelector';

export function AnalyticsOverview() {
  const [preset, setPreset] = useState('30d');
  // Memoize so the query key stays stable across renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const range = useMemo(() => getDateRange(preset), [preset]);
  const { data, isLoading, error } = useAdminAnalytics(range.from, range.to);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Analytics</h1>
        <DateRangeSelector value={preset} onChange={setPreset} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue" />
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-red-500">
          Failed to load analytics data.
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <SummaryCards summary={data.summary} />

          {/* Charts grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SubmissionsChart data={data.submissionsOverTime} />
            <DepartmentChart data={data.byDepartment} />
            {data.byProjectType.length > 0 && (
              <ProjectTypeChart data={data.byProjectType} />
            )}
            <ProtectionLevelChart data={data.byProtectionLevel} />
          </div>

          {data.commonDataSources.length > 0 && (
            <DataSourcesChart data={data.commonDataSources} />
          )}
        </>
      ) : null}
    </div>
  );
}

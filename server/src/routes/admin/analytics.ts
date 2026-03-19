import { Hono } from 'hono';
import type { DatabaseAdapter } from '../../lib/db-adapter.js';

export function createAdminAnalyticsRoutes(db: DatabaseAdapter): Hono {
  const route = new Hono();

  route.get('/', async (c) => {
    const fromParam = c.req.query('from');
    const toParam = c.req.query('to');

    const from = fromParam || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = toParam || new Date().toISOString();

    const analytics = await db.getAnalytics(from, to);

    // Transform to spec 06 format
    return c.json({
      summary: {
        totalSubmissions: analytics.overview.totalSubmissions,
        avgCompleteness: analytics.overview.avgCompletenessAtSubmit,
        avgTimeToReview: analytics.overview.avgDaysToReview,
        needsAttention: (analytics.byStatus['submitted'] || 0) + (analytics.byStatus['needs_info'] || 0),
      },
      submissionsOverTime: analytics.submissionsOverTime.map((w) => ({
        period: w.week,
        count: w.count,
        byStatus: analytics.byStatus,
      })),
      byDepartment: analytics.byDomain.map((d) => ({ department: d.domain, count: d.count })),
      byProjectType: [], // Would need output_formats extraction — placeholder
      byProtectionLevel: Object.entries(analytics.byProtectionLevel).map(([level, count]) => ({
        level,
        count,
      })),
      commonDataSources: [], // Would need data source extraction — placeholder
    });
  });

  return route;
}

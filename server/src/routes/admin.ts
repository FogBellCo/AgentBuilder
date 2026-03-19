import { Hono } from 'hono';
import type { DatabaseAdapter } from '../lib/db-adapter.js';
import type { AppEnv } from '../lib/types.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

export function createAdminRoutes(db: DatabaseAdapter): Hono<AppEnv> {
  const route = new Hono<AppEnv>();

  // All admin routes require auth + admin
  route.use('*', authMiddleware(), adminMiddleware());

  // GET /api/admin/analytics
  route.get('/analytics', async (c) => {
    const fromParam = c.req.query('from');
    const toParam = c.req.query('to');

    const from = fromParam || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = toParam || new Date().toISOString();

    const analytics = await db.getAnalytics(from, to);
    return c.json(analytics);
  });

  // GET /api/admin/export
  route.get('/export', async (c) => {
    const format = c.req.query('format') || 'csv';

    // Re-use list submissions with admin filters
    const statusParam = c.req.query('status');
    const plParam = c.req.query('protection_level');
    const domain = c.req.query('domain');

    const result = await db.listSubmissions({
      user_id: undefined, // admin sees all
      status: statusParam ? statusParam.split(',') : undefined,
      protection_level: plParam ? plParam.split(',') : undefined,
      domain: domain || undefined,
      page: 1,
      per_page: 10000, // Export all matching
    });

    if (format === 'json') {
      c.header('Content-Disposition', 'attachment; filename="submissions-export.json"');
      return c.json(result.data);
    }

    // CSV export
    const csvHeader = 'id,title,status,protection_level,domain,completeness_pct,created_at,updated_at';
    const csvRows = result.data.map((item) => {
      const escape = (s: string | null) => {
        if (s === null || s === undefined) return '';
        return `"${String(s).replace(/"/g, '""')}"`;
      };
      return [
        escape(item.id),
        escape(item.title),
        escape(item.status),
        escape(item.protection_level),
        escape(item.domain),
        String(item.completeness_pct),
        escape(item.created_at),
        escape(item.updated_at),
      ].join(',');
    });

    const csv = [csvHeader, ...csvRows].join('\n');

    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', 'attachment; filename="submissions-export.csv"');

    return c.text(csv);
  });

  return route;
}

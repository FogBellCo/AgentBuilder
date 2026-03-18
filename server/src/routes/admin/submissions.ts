import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../../lib/db-adapter.js';
import { calculateCompleteness, extractMetadata } from '../../lib/completeness.js';
import { calculatePriorityScores } from '../../lib/priority-score.js';

export function createAdminSubmissionsRoutes(db: DatabaseAdapter): Hono {
  const route = new Hono();

  // GET /submissions — List all submissions with admin filters
  route.get('/', async (c) => {
    const q = c.req.query('q') || '';
    const statusParam = c.req.query('status') || '';
    const plParam = c.req.query('pLevel') || '';
    const departmentParam = c.req.query('department') || '';
    const minComplete = c.req.query('minComplete');
    const maxComplete = c.req.query('maxComplete');
    const sort = c.req.query('sort') || 'updated_at';
    const order = (c.req.query('order') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '25', 10)));
    const showArchived = c.req.query('archived') === 'true';

    // Build domain filter from department param
    const department = departmentParam ? departmentParam.split(',')[0] : undefined;

    const statusFilter = statusParam
      ? statusParam.split(',')
      : showArchived
        ? undefined
        : ['draft', 'submitted', 'in_review', 'needs_info', 'approved', 'building', 'complete'];

    const result = await db.listSubmissions({
      user_id: undefined, // Admin sees all
      status: statusFilter,
      protection_level: plParam ? plParam.split(',') : undefined,
      domain: department,
      completeness_min: minComplete ? parseInt(minComplete, 10) : undefined,
      completeness_max: maxComplete ? parseInt(maxComplete, 10) : undefined,
      sort,
      order,
      search: q || undefined,
      page,
      per_page: pageSize,
    });

    // Map to AdminSubmissionRow format
    const submissions = await Promise.all(
      result.data.map(async (item) => {
        // Get user email
        const user = await db.getUserById(item.user_id);
        const email = user?.email || 'unknown';

        // Get submission full row for extra fields
        const full = await db.getSubmission(item.id);

        // Compute priority scores from session state
        let priorityScores: { impact: number; effort: number; priority: number } | null = null;
        if (full) {
          let sessionState: Record<string, unknown> = {};
          try { sessionState = JSON.parse(full.session_state); } catch { /* keep empty */ }
          let overrides: { desirability?: number; viability?: number; feasibility?: number } | null = null;
          try { if (full.score_overrides) overrides = JSON.parse(full.score_overrides); } catch { /* keep null */ }
          const scores = calculatePriorityScores(sessionState, overrides);
          priorityScores = { impact: scores.impact, effort: scores.effort, priority: scores.priority };
        }

        return {
          id: item.id,
          title: item.title,
          email,
          department: item.domain || '',
          status: item.status,
          protectionLevel: item.protection_level,
          completeness: item.completeness_pct,
          assignedTo: full?.assigned_to || null,
          flagged: !!(full?.flagged),
          priorityScores,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      }),
    );

    return c.json({
      submissions,
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.perPage,
      totalPages: result.pagination.totalPages,
    });
  });

  // GET /submissions/:id — Get single submission with full detail
  route.get('/:id', async (c) => {
    const id = c.req.param('id')!;
    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    const user = await db.getUserById(submission.user_id);
    const notes = await db.getAdminNotes(id);
    const history = await db.getStatusHistory(id);

    // Enrich notes with author info
    const enrichedNotes = await Promise.all(
      notes.map(async (note) => {
        const author = await db.getUserById(note.author_id);
        return {
          id: note.id,
          submissionId: note.submission_id,
          author: author?.display_name || author?.email || 'Admin',
          content: note.content,
          createdAt: note.created_at,
        };
      }),
    );

    // Build timeline from status history
    const timeline = await Promise.all(
      history.map(async (entry) => {
        const changedByUser = await db.getUserById(entry.changed_by);
        return {
          id: entry.id,
          submissionId: entry.submission_id,
          eventType: 'status_change',
          actor: changedByUser?.display_name || changedByUser?.email || 'System',
          details: {
            fromStatus: entry.from_status,
            toStatus: entry.to_status,
            reason: entry.reason,
          },
          createdAt: entry.created_at,
        };
      }),
    );

    let sessionState: Record<string, unknown> = {};
    try {
      sessionState = JSON.parse(submission.session_state);
    } catch {
      // keep empty
    }

    return c.json({
      id: submission.id,
      title: submission.title,
      email: user?.email || 'unknown',
      department: submission.domain,
      status: submission.status,
      protectionLevel: submission.protection_level,
      completeness: submission.completeness_pct,
      assignedTo: submission.assigned_to,
      flagged: !!submission.flagged,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at,
      description: submission.description,
      userId: submission.user_id,
      submittedAt: submission.submitted_at,
      sessionState,
      scoreOverrides: submission.score_overrides ? JSON.parse(submission.score_overrides) : null,
      notes: enrichedNotes,
      timeline,
      archivedFromStatus: null,
    });
  });

  // PUT /submissions/:id/status — Update status
  route.put('/:id/status', async (c) => {
    const id = c.req.param('id')!;
    const body = await c.req.json() as { status: string };

    if (!body.status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    const fromStatus = submission.status;
    await db.updateSubmission(id, {
      status: body.status,
      version: submission.version + 1,
    });

    await db.addStatusChange({
      id: randomUUID(),
      submission_id: id,
      from_status: fromStatus,
      to_status: body.status,
      changed_by: 'admin',
      reason: 'Status changed by admin',
      created_at: new Date().toISOString(),
    });

    return c.json({ success: true });
  });

  // PUT /submissions/:id/assign — Assign submission
  route.put('/:id/assign', async (c) => {
    const id = c.req.param('id')!;
    const body = await c.req.json() as { assignedTo: string | null };

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    await db.updateSubmission(id, { assigned_to: body.assignedTo });
    return c.json({ success: true });
  });

  // PUT /submissions/:id/flag — Toggle flag
  route.put('/:id/flag', async (c) => {
    const id = c.req.param('id')!;
    const body = await c.req.json() as { flagged: boolean };

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    await db.updateSubmission(id, { flagged: body.flagged ? 1 : 0 });
    return c.json({ success: true });
  });

  // PUT /submissions/:id/scores — Score overrides
  route.put('/:id/scores', async (c) => {
    const id = c.req.param('id')!;
    const body = await c.req.json() as { desirability?: number; viability?: number; feasibility?: number };

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    await db.updateSubmission(id, { score_overrides: JSON.stringify(body) });
    return c.json({ success: true });
  });

  // POST /submissions/:id/question — Send follow-up question
  route.post('/:id/question', async (c) => {
    const id = c.req.param('id')!;
    const body = await c.req.json() as { question: string };

    if (!body.question) {
      return c.json({ error: 'Question is required' }, 400);
    }

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    // Update status to needs_info
    const fromStatus = submission.status;
    await db.updateSubmission(id, {
      status: 'needs_info',
      version: submission.version + 1,
    });

    await db.addStatusChange({
      id: randomUUID(),
      submission_id: id,
      from_status: fromStatus,
      to_status: 'needs_info',
      changed_by: 'admin',
      reason: `Follow-up question: ${body.question}`,
      created_at: new Date().toISOString(),
    });

    return c.json({ success: true });
  });

  // POST /submissions/batch — Batch operations
  route.post('/batch', async (c) => {
    const body = await c.req.json() as {
      ids: string[];
      action: 'change_status' | 'archive' | 'unarchive';
      params?: { status?: string };
    };

    if (!body.ids?.length) {
      return c.json({ error: 'No submissions selected' }, 400);
    }

    let affected = 0;

    for (const id of body.ids) {
      const submission = await db.getSubmission(id);
      if (!submission) continue;

      if (body.action === 'change_status' && body.params?.status) {
        const fromStatus = submission.status;
        await db.updateSubmission(id, {
          status: body.params.status,
          version: submission.version + 1,
        });
        await db.addStatusChange({
          id: randomUUID(),
          submission_id: id,
          from_status: fromStatus,
          to_status: body.params.status,
          changed_by: 'admin',
          reason: 'Batch status change',
          created_at: new Date().toISOString(),
        });
        affected++;
      } else if (body.action === 'archive') {
        const fromStatus = submission.status;
        await db.updateSubmission(id, {
          status: 'archived',
          version: submission.version + 1,
        });
        await db.addStatusChange({
          id: randomUUID(),
          submission_id: id,
          from_status: fromStatus,
          to_status: 'archived',
          changed_by: 'admin',
          reason: 'Batch archive',
          created_at: new Date().toISOString(),
        });
        affected++;
      } else if (body.action === 'unarchive') {
        if (submission.status === 'archived') {
          // Restore to 'submitted' as default
          await db.updateSubmission(id, {
            status: 'submitted',
            version: submission.version + 1,
          });
          await db.addStatusChange({
            id: randomUUID(),
            submission_id: id,
            from_status: 'archived',
            to_status: 'submitted',
            changed_by: 'admin',
            reason: 'Batch unarchive',
            created_at: new Date().toISOString(),
          });
          affected++;
        }
      }
    }

    return c.json({ success: true, affected });
  });

  // GET /submissions/:id/notes — Get notes
  route.get('/:id/notes', async (c) => {
    const id = c.req.param('id')!;
    const notes = await db.getAdminNotes(id);

    const enriched = await Promise.all(
      notes.map(async (note) => {
        const author = await db.getUserById(note.author_id);
        return {
          id: note.id,
          submissionId: note.submission_id,
          author: author?.display_name || author?.email || 'Admin',
          content: note.content,
          createdAt: note.created_at,
        };
      }),
    );

    return c.json({ notes: enriched });
  });

  // POST /submissions/:id/notes — Add a note
  route.post('/:id/notes', async (c) => {
    const id = c.req.param('id')!;
    const body = await c.req.json() as { author: string; content: string };

    if (!body.content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    // For admin notes, we use 'admin' as the author_id since we don't have per-user auth yet
    const note = await db.addAdminNote({
      id: randomUUID(),
      submission_id: id,
      author_id: 'admin',
      content: body.content,
    });

    return c.json({ id: note.id, success: true });
  });

  // GET /submissions/:id/timeline — Get activity timeline
  route.get('/:id/timeline', async (c) => {
    const id = c.req.param('id')!;
    const history = await db.getStatusHistory(id);

    const events = await Promise.all(
      history.map(async (entry) => {
        const changedByUser = await db.getUserById(entry.changed_by);
        return {
          id: entry.id,
          submissionId: entry.submission_id,
          eventType: 'status_change',
          actor: changedByUser?.display_name || changedByUser?.email || entry.changed_by,
          details: {
            fromStatus: entry.from_status,
            toStatus: entry.to_status,
            reason: entry.reason,
          },
          createdAt: entry.created_at,
        };
      }),
    );

    return c.json({ events });
  });

  // GET /submissions/export — Export submissions
  route.get('/export', async (c) => {
    const format = c.req.query('format') || 'csv';
    const statusParam = c.req.query('status');
    const plParam = c.req.query('pLevel');

    const result = await db.listSubmissions({
      user_id: undefined,
      status: statusParam ? statusParam.split(',') : undefined,
      protection_level: plParam ? plParam.split(',') : undefined,
      page: 1,
      per_page: 10000,
    });

    if (format === 'json') {
      c.header('Content-Disposition', 'attachment; filename="submissions-export.json"');
      return c.json(result.data);
    }

    // CSV
    const csvHeader = 'ID,Title,Status,Protection Level,Domain,Completeness %,Created At,Updated At';
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

  // POST /submissions/:id/export/:format — Export single submission
  route.post('/:id/export/:format', async (c) => {
    const id = c.req.param('id')!;
    const format = c.req.param('format')!;

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    let sessionState: Record<string, unknown> = {};
    try {
      sessionState = JSON.parse(submission.session_state);
    } catch {
      // keep empty
    }

    if (format === 'json') {
      c.header('Content-Disposition', `attachment; filename="submission-${id}.json"`);
      return c.json(sessionState);
    }

    if (format === 'markdown') {
      const md = buildSimpleMarkdown(submission, sessionState);
      c.header('Content-Type', 'text/markdown');
      c.header('Content-Disposition', `attachment; filename="submission-${id}.md"`);
      return c.text(md);
    }

    return c.json({ error: 'Unsupported format' }, 400);
  });

  return route;
}

// Simple markdown builder for export
function buildSimpleMarkdown(
  submission: { title: string; description: string; status: string; domain: string; protection_level: string | null },
  _sessionState: Record<string, unknown>,
): string {
  const lines: string[] = [];
  lines.push(`# ${submission.title || 'Untitled Project'}`);
  lines.push('');
  lines.push(`> Status: ${submission.status}`);
  lines.push(`> Protection Level: ${submission.protection_level || 'N/A'}`);
  lines.push(`> Domain: ${submission.domain || 'N/A'}`);
  lines.push('');
  lines.push('## Description');
  lines.push('');
  lines.push(submission.description || 'No description provided.');
  lines.push('');
  return lines.join('\n');
}

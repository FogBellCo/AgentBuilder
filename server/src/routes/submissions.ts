import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../lib/db-adapter.js';
import type { EmailProvider } from '../lib/email-provider.js';
import type { AppEnv } from '../lib/types.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { calculateCompleteness, extractMetadata } from '../lib/completeness.js';
import { forwardToWebhook } from '../lib/webhook.js';
import { statusChangeEmail, friendlyStatus } from '../lib/email-templates.js';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['in_review', 'needs_info', 'archived'],
  in_review: ['needs_info', 'approved', 'archived'],
  needs_info: ['in_review', 'archived'],
  approved: ['building', 'archived'],
  building: ['complete', 'needs_info'],
  complete: ['archived'],
  archived: ['in_review'],
};

const createSubmissionSchema = z.object({
  sessionId: z.string().uuid().optional(),
  title: z.string().max(200).default(''),
  sessionState: z.record(z.unknown()),
});

const updateSubmissionSchema = z.object({
  title: z.string().max(200).optional(),
  sessionState: z.record(z.unknown()).optional(),
  expectedVersion: z.number().int().positive(),
});

const submitSchema = z.object({
  expectedVersion: z.number().int().positive(),
});

const transitionSchema = z.object({
  toStatus: z.enum([
    'in_review', 'needs_info', 'approved', 'building', 'complete', 'archived',
  ]),
  reason: z.string().max(1000).default(''),
});

const noteSchema = z.object({
  content: z.string().min(1).max(10000),
});

export function createSubmissionsRoutes(db: DatabaseAdapter, emailProvider: EmailProvider): Hono<AppEnv> {
  const route = new Hono<AppEnv>();

  // All submission routes require auth
  route.use('*', authMiddleware());

  // POST /api/submissions — Create
  route.post('/', async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const result = createSubmissionSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR', retryable: false, details: result.error.flatten() },
        400,
      );
    }

    const { sessionId, title, sessionState } = result.data;
    const id = sessionId || randomUUID();
    const meta = extractMetadata(sessionState);
    const completeness = calculateCompleteness(sessionState);

    const submission = await db.createSubmission({
      id,
      user_id: user.id,
      title: title || meta.title,
      description: meta.description,
      status: 'draft',
      protection_level: meta.protectionLevel,
      domain: meta.domain,
      vc_area: '',
      completeness_pct: completeness,
      output_formats: JSON.stringify(meta.outputFormats),
      session_state: JSON.stringify(sessionState),
      version: 1,
    });

    // Add initial status history
    await db.addStatusChange({
      id: randomUUID(),
      submission_id: id,
      from_status: '',
      to_status: 'draft',
      changed_by: user.id,
      reason: 'Submission created',
      created_at: new Date().toISOString(),
    });

    return c.json(
      {
        submission: {
          id: submission.id,
          status: submission.status,
          version: submission.version,
          createdAt: submission.created_at,
        },
      },
      201,
    );
  });

  // PUT /api/submissions/:id — Update (auto-save target)
  route.put(
    '/:id',
    rateLimitMiddleware({
      keyFn: (c) => `save:${c.get('user')?.id ?? 'anon'}`,
      max: 60,
      windowSec: 60,
    }),
    async (c) => {
      const user = c.get('user');
      const id = c.req.param('id')!;

      const body = await c.req.json();
      const result = updateSubmissionSchema.safeParse(body);
      if (!result.success) {
        return c.json(
          { error: 'Invalid request body', code: 'VALIDATION_ERROR', retryable: false },
          400,
        );
      }

      const { title, sessionState, expectedVersion } = result.data;

      // Fetch current submission
      const current = await db.getSubmission(id);
      if (!current) {
        return c.json({ error: 'Submission not found', code: 'NOT_FOUND', retryable: false }, 404);
      }

      // Ownership check
      if (current.user_id !== user.id && user.role !== 'admin') {
        return c.json({ error: 'Access denied', code: 'FORBIDDEN', retryable: false }, 403);
      }

      // Version conflict check
      if (current.version !== expectedVersion) {
        return c.json(
          {
            error: 'This submission has been modified since you last loaded it. Reload to get the latest version.',
            code: 'CONFLICT',
            retryable: false,
            serverVersion: current.version,
            clientVersion: expectedVersion,
          },
          409,
        );
      }

      // Build update fields
      const updateFields: Record<string, unknown> = {
        version: current.version + 1,
      };

      if (sessionState) {
        const meta = extractMetadata(sessionState);
        updateFields.session_state = JSON.stringify(sessionState);
        updateFields.title = title || meta.title;
        updateFields.description = meta.description;
        updateFields.protection_level = meta.protectionLevel;
        updateFields.domain = meta.domain;
        updateFields.output_formats = JSON.stringify(meta.outputFormats);
        updateFields.completeness_pct = calculateCompleteness(sessionState);
      } else if (title !== undefined) {
        updateFields.title = title;
      }

      const updated = await db.updateSubmission(id, updateFields);

      return c.json({
        submission: {
          id: updated!.id,
          version: updated!.version,
          completenessPercent: updated!.completeness_pct,
          updatedAt: updated!.updated_at,
        },
      });
    },
  );

  // GET /api/submissions — List
  route.get('/', async (c) => {
    const user = c.get('user');

    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
    const statusParam = c.req.query('status') || '';
    const plParam = c.req.query('protection_level') || '';
    const domain = c.req.query('domain') || '';
    const vcArea = c.req.query('vc_area') || '';
    const assignedTo = c.req.query('assigned_to') || '';
    const completenessMin = c.req.query('completeness_min') || '';
    const completenessMax = c.req.query('completeness_max') || '';
    const sort = c.req.query('sort') || 'updated_at';
    const order = (c.req.query('order') || 'desc') as 'asc' | 'desc';
    const search = c.req.query('search') || '';

    const filters = {
      // Regular users only see their own; admins see all
      user_id: user.role === 'admin' ? undefined : user.id,
      status: statusParam ? statusParam.split(',') : undefined,
      protection_level: plParam ? plParam.split(',') : undefined,
      domain: domain || undefined,
      vc_area: vcArea || undefined,
      assigned_to: user.role === 'admin' ? (assignedTo || undefined) : undefined,
      completeness_min: completenessMin ? parseInt(completenessMin, 10) : undefined,
      completeness_max: completenessMax ? parseInt(completenessMax, 10) : undefined,
      sort,
      order,
      search: search || undefined,
      page,
      per_page: perPage,
    };

    const result = await db.listSubmissions(filters);

    // Map to API response format
    const data = result.data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      protectionLevel: item.protection_level,
      domain: item.domain,
      completenessPercent: item.completeness_pct,
      outputFormats: JSON.parse(item.output_formats || '[]'),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return c.json({ data, pagination: result.pagination });
  });

  // GET /api/submissions/:id — Get single
  route.get('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id')!;

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found', code: 'NOT_FOUND', retryable: false }, 404);
    }

    if (submission.user_id !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Access denied', code: 'FORBIDDEN', retryable: false }, 403);
    }

    return c.json({
      submission: {
        id: submission.id,
        userId: submission.user_id,
        title: submission.title,
        description: submission.description,
        status: submission.status,
        protectionLevel: submission.protection_level,
        domain: submission.domain,
        vcArea: submission.vc_area,
        completenessPercent: submission.completeness_pct,
        outputFormats: JSON.parse(submission.output_formats || '[]'),
        sessionState: JSON.parse(submission.session_state),
        version: submission.version,
        assignedTo: submission.assigned_to,
        submittedAt: submission.submitted_at,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
      },
    });
  });

  // POST /api/submissions/:id/submit — User submits their draft
  route.post(
    '/:id/submit',
    rateLimitMiddleware({
      keyFn: (c) => `submit:${c.req.param('id') ?? ''}`,
      max: 3,
      windowSec: 3600,
    }),
    async (c) => {
      const user = c.get('user');
      const id = c.req.param('id')!;

      const body = await c.req.json();
      const result = submitSchema.safeParse(body);
      if (!result.success) {
        return c.json(
          { error: 'Invalid request body', code: 'VALIDATION_ERROR', retryable: false },
          400,
        );
      }

      const submission = await db.getSubmission(id);
      if (!submission) {
        return c.json({ error: 'Submission not found', code: 'NOT_FOUND', retryable: false }, 404);
      }

      // Only owner can submit
      if (submission.user_id !== user.id) {
        return c.json({ error: 'Access denied', code: 'FORBIDDEN', retryable: false }, 403);
      }

      // Only draft or needs_info can be submitted
      if (submission.status !== 'draft' && submission.status !== 'needs_info') {
        return c.json(
          { error: `Cannot submit a submission with status "${submission.status}"`, code: 'VALIDATION_ERROR', retryable: false },
          400,
        );
      }

      // Version check
      if (submission.version !== result.data.expectedVersion) {
        return c.json(
          {
            error: 'Version conflict',
            code: 'CONFLICT',
            retryable: false,
            serverVersion: submission.version,
            clientVersion: result.data.expectedVersion,
          },
          409,
        );
      }

      const fromStatus = submission.status;
      const updated = await db.updateSubmission(id, {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        version: submission.version + 1,
      });

      // Record status history
      await db.addStatusChange({
        id: randomUUID(),
        submission_id: id,
        from_status: fromStatus,
        to_status: 'submitted',
        changed_by: user.id,
        reason: 'User submitted the intake',
        created_at: new Date().toISOString(),
      });

      // Forward to webhook (fire and forget)
      forwardToWebhook(JSON.parse(submission.session_state)).catch((err: unknown) => {
        console.warn('[submit] Webhook forwarding failed:', err);
      });

      // Send confirmation email
      const template = statusChangeEmail(
        submission.title || 'Untitled Project',
        'Submitted -- we\'ll review it soon',
      );
      emailProvider.send({ to: user.email, ...template }).catch((err: unknown) => {
        console.warn('[submit] Confirmation email failed:', err);
      });

      return c.json({
        submission: {
          id: updated!.id,
          status: updated!.status,
          version: updated!.version,
          submittedAt: updated!.submitted_at,
        },
      });
    },
  );

  // POST /api/submissions/:id/transition — Admin status transition
  route.post('/:id/transition', adminMiddleware(), async (c) => {
    const user = c.get('user');
    const id = c.req.param('id')!;

    const body = await c.req.json();
    const result = transitionSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR', retryable: false },
        400,
      );
    }

    const { toStatus, reason } = result.data;

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found', code: 'NOT_FOUND', retryable: false }, 404);
    }

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[submission.status];
    if (!allowedNext || !allowedNext.includes(toStatus)) {
      return c.json(
        {
          error: `Cannot transition from "${submission.status}" to "${toStatus}"`,
          code: 'VALIDATION_ERROR',
          retryable: false,
        },
        400,
      );
    }

    const fromStatus = submission.status;
    const updated = await db.updateSubmission(id, {
      status: toStatus,
      version: submission.version + 1,
    });

    // Record status history
    await db.addStatusChange({
      id: randomUUID(),
      submission_id: id,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: user.id,
      reason,
      created_at: new Date().toISOString(),
    });

    // Send email notifications for certain transitions
    const submitter = await db.getUserById(submission.user_id);
    if (submitter) {
      const shouldNotify = ['needs_info', 'approved', 'archived', 'in_review'].includes(toStatus);
      if (shouldNotify) {
        const template = statusChangeEmail(
          submission.title || 'Untitled Project',
          friendlyStatus(toStatus),
          reason || undefined,
        );
        emailProvider.send({ to: submitter.email, ...template }).catch((err: unknown) => {
          console.warn('[transition] Notification email failed:', err);
        });
      }
    }

    return c.json({
      submission: {
        id: updated!.id,
        status: updated!.status,
        version: updated!.version,
      },
    });
  });

  // DELETE /api/submissions/:id
  route.delete('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id')!;

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found', code: 'NOT_FOUND', retryable: false }, 404);
    }

    // Owners can only delete drafts; admins can delete any
    if (user.role !== 'admin') {
      if (submission.user_id !== user.id) {
        return c.json({ error: 'Access denied', code: 'FORBIDDEN', retryable: false }, 403);
      }
      if (submission.status !== 'draft') {
        return c.json(
          { error: 'Only draft submissions can be deleted by the owner', code: 'VALIDATION_ERROR', retryable: false },
          400,
        );
      }
    }

    await db.deleteSubmission(id);
    return c.json({ success: true });
  });

  // GET /api/submissions/:id/history
  route.get('/:id/history', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id')!;

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found', code: 'NOT_FOUND', retryable: false }, 404);
    }

    if (submission.user_id !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Access denied', code: 'FORBIDDEN', retryable: false }, 403);
    }

    const history = await db.getStatusHistory(id);

    // Enrich with user emails
    const enriched = await Promise.all(
      history.map(async (entry) => {
        const changedByUser = await db.getUserById(entry.changed_by);
        return {
          id: entry.id,
          fromStatus: entry.from_status,
          toStatus: entry.to_status,
          changedBy: entry.changed_by,
          changedByEmail: changedByUser?.email || 'unknown',
          reason: entry.reason,
          createdAt: entry.created_at,
        };
      }),
    );

    return c.json({ history: enriched });
  });

  // POST /api/submissions/:id/notes — Admin only
  route.post('/:id/notes', adminMiddleware(), async (c) => {
    const user = c.get('user');
    const id = c.req.param('id')!;

    const body = await c.req.json();
    const result = noteSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR', retryable: false },
        400,
      );
    }

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found', code: 'NOT_FOUND', retryable: false }, 404);
    }

    const note = await db.addAdminNote({
      id: randomUUID(),
      submission_id: id,
      author_id: user.id,
      content: result.data.content,
    });

    return c.json(
      {
        note: {
          id: note.id,
          submissionId: note.submission_id,
          authorId: note.author_id,
          authorEmail: user.email,
          content: note.content,
          createdAt: note.created_at,
        },
      },
      201,
    );
  });

  // GET /api/submissions/:id/notes — Admin only
  route.get('/:id/notes', adminMiddleware(), async (c) => {
    const id = c.req.param('id')!;

    const submission = await db.getSubmission(id);
    if (!submission) {
      return c.json({ error: 'Submission not found', code: 'NOT_FOUND', retryable: false }, 404);
    }

    const notes = await db.getAdminNotes(id);
    const enriched = await Promise.all(
      notes.map(async (note) => {
        const author = await db.getUserById(note.author_id);
        return {
          id: note.id,
          authorId: note.author_id,
          authorEmail: author?.email || 'unknown',
          content: note.content,
          createdAt: note.created_at,
        };
      }),
    );

    return c.json({ notes: enriched });
  });

  return route;
}

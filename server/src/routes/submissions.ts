import { Hono } from 'hono';
import { z } from 'zod';
import {
  upsertSubmission,
  getSubmission,
  listSubmissions,
  deleteSubmission,
} from '../lib/db-operations.js';

const submissionsRoute = new Hono();

const upsertSchema = z.object({
  email: z.string().refine((v) => v.includes('@'), 'Must contain @'),
  title: z.string().default(''),
  status: z.string().default('draft'),
  sessionState: z.unknown(),
});

// List submissions for an email
submissionsRoute.get('/', (c) => {
  const email = c.req.query('email');
  if (!email) {
    return c.json({ error: 'email query parameter is required' }, 400);
  }
  const submissions = listSubmissions(email);
  return c.json({ submissions });
});

// Get a single submission by id
submissionsRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  const row = getSubmission(id);
  if (!row) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json({
    id: row.id,
    email: row.email,
    title: row.title,
    status: row.status,
    sessionState: JSON.parse(row.session_state),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

// Upsert a submission
submissionsRoute.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = upsertSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400);
  }
  const { email, title, status, sessionState } = result.data;
  upsertSubmission(id, email, title, status, JSON.stringify(sessionState));
  return c.json({ success: true, id });
});

// Delete a submission
submissionsRoute.delete('/:id', (c) => {
  const id = c.req.param('id');
  deleteSubmission(id);
  return c.json({ success: true });
});

export default submissionsRoute;

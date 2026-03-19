import { Hono } from 'hono';
import type { DatabaseAdapter } from '../../lib/db-adapter.js';

export function createAdminTeamRoutes(db: DatabaseAdapter): Hono {
  const route = new Hono();

  route.get('/', async (c) => {
    const members = await db.getTeamMembers();
    return c.json({ members });
  });

  route.post('/', async (c) => {
    const body = await c.req.json() as { name: string; email: string };
    if (!body.name || !body.email) {
      return c.json({ error: 'Name and email are required' }, 400);
    }

    const id = crypto.randomUUID();
    await db.addTeamMember({ id, name: body.name, email: body.email });

    return c.json({ id, success: true }, 201);
  });

  route.delete('/:id', async (c) => {
    const id = c.req.param('id')!;
    const removed = await db.removeTeamMember(id);
    if (!removed) {
      return c.json({ error: 'Team member not found' }, 404);
    }
    return c.json({ success: true });
  });

  return route;
}

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { createDatabaseAdapter } from './lib/db-factory.js';
import { createEmailProvider } from './lib/email-factory.js';
import { setAuthDb } from './middleware/auth.js';
import { bodyLimitMiddleware } from './middleware/body-limit.js';
import { createAuthRoutes } from './routes/auth.js';
import { createSubmissionsRoutes } from './routes/submissions.js';
import { createNewAdminRoutes } from './routes/admin/index.js';
import gapAnalysisRoute from './routes/gap-analysis.js';
import summaryRoute from './routes/summary.js';
import userSummaryRoute from './routes/user-summary.js';
import osiSummaryRoute from './routes/osi-summary.js';
import promptBundleRoute from './routes/prompt-bundle.js';
import submitRoute from './routes/submit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Hono();

// --- Initialize Database & Email ---
const db = createDatabaseAdapter();
const emailProvider = createEmailProvider();

// Wire db into auth middleware
setAuthDb(db);

// --- CORS Middleware ---
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  '/api/*',
  cors({
    origin: corsOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// --- Body Size Limit (2 MB) ---
app.use('/api/*', bodyLimitMiddleware(2 * 1024 * 1024));

// --- API Routes ---
app.route('/api/auth', createAuthRoutes(db, emailProvider));
app.route('/api/submissions', createSubmissionsRoutes(db, emailProvider));
app.route('/api/admin', createNewAdminRoutes(db));
app.route('/api/gap-analysis', gapAnalysisRoute);
app.route('/api/generate-summary', summaryRoute);
app.route('/api/generate-user-summary', userSummaryRoute);
app.route('/api/generate-osi-summary', osiSummaryRoute);
app.route('/api/generate-prompt-bundle', promptBundleRoute);
app.route('/api/submit', submitRoute);

// --- Health Check ---
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Static Files (production) ---
if (process.env.NODE_ENV === 'production') {
  const distPath = resolve(__dirname, '../../dist');

  app.use(
    '/*',
    serveStatic({
      root: distPath,
    })
  );

  // SPA fallback — serve index.html for all non-API, non-static routes
  app.get('*', (c) => {
    const path = c.req.path;
    if (path.startsWith('/api/')) {
      return c.notFound();
    }
    const indexHtml = readFileSync(
      resolve(distPath, 'index.html'),
      'utf-8'
    );
    return c.html(indexHtml);
  });
}

// --- Startup ---
async function start() {
  // Initialize database (creates tables, runs migrations)
  await db.initialize();
  console.log('Database initialized');

  // Clean up expired tokens periodically (every hour)
  setInterval(async () => {
    try {
      const deleted = await db.deleteExpiredTokens();
      if (deleted > 0) {
        console.log(`[cleanup] Deleted ${deleted} expired auth tokens`);
      }
    } catch (err) {
      console.warn('[cleanup] Failed to delete expired tokens:', err);
    }
  }, 60 * 60 * 1000);

  // --- Startup Validation ---
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      'FATAL: OPENAI_API_KEY environment variable is not set. ' +
      'The server cannot make LLM calls without it. ' +
      'Set it in your .env file or environment and restart.'
    );
    process.exit(1);
  }

  const port = parseInt(process.env.PORT || '3001', 10);

  console.log(`AgentBuilder API server starting on port ${port}`);
  console.log(`CORS origin: ${corsOrigin}`);
  console.log(`Database adapter: ${process.env.DB_ADAPTER || 'sqlite'}`);
  console.log(`Email provider: ${process.env.EMAIL_PROVIDER || 'console'}`);
  console.log(
    `OpenAI model: ${process.env.OPENAI_MODEL || 'gpt-5.2 (default)'}`
  );
  console.log(
    `Webhook URL: ${process.env.WEBHOOK_URL || '(not configured)'}`
  );

  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`Server running at http://localhost:${port}`);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

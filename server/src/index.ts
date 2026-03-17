import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import gapAnalysisRoute from './routes/gap-analysis.js';
import summaryRoute from './routes/summary.js';
import submitRoute from './routes/submit.js';
import submissionsRoute from './routes/submissions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Hono();

// --- CORS Middleware ---
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  '/api/*',
  cors({
    origin: corsOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

// --- API Routes ---
app.route('/api/gap-analysis', gapAnalysisRoute);
app.route('/api/generate-summary', summaryRoute);
app.route('/api/submit', submitRoute);
app.route('/api/submissions', submissionsRoute);

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

// --- Startup Validation ---
if (!process.env.OPENAI_API_KEY) {
  console.error(
    'FATAL: OPENAI_API_KEY environment variable is not set. ' +
    'The server cannot make LLM calls without it. ' +
    'Set it in your .env file or environment and restart.'
  );
  process.exit(1);
}

// --- Start Server ---
const port = parseInt(process.env.PORT || '3001', 10);

console.log(`AgentBuilder API server starting on port ${port}`);
console.log(`CORS origin: ${corsOrigin}`);
console.log(
  `OpenAI model: ${process.env.OPENAI_MODEL || 'gpt-4o (default)'}`
);
console.log(
  `Webhook URL: ${process.env.WEBHOOK_URL || '(not configured)'}`
);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);

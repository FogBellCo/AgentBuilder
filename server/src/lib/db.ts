import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = resolve(__dirname, '../../data');
mkdirSync(dataDir, { recursive: true });

const dbPath = resolve(dataDir, 'agentbuilder.db');
const db: DatabaseType = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    session_state TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
  CREATE INDEX IF NOT EXISTS idx_submissions_updated ON submissions(updated_at DESC);
`);

export default db;

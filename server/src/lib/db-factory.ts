import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseAdapter } from './db-adapter.js';
import { SqliteAdapter } from './db-adapters/sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createDatabaseAdapter(): DatabaseAdapter {
  const adapter = process.env.DB_ADAPTER || 'sqlite';

  switch (adapter) {
    case 'sqlite': {
      const dbPath = process.env.SQLITE_PATH || resolve(__dirname, '../../data/agentbuilder.db');
      return new SqliteAdapter(dbPath);
    }
    case 'postgres': {
      // PostgresAdapter placeholder — not implemented in this iteration.
      // When needed, create server/src/lib/db-adapters/postgres.ts implementing DatabaseAdapter
      // using the `pg` npm package and DATABASE_URL env var.
      throw new Error(
        'PostgresAdapter is not yet implemented. Set DB_ADAPTER=sqlite or implement server/src/lib/db-adapters/postgres.ts'
      );
    }
    default:
      throw new Error(`Unknown DB_ADAPTER: ${adapter}. Use 'sqlite' or 'postgres'.`);
  }
}

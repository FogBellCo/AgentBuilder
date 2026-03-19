import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  DatabaseAdapter,
  UserRow,
  AuthTokenRow,
  SubmissionRow,
  SubmissionListItem,
  CreateSubmissionInput,
  UpdateSubmissionInput,
  SubmissionFilters,
  PaginatedResult,
  StatusHistoryEntry,
  AdminNoteRow,
  CreateAdminNoteInput,
  AnalyticsResult,
  TeamMemberRow,
} from '../db-adapter.js';

export class SqliteAdapter implements DatabaseAdapter {
  private db: DatabaseType;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  async initialize(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Check if we need to migrate from v1
    const hasOldSubmissions = this.tableExists('submissions') && !this.columnExists('submissions', 'user_id');

    if (hasOldSubmissions && !this.tableExists('submissions_v1_backup')) {
      // Rename old table before creating new schema
      this.db.exec(`ALTER TABLE submissions RENAME TO submissions_v1_backup;`);
    }

    // Create all tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_login_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('magic_link', 'session')),
        expires_at TEXT NOT NULL,
        consumed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);

      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft','submitted','in_review','needs_info','approved','building','complete','archived')),
        protection_level TEXT CHECK (protection_level IN ('P1','P2','P3','P4')),
        domain TEXT NOT NULL DEFAULT '',
        vc_area TEXT NOT NULL DEFAULT '',
        completeness_pct INTEGER NOT NULL DEFAULT 0,
        output_formats TEXT NOT NULL DEFAULT '[]',
        session_state TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
        submitted_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
      CREATE INDEX IF NOT EXISTS idx_submissions_protection_level ON submissions(protection_level);
      CREATE INDEX IF NOT EXISTS idx_submissions_domain ON submissions(domain);
      CREATE INDEX IF NOT EXISTS idx_submissions_updated ON submissions(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_submissions_completeness ON submissions(completeness_pct);

      CREATE TABLE IF NOT EXISTS status_history (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        changed_by TEXT NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_status_history_submission ON status_history(submission_id);
      CREATE INDEX IF NOT EXISTS idx_status_history_created ON status_history(created_at DESC);

      CREATE TABLE IF NOT EXISTS admin_notes (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_admin_notes_submission ON admin_notes(submission_id);

      CREATE TABLE IF NOT EXISTS gap_analysis_responses (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        run_number INTEGER NOT NULL,
        overall_assessment TEXT NOT NULL DEFAULT '',
        questions TEXT NOT NULL,
        reclassification TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(submission_id, run_number)
      );
      CREATE INDEX IF NOT EXISTS idx_gap_responses_submission ON gap_analysis_responses(submission_id);
    `);

    // Create team_members table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Migrate v1 data if backup exists and new submissions table is empty
    if (this.tableExists('submissions_v1_backup')) {
      const count = this.db.prepare('SELECT COUNT(*) as cnt FROM submissions').get() as { cnt: number };
      if (count.cnt === 0) {
        this.migrateV1Data();
      }
    }

    // v2 → v3 migration: add flagged and score_overrides columns
    if (!this.columnExists('submissions', 'flagged')) {
      this.db.exec(`ALTER TABLE submissions ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0`);
    }
    if (!this.columnExists('submissions', 'score_overrides')) {
      this.db.exec(`ALTER TABLE submissions ADD COLUMN score_overrides TEXT DEFAULT NULL`);
    }

    // Set schema version
    this.db.prepare(`INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('schema_version', '3')`).run();
  }

  private tableExists(name: string): boolean {
    const row = this.db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    ).get(name) as { name: string } | undefined;
    return !!row;
  }

  private columnExists(table: string, column: string): boolean {
    try {
      const cols = this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
      return cols.some((c) => c.name === column);
    } catch {
      return false;
    }
  }

  private migrateV1Data(): void {
    interface OldRow {
      id: string;
      email: string;
      title: string;
      status: string;
      session_state: string;
      created_at: string;
      updated_at: string;
    }

    const oldRows = this.db.prepare('SELECT * FROM submissions_v1_backup').all() as OldRow[];
    if (oldRows.length === 0) return;

    console.log(`[migration] Migrating ${oldRows.length} v1 submissions...`);

    const uniqueEmails = [...new Set(oldRows.map((r) => r.email))];

    // Create users for each unique email
    const userMap = new Map<string, string>();
    for (const email of uniqueEmails) {
      const userId = randomUUID();
      this.db.prepare(
        `INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)`
      ).run(userId, email.toLowerCase().trim());

      // Get the actual user id (might already exist)
      const user = this.db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim()) as { id: string };
      userMap.set(email, user.id);
    }

    // Migrate submissions
    for (const row of oldRows) {
      const userId = userMap.get(row.email);
      if (!userId) continue;

      let sessionState: Record<string, unknown> = {};
      try {
        sessionState = JSON.parse(row.session_state);
      } catch {
        // keep empty
      }

      const projectIdea = sessionState.projectIdea as Record<string, unknown> | undefined;
      const description = (projectIdea?.description as string) || '';
      const domain = (projectIdea?.domain as string) || '';
      const protectionLevel = this.extractProtectionLevel(sessionState);

      this.db.prepare(`
        INSERT OR IGNORE INTO submissions (id, user_id, title, description, status, protection_level, domain, session_state, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        row.id,
        userId,
        row.title,
        description,
        row.status,
        protectionLevel,
        domain,
        row.session_state,
        row.created_at,
        row.updated_at,
      );
    }

    console.log(`[migration] Migration complete.`);
  }

  private extractProtectionLevel(state: Record<string, unknown>): string | null {
    const stages = state.stages as Record<string, { result?: { protectionLevel?: string } }> | undefined;
    const pl = stages?.GATHER?.result?.protectionLevel;
    if (pl && ['P1', 'P2', 'P3', 'P4'].includes(pl)) return pl;
    return null;
  }

  async close(): Promise<void> {
    this.db.close();
  }

  // --- Users ---

  async upsertUser(email: string): Promise<UserRow> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as UserRow | undefined;

    if (existing) {
      this.db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(existing.id);
      return { ...existing, last_login_at: new Date().toISOString() };
    }

    const id = randomUUID();
    this.db.prepare(
      `INSERT INTO users (id, email) VALUES (?, ?)`
    ).run(id, normalizedEmail);

    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    return (this.db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as UserRow | undefined) ?? null;
  }

  async getUserById(id: string): Promise<UserRow | null> {
    return (this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined) ?? null;
  }

  // --- Auth Tokens ---

  async createAuthToken(token: AuthTokenRow): Promise<void> {
    this.db.prepare(
      `INSERT INTO auth_tokens (token, user_id, type, expires_at, consumed_at) VALUES (?, ?, ?, ?, ?)`
    ).run(token.token, token.user_id, token.type, token.expires_at, token.consumed_at);
  }

  async getAuthToken(token: string): Promise<AuthTokenRow | null> {
    return (this.db.prepare('SELECT * FROM auth_tokens WHERE token = ?').get(token) as AuthTokenRow | undefined) ?? null;
  }

  async consumeAuthToken(token: string): Promise<AuthTokenRow | null> {
    const row = this.db.prepare(
      `SELECT * FROM auth_tokens WHERE token = ? AND type = 'magic_link' AND consumed_at IS NULL`
    ).get(token) as AuthTokenRow | undefined;

    if (!row) return null;

    this.db.prepare(
      `UPDATE auth_tokens SET consumed_at = datetime('now') WHERE token = ?`
    ).run(token);

    return { ...row, consumed_at: new Date().toISOString() };
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = this.db.prepare(
      `DELETE FROM auth_tokens WHERE expires_at < datetime('now')`
    ).run();
    return result.changes;
  }

  async deleteAuthToken(token: string): Promise<void> {
    this.db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
  }

  // --- Submissions ---

  async createSubmission(sub: CreateSubmissionInput): Promise<SubmissionRow> {
    this.db.prepare(`
      INSERT INTO submissions (id, user_id, title, description, status, protection_level, domain, vc_area, completeness_pct, output_formats, session_state, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sub.id, sub.user_id, sub.title, sub.description, sub.status,
      sub.protection_level, sub.domain, sub.vc_area, sub.completeness_pct,
      sub.output_formats, sub.session_state, sub.version,
    );

    return this.db.prepare('SELECT * FROM submissions WHERE id = ?').get(sub.id) as SubmissionRow;
  }

  async getSubmission(id: string): Promise<SubmissionRow | null> {
    return (this.db.prepare('SELECT * FROM submissions WHERE id = ?').get(id) as SubmissionRow | undefined) ?? null;
  }

  async updateSubmission(id: string, fields: UpdateSubmissionInput): Promise<SubmissionRow | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      status: 'status',
      protection_level: 'protection_level',
      domain: 'domain',
      vc_area: 'vc_area',
      completeness_pct: 'completeness_pct',
      output_formats: 'output_formats',
      session_state: 'session_state',
      version: 'version',
      assigned_to: 'assigned_to',
      submitted_at: 'submitted_at',
      flagged: 'flagged',
      score_overrides: 'score_overrides',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      const val = (fields as Record<string, unknown>)[key];
      if (val !== undefined) {
        setClauses.push(`${col} = ?`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) return this.getSubmission(id);

    setClauses.push(`updated_at = datetime('now')`);
    values.push(id);

    this.db.prepare(
      `UPDATE submissions SET ${setClauses.join(', ')} WHERE id = ?`
    ).run(...values);

    return this.getSubmission(id);
  }

  async listSubmissions(filters: SubmissionFilters): Promise<PaginatedResult<SubmissionListItem>> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.user_id) {
      conditions.push('user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status IN (${filters.status.map(() => '?').join(',')})`);
      params.push(...filters.status);
    }

    if (filters.protection_level && filters.protection_level.length > 0) {
      conditions.push(`protection_level IN (${filters.protection_level.map(() => '?').join(',')})`);
      params.push(...filters.protection_level);
    }

    if (filters.domain) {
      conditions.push('domain = ?');
      params.push(filters.domain);
    }

    if (filters.vc_area) {
      conditions.push('vc_area = ?');
      params.push(filters.vc_area);
    }

    if (filters.assigned_to) {
      conditions.push('assigned_to = ?');
      params.push(filters.assigned_to);
    }

    if (filters.completeness_min !== undefined) {
      conditions.push('completeness_pct >= ?');
      params.push(filters.completeness_min);
    }

    if (filters.completeness_max !== undefined) {
      conditions.push('completeness_pct <= ?');
      params.push(filters.completeness_max);
    }

    if (filters.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort field
    const allowedSorts = ['updated_at', 'created_at', 'title', 'completeness_pct', 'status'];
    const sortField = allowedSorts.includes(filters.sort || '') ? filters.sort! : 'updated_at';
    const sortOrder = filters.order === 'asc' ? 'ASC' : 'DESC';

    // Count total
    const countRow = this.db.prepare(
      `SELECT COUNT(*) as cnt FROM submissions ${whereClause}`
    ).get(...params) as { cnt: number };
    const total = countRow.cnt;

    const offset = (filters.page - 1) * filters.per_page;

    const rows = this.db.prepare(
      `SELECT id, user_id, title, description, status, protection_level, domain, completeness_pct, output_formats, created_at, updated_at
       FROM submissions ${whereClause}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`
    ).all(...params, filters.per_page, offset) as SubmissionListItem[];

    return {
      data: rows,
      pagination: {
        page: filters.page,
        perPage: filters.per_page,
        total,
        totalPages: Math.ceil(total / filters.per_page),
      },
    };
  }

  async deleteSubmission(id: string): Promise<void> {
    this.db.prepare('DELETE FROM submissions WHERE id = ?').run(id);
  }

  // --- Status History ---

  async addStatusChange(entry: StatusHistoryEntry): Promise<void> {
    this.db.prepare(`
      INSERT INTO status_history (id, submission_id, from_status, to_status, changed_by, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(entry.id, entry.submission_id, entry.from_status, entry.to_status, entry.changed_by, entry.reason);
  }

  async getStatusHistory(submissionId: string): Promise<StatusHistoryEntry[]> {
    return this.db.prepare(
      'SELECT * FROM status_history WHERE submission_id = ? ORDER BY created_at DESC'
    ).all(submissionId) as StatusHistoryEntry[];
  }

  // --- Admin Notes ---

  async addAdminNote(note: CreateAdminNoteInput): Promise<AdminNoteRow> {
    this.db.prepare(`
      INSERT INTO admin_notes (id, submission_id, author_id, content) VALUES (?, ?, ?, ?)
    `).run(note.id, note.submission_id, note.author_id, note.content);

    return this.db.prepare('SELECT * FROM admin_notes WHERE id = ?').get(note.id) as AdminNoteRow;
  }

  async getAdminNotes(submissionId: string): Promise<AdminNoteRow[]> {
    return this.db.prepare(
      'SELECT * FROM admin_notes WHERE submission_id = ? ORDER BY created_at DESC'
    ).all(submissionId) as AdminNoteRow[];
  }

  // --- Analytics ---

  async getAnalytics(from: string, to: string): Promise<AnalyticsResult> {
    const totalSubmissions = (this.db.prepare(
      `SELECT COUNT(*) as cnt FROM submissions WHERE created_at >= ? AND created_at <= ?`
    ).get(from, to) as { cnt: number }).cnt;

    const totalUsers = (this.db.prepare(
      `SELECT COUNT(DISTINCT user_id) as cnt FROM submissions WHERE created_at >= ? AND created_at <= ?`
    ).get(from, to) as { cnt: number }).cnt;

    const avgCompleteness = (this.db.prepare(
      `SELECT AVG(completeness_pct) as avg FROM submissions WHERE status = 'submitted' AND created_at >= ? AND created_at <= ?`
    ).get(from, to) as { avg: number | null }).avg ?? 0;

    // Average days to review: time from submitted to in_review
    const avgDays = (this.db.prepare(`
      SELECT AVG(julianday(sh.created_at) - julianday(s.submitted_at)) as avg
      FROM status_history sh
      JOIN submissions s ON sh.submission_id = s.id
      WHERE sh.to_status = 'in_review' AND sh.from_status = 'submitted'
        AND sh.created_at >= ? AND sh.created_at <= ?
    `).get(from, to) as { avg: number | null }).avg ?? 0;

    const statusRows = this.db.prepare(
      `SELECT status, COUNT(*) as cnt FROM submissions WHERE created_at >= ? AND created_at <= ? GROUP BY status`
    ).all(from, to) as Array<{ status: string; cnt: number }>;
    const byStatus: Record<string, number> = {};
    for (const r of statusRows) byStatus[r.status] = r.cnt;

    const plRows = this.db.prepare(
      `SELECT protection_level, COUNT(*) as cnt FROM submissions WHERE protection_level IS NOT NULL AND created_at >= ? AND created_at <= ? GROUP BY protection_level`
    ).all(from, to) as Array<{ protection_level: string; cnt: number }>;
    const byProtectionLevel: Record<string, number> = {};
    for (const r of plRows) byProtectionLevel[r.protection_level] = r.cnt;

    const domainRows = this.db.prepare(
      `SELECT domain, COUNT(*) as cnt FROM submissions WHERE domain != '' AND created_at >= ? AND created_at <= ? GROUP BY domain ORDER BY cnt DESC`
    ).all(from, to) as Array<{ domain: string; cnt: number }>;

    const weekRows = this.db.prepare(`
      SELECT date(created_at, 'weekday 0', '-6 days') as week, COUNT(*) as cnt
      FROM submissions
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY week
      ORDER BY week
    `).all(from, to) as Array<{ week: string; cnt: number }>;

    return {
      overview: {
        totalSubmissions,
        totalUsers,
        avgCompletenessAtSubmit: Math.round(avgCompleteness),
        avgDaysToReview: Math.round(avgDays * 10) / 10,
      },
      byStatus,
      byProtectionLevel,
      byDomain: domainRows.map((r) => ({ domain: r.domain, count: r.cnt })),
      submissionsOverTime: weekRows.map((r) => ({ week: r.week, count: r.cnt })),
    };
  }

  // --- Team Members ---

  async getTeamMembers(): Promise<TeamMemberRow[]> {
    return this.db.prepare('SELECT * FROM team_members ORDER BY name').all() as TeamMemberRow[];
  }

  async addTeamMember(member: { id: string; name: string; email: string }): Promise<TeamMemberRow> {
    this.db.prepare(
      `INSERT INTO team_members (id, name, email) VALUES (?, ?, ?)`
    ).run(member.id, member.name, member.email.toLowerCase().trim());

    return this.db.prepare('SELECT * FROM team_members WHERE id = ?').get(member.id) as TeamMemberRow;
  }

  async removeTeamMember(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Rate limiting helper: count recent magic links per email
  countRecentMagicLinks(email: string, withinMinutes: number): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as cnt FROM auth_tokens at
      JOIN users u ON at.user_id = u.id
      WHERE u.email = ? AND at.type = 'magic_link'
        AND at.created_at >= datetime('now', ? || ' minutes')
    `).get(email.toLowerCase().trim(), `-${withinMinutes}`) as { cnt: number };
    return row.cnt;
  }
}

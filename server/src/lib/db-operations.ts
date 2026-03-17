import db from './db.js';

export interface SubmissionRow {
  id: string;
  email: string;
  title: string;
  status: string;
  session_state: string;
  created_at: string;
  updated_at: string;
}

export interface SubmissionListItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const upsertStmt = db.prepare(`
  INSERT OR REPLACE INTO submissions (id, email, title, status, session_state, updated_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`);

const getStmt = db.prepare(`
  SELECT * FROM submissions WHERE id = ?
`);

const listStmt = db.prepare(`
  SELECT id, title, status, created_at, updated_at
  FROM submissions
  WHERE email = ?
  ORDER BY updated_at DESC
`);

const deleteStmt = db.prepare(`
  DELETE FROM submissions WHERE id = ?
`);

export function upsertSubmission(
  id: string,
  email: string,
  title: string,
  status: string,
  sessionState: string
): void {
  upsertStmt.run(id, email, title, status, sessionState);
}

export function getSubmission(id: string): SubmissionRow | null {
  return (getStmt.get(id) as SubmissionRow | undefined) ?? null;
}

export function listSubmissions(email: string): SubmissionListItem[] {
  const rows = listStmt.all(email) as Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function deleteSubmission(id: string): void {
  deleteStmt.run(id);
}

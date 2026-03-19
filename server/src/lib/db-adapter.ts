// DatabaseAdapter interface — all database access goes through this.
// Implementations: SqliteAdapter (default), PostgresAdapter (future).

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  last_login_at: string;
}

export interface AuthTokenRow {
  token: string;
  user_id: string;
  type: 'magic_link' | 'session';
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}

export interface SubmissionRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  protection_level: string | null;
  domain: string;
  vc_area: string;
  completeness_pct: number;
  output_formats: string; // JSON array string
  session_state: string;  // JSON string
  version: number;
  assigned_to: string | null;
  submitted_at: string | null;
  flagged: number;
  score_overrides: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface SubmissionListItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  protection_level: string | null;
  domain: string;
  completeness_pct: number;
  output_formats: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubmissionInput {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  protection_level: string | null;
  domain: string;
  vc_area: string;
  completeness_pct: number;
  output_formats: string;
  session_state: string;
  version: number;
}

export interface UpdateSubmissionInput {
  title?: string;
  description?: string;
  status?: string;
  protection_level?: string | null;
  domain?: string;
  vc_area?: string;
  completeness_pct?: number;
  output_formats?: string;
  session_state?: string;
  version?: number;
  assigned_to?: string | null;
  submitted_at?: string | null;
  flagged?: number;
  score_overrides?: string | null;
}

export interface SubmissionFilters {
  user_id?: string;
  status?: string[];
  protection_level?: string[];
  domain?: string;
  vc_area?: string;
  assigned_to?: string;
  completeness_min?: number;
  completeness_max?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  page: number;
  per_page: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface StatusHistoryEntry {
  id: string;
  submission_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  reason: string;
  created_at: string;
}

export interface AdminNoteRow {
  id: string;
  submission_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface CreateAdminNoteInput {
  id: string;
  submission_id: string;
  author_id: string;
  content: string;
}

export interface DatabaseAdapter {
  // Users
  upsertUser(email: string): Promise<UserRow>;
  getUserByEmail(email: string): Promise<UserRow | null>;
  getUserById(id: string): Promise<UserRow | null>;

  // Auth tokens
  createAuthToken(token: AuthTokenRow): Promise<void>;
  getAuthToken(token: string): Promise<AuthTokenRow | null>;
  consumeAuthToken(token: string): Promise<AuthTokenRow | null>;
  deleteExpiredTokens(): Promise<number>;
  deleteAuthToken(token: string): Promise<void>;

  // Submissions
  createSubmission(sub: CreateSubmissionInput): Promise<SubmissionRow>;
  getSubmission(id: string): Promise<SubmissionRow | null>;
  updateSubmission(id: string, fields: UpdateSubmissionInput): Promise<SubmissionRow | null>;
  listSubmissions(filters: SubmissionFilters): Promise<PaginatedResult<SubmissionListItem>>;
  deleteSubmission(id: string): Promise<void>;

  // Status history
  addStatusChange(entry: StatusHistoryEntry): Promise<void>;
  getStatusHistory(submissionId: string): Promise<StatusHistoryEntry[]>;

  // Admin notes
  addAdminNote(note: CreateAdminNoteInput): Promise<AdminNoteRow>;
  getAdminNotes(submissionId: string): Promise<AdminNoteRow[]>;

  // Analytics
  getAnalytics(from: string, to: string): Promise<AnalyticsResult>;

  // Team members
  getTeamMembers(): Promise<TeamMemberRow[]>;
  addTeamMember(member: { id: string; name: string; email: string }): Promise<TeamMemberRow>;
  removeTeamMember(id: string): Promise<boolean>;

  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
}

export interface AnalyticsResult {
  overview: {
    totalSubmissions: number;
    totalUsers: number;
    avgCompletenessAtSubmit: number;
    avgDaysToReview: number;
  };
  byStatus: Record<string, number>;
  byProtectionLevel: Record<string, number>;
  byDomain: Array<{ domain: string; count: number }>;
  submissionsOverTime: Array<{ week: string; count: number }>;
}

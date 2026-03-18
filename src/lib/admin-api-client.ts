/**
 * Admin API client — all /api/admin/* endpoint functions.
 * Uses Bearer token auth from localStorage.
 */

import type {
  PaginatedAdminResponse,
  AdminSubmissionDetail,
  AdminNote,
  ActivityEvent,
  TeamMember,
  AnalyticsData,
  SubmissionFilters,
  ScoreOverrides,
} from '@/types/admin';

const ADMIN_TOKEN_KEY = 'ucsd-agentbuilder-admin-token';

function getToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(jwt: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, jwt);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function hasAdminToken(): boolean {
  return !!getToken();
}

async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAdminToken();
    throw new AdminAuthError('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

// --- Auth ---

export async function adminLogin(token: string): Promise<{ jwt: string; expiresAt: string }> {
  const result = await adminFetch<{ jwt: string; expiresAt: string }>('/api/admin/auth', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  setAdminToken(result.jwt);
  return result;
}

// --- Submissions ---

export async function fetchAdminSubmissions(
  filters: SubmissionFilters,
): Promise<PaginatedAdminResponse> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status?.length) params.set('status', filters.status.join(','));
  if (filters.pLevel?.length) params.set('pLevel', filters.pLevel.join(','));
  if (filters.department?.length) params.set('department', filters.department.join(','));
  if (filters.minComplete !== undefined) params.set('minComplete', String(filters.minComplete));
  if (filters.maxComplete !== undefined) params.set('maxComplete', String(filters.maxComplete));
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.archived) params.set('archived', 'true');

  return adminFetch<PaginatedAdminResponse>(`/api/admin/submissions?${params.toString()}`);
}

export async function fetchAdminSubmission(id: string): Promise<AdminSubmissionDetail> {
  return adminFetch<AdminSubmissionDetail>(`/api/admin/submissions/${encodeURIComponent(id)}`);
}

export async function updateSubmissionStatus(id: string, status: string): Promise<{ success: boolean }> {
  return adminFetch<{ success: boolean }>(`/api/admin/submissions/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function assignSubmission(id: string, assignedTo: string | null): Promise<{ success: boolean }> {
  return adminFetch<{ success: boolean }>(`/api/admin/submissions/${encodeURIComponent(id)}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ assignedTo }),
  });
}

export async function toggleFlag(id: string, flagged: boolean): Promise<{ success: boolean }> {
  return adminFetch<{ success: boolean }>(`/api/admin/submissions/${encodeURIComponent(id)}/flag`, {
    method: 'PUT',
    body: JSON.stringify({ flagged }),
  });
}

export async function updateScoreOverrides(id: string, overrides: ScoreOverrides): Promise<{ success: boolean }> {
  return adminFetch<{ success: boolean }>(`/api/admin/submissions/${encodeURIComponent(id)}/scores`, {
    method: 'PUT',
    body: JSON.stringify(overrides),
  });
}

// --- Notes ---

export async function fetchAdminNotes(id: string): Promise<{ notes: AdminNote[] }> {
  return adminFetch<{ notes: AdminNote[] }>(`/api/admin/submissions/${encodeURIComponent(id)}/notes`);
}

export async function postAdminNote(id: string, author: string, content: string): Promise<{ id: string; success: boolean }> {
  return adminFetch<{ id: string; success: boolean }>(`/api/admin/submissions/${encodeURIComponent(id)}/notes`, {
    method: 'POST',
    body: JSON.stringify({ author, content }),
  });
}

// --- Timeline ---

export async function fetchTimeline(id: string): Promise<{ events: ActivityEvent[] }> {
  return adminFetch<{ events: ActivityEvent[] }>(`/api/admin/submissions/${encodeURIComponent(id)}/timeline`);
}

// --- Send follow-up question ---

export async function sendFollowUpQuestion(id: string, question: string): Promise<{ success: boolean }> {
  return adminFetch<{ success: boolean }>(`/api/admin/submissions/${encodeURIComponent(id)}/question`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

// --- Batch operations ---

export async function batchAction(
  ids: string[],
  action: 'change_status' | 'archive' | 'unarchive',
  params?: { status?: string },
): Promise<{ success: boolean; affected: number }> {
  return adminFetch<{ success: boolean; affected: number }>('/api/admin/submissions/batch', {
    method: 'POST',
    body: JSON.stringify({ ids, action, params }),
  });
}

// --- Analytics ---

export async function fetchAnalytics(from?: string, to?: string): Promise<AnalyticsData> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return adminFetch<AnalyticsData>(`/api/admin/analytics?${params.toString()}`);
}

// --- Team Members ---

export async function fetchTeamMembers(): Promise<{ members: TeamMember[] }> {
  return adminFetch<{ members: TeamMember[] }>('/api/admin/team');
}

export async function addTeamMember(name: string, email: string): Promise<{ id: string; success: boolean }> {
  return adminFetch<{ id: string; success: boolean }>('/api/admin/team', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

export async function removeTeamMember(id: string): Promise<{ success: boolean }> {
  return adminFetch<{ success: boolean }>(`/api/admin/team/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// --- Export ---

export async function exportSubmissions(
  filters: SubmissionFilters,
  format: 'csv' | 'json',
): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters.status?.length) params.set('status', filters.status.join(','));
  if (filters.pLevel?.length) params.set('pLevel', filters.pLevel.join(','));
  params.set('format', format);

  const token = getToken();
  const res = await fetch(`/api/admin/submissions/export?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

export async function exportSingleSubmission(
  id: string,
  format: 'json' | 'markdown',
): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`/api/admin/submissions/${encodeURIComponent(id)}/export/${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

import type { IntakePayload } from '@/types/decision-tree';
import type { GapQuestion, Reclassification } from '@/types/gap-analysis';
import type { UserSummarySections, OSISummary } from '@/types/summaries';
import type { OSICalculatedFields } from '@/lib/osi-summary-builder';

interface GapAnalysisRequest {
  intakePayload: IntakePayload;
  previousGapAnswers?: GapQuestion[];
}

interface GapAnalysisResponse {
  questions: GapQuestion[];
  overallAssessment: string;
  reclassification?: Reclassification;
}

interface ApiErrorResponse {
  error: string;
  retryable: boolean;
  code?: string;
  serverVersion?: number;
  clientVersion?: number;
}

export interface SubmissionListItem {
  id: string;
  title: string;
  description: string;
  status: string;
  protectionLevel: string | null;
  domain: string;
  completenessPercent: number;
  outputFormats: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionDetail extends SubmissionListItem {
  userId: string;
  vcArea: string;
  sessionState: Record<string, unknown>;
  version: number;
  assignedTo: string | null;
  submittedAt: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export class ApiConflictError extends Error {
  serverVersion: number;
  clientVersion: number;
  constructor(message: string, serverVersion: number, clientVersion: number) {
    super(message);
    this.name = 'ApiConflictError';
    this.serverVersion = serverVersion;
    this.clientVersion = clientVersion;
  }
}

// Legacy type alias for backward compatibility
export type SubmissionRow = SubmissionDetail;

async function apiFetch<T>(
  endpoint: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
    signal,
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    if (errorBody?.code === 'CONFLICT') {
      throw new ApiConflictError(
        errorBody.error,
        errorBody.serverVersion ?? 0,
        errorBody.clientVersion ?? 0,
      );
    }
    throw new Error(errorBody?.error ?? `API request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(errorBody?.error ?? `API request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

async function apiPut<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    if (errorBody?.code === 'CONFLICT') {
      throw new ApiConflictError(
        errorBody.error,
        errorBody.serverVersion ?? 0,
        errorBody.clientVersion ?? 0,
      );
    }
    throw new Error(errorBody?.error ?? `API request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

async function apiDelete<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(errorBody?.error ?? `API request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function postGapAnalysis(
  intakePayload: IntakePayload,
  previousGapAnswers?: GapQuestion[],
): Promise<GapAnalysisResponse> {
  const body: GapAnalysisRequest = { intakePayload, previousGapAnswers };
  return apiFetch<GapAnalysisResponse>('/api/gap-analysis', body);
}

export async function postGenerateSummary(
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[],
  signal?: AbortSignal,
) {
  return apiFetch<{
    sections: {
      executiveSummary: string;
      projectOverview: string;
      dataClassification: string;
      aiProcessingPlan: string;
      outputDeliverables: string;
      feasibilitySummary: string;
      complianceAndNextSteps: string;
    };
    reclassification?: Reclassification;
  }>('/api/generate-summary', { intakePayload, gapAnswers }, signal);
}

export async function postSubmit(payload: unknown) {
  return apiFetch<{ success: boolean }>('/api/submit', payload);
}

// --- Auth endpoints ---

export async function postMagicLink(email: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/api/auth/magic-link', { email });
}

export async function getAuthMe(): Promise<{ user: AuthUser }> {
  // Skip the network request entirely if no auth cookie exists,
  // avoiding noisy 401 console errors from the browser's network layer.
  if (!document.cookie.includes('auth_token')) {
    throw new Error('Not authenticated');
  }
  return apiGet<{ user: AuthUser }>('/api/auth/me');
}

export async function postLogout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/auth/logout', {});
}

// --- Submission endpoints (new auth-based API) ---

export async function fetchSubmissions(
  _email?: string,
): Promise<PaginatedResponse<SubmissionListItem>> {
  return apiGet<PaginatedResponse<SubmissionListItem>>('/api/submissions');
}

export async function fetchSubmission(id: string): Promise<{ submission: SubmissionDetail }> {
  return apiGet<{ submission: SubmissionDetail }>(`/api/submissions/${encodeURIComponent(id)}`);
}

export async function createSubmission(data: {
  sessionId?: string;
  title?: string;
  sessionState: Record<string, unknown>;
}): Promise<{ submission: { id: string; status: string; version: number; createdAt: string } }> {
  return apiFetch('/api/submissions', data);
}

export async function saveSubmission(
  id: string,
  data: { title?: string; sessionState?: Record<string, unknown>; expectedVersion: number },
): Promise<{ submission: { id: string; version: number; completenessPercent: number; updatedAt: string } }> {
  return apiPut(
    `/api/submissions/${encodeURIComponent(id)}`,
    data,
  );
}

export async function submitSubmission(
  id: string,
  expectedVersion: number,
): Promise<{ submission: { id: string; status: string; version: number; submittedAt: string } }> {
  return apiFetch(`/api/submissions/${encodeURIComponent(id)}/submit`, { expectedVersion });
}

export async function deleteSubmission(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/api/submissions/${encodeURIComponent(id)}`);
}

// --- Spec 02: Two-Summary System endpoints ---

export async function postGenerateUserSummary(
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[],
  signal?: AbortSignal,
): Promise<{ sections: UserSummarySections }> {
  return apiFetch<{ sections: UserSummarySections }>(
    '/api/generate-user-summary',
    { intakePayload, gapAnswers },
    signal,
  );
}

export async function postGenerateOSISummary(
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[],
  calculatedFields: OSICalculatedFields,
  signal?: AbortSignal,
): Promise<{
  processOverview: OSISummary['processOverview'];
  context: string;
  challenge: string;
  request: string;
  impactBullets: string[];
}> {
  return apiFetch(
    '/api/generate-osi-summary',
    { intakePayload, gapAnswers, calculatedFields },
    signal,
  );
}

export async function postGeneratePromptBundle(
  intakePayload: IntakePayload,
  gapAnswers: GapQuestion[],
  osiSummary: OSISummary | null,
  signal?: AbortSignal,
): Promise<{ markdown: string }> {
  return apiFetch<{ markdown: string }>(
    '/api/generate-prompt-bundle',
    { intakePayload, gapAnswers, osiSummary },
    signal,
  );
}

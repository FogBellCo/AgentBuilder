import type { IntakePayload } from '@/types/decision-tree';
import type { GapQuestion, Reclassification } from '@/types/gap-analysis';

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
}

export interface SubmissionListItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionRow extends SubmissionListItem {
  email: string;
  sessionState: object;
}

async function apiFetch<T>(
  endpoint: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(errorBody?.error ?? `API request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
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

export async function fetchSubmissions(
  email: string,
): Promise<{ submissions: SubmissionListItem[] }> {
  return apiGet<{ submissions: SubmissionListItem[] }>(
    `/api/submissions?email=${encodeURIComponent(email)}`,
  );
}

export async function fetchSubmission(id: string): Promise<SubmissionRow> {
  return apiGet<SubmissionRow>(`/api/submissions/${encodeURIComponent(id)}`);
}

export async function saveSubmission(
  id: string,
  data: { email: string; title: string; status: string; sessionState: object },
): Promise<{ success: boolean }> {
  return apiPut<{ success: boolean }>(
    `/api/submissions/${encodeURIComponent(id)}`,
    data,
  );
}

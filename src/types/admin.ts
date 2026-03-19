// Admin dashboard types

export interface AdminSubmissionRow {
  id: string;
  title: string;
  email: string;
  department: string;
  status: string;
  protectionLevel: string | null;
  completeness: number;
  assignedTo: string | null;
  flagged: boolean;
  priorityScores: { impact: number; effort: number; priority: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubmissionDetail extends AdminSubmissionRow {
  sessionState: Record<string, unknown>;
  scoreOverrides: ScoreOverrides | null;
  notes: AdminNote[];
  timeline: ActivityEvent[];
  archivedFromStatus: string | null;
  description: string;
  userId: string;
  submittedAt: string | null;
}

export interface AdminNote {
  id: string;
  submissionId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  submissionId: string;
  eventType: string;
  actor: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ScoreOverrides {
  desirability?: number;
  viability?: number;
  feasibility?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SubmissionFilters {
  q?: string;
  status?: string[];
  pLevel?: string[];
  department?: string[];
  minComplete?: number;
  maxComplete?: number;
  from?: string;
  to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  archived?: boolean;
}

export interface PaginatedAdminResponse {
  submissions: AdminSubmissionRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AnalyticsSummary {
  totalSubmissions: number;
  avgCompleteness: number;
  avgTimeToReview: number;
  needsAttention: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  submissionsOverTime: Array<{ period: string; count: number; byStatus: Record<string, number> }>;
  byDepartment: Array<{ department: string; count: number }>;
  byProjectType: Array<{ type: string; count: number }>;
  byProtectionLevel: Array<{ level: string; count: number }>;
  commonDataSources: Array<{ source: string; count: number }>;
}

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_info'
  | 'approved'
  | 'building'
  | 'complete'
  | 'archived';

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  needs_info: 'Needs Info',
  approved: 'Approved',
  building: 'Building',
  complete: 'Complete',
  archived: 'Archived',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  submitted: { bg: 'bg-blue/10', text: 'text-blue' },
  in_review: { bg: 'bg-yellow/20', text: 'text-gold' },
  needs_info: { bg: 'bg-orange/15', text: 'text-orange' },
  approved: { bg: 'bg-green/15', text: 'text-green' },
  building: { bg: 'bg-turquoise/15', text: 'text-turquoise' },
  complete: { bg: 'bg-navy/10', text: 'text-navy' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

export const ALL_STATUSES: SubmissionStatus[] = [
  'draft', 'submitted', 'in_review', 'needs_info',
  'approved', 'building', 'complete', 'archived',
];

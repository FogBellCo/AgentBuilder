import type { ProtectionLevelInfo } from '@/types/decision-tree';

export const protectionLevels: Record<string, ProtectionLevelInfo> = {
  P1: {
    level: 'P1',
    label: 'Public',
    tagline: 'Open access — no restrictions',
    description:
      'This data is publicly available. Anyone can access it without authentication. AI tools can freely process this data.',
    requirement: 'None — freely accessible',
    examples: [
      'Published research papers',
      'Public university web pages',
      'Open datasets (data.gov, etc.)',
      'Press releases and public announcements',
    ],
    color: 'var(--color-p1)',
  },
  P2: {
    level: 'P2',
    label: 'Internal',
    tagline: 'UCSD login required',
    description:
      'This data is internal to UCSD. Access requires authentication through Single Sign-On (SSO). AI tools can process this data when accessed through authenticated channels.',
    requirement: 'SSO authentication (UCSD Active Directory)',
    examples: [
      'Internal reports and memos',
      'Employee directories',
      'Course enrollment data',
      'Department budgets (non-confidential)',
    ],
    color: 'var(--color-p2)',
  },
  P3: {
    level: 'P3',
    label: 'Confidential',
    tagline: 'Special access required',
    description:
      'This data is confidential and requires additional authorization beyond standard SSO. Access is granted via API keys, VPN, or explicit permission from a data steward.',
    requirement: 'API key, VPN, or data steward approval',
    examples: [
      'Student records (FERPA-protected)',
      'Research data under NDA',
      'Proprietary vendor data',
      'Pre-publication research findings',
    ],
    color: 'var(--color-p3)',
  },
  P4: {
    level: 'P4',
    label: 'Restricted',
    tagline: 'AI use not permitted',
    description:
      'This data is classified as Restricted under UC policy. AI tools cannot be used with this data at this time. This classification exists to protect individuals and the university.',
    requirement: 'Not available for AI processing',
    examples: [
      'Social Security numbers',
      'Medical records (HIPAA)',
      'Financial account numbers',
      'Authentication credentials',
    ],
    color: 'var(--color-p4)',
  },
};

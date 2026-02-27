import type { OutputFormat, ProtectionLevel, FeasibilityResult } from '@/types/decision-tree';

export const feasibilityMatrix: Record<OutputFormat, Record<ProtectionLevel, FeasibilityResult>> = {
  chat: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'Requires SSO-authenticated chat session' },
    P3: { feasibility: 'allowed_with_conditions', conditions: 'Must use UCSD-approved AI platform with API key authorization' },
    P4: { feasibility: 'not_allowed', alternativeSuggestion: 'static_report' },
  },
  dashboard: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'Dashboard must be hosted behind UCSD SSO' },
    P3: { feasibility: 'allowed_with_conditions', conditions: 'Requires encrypted connection and audit logging' },
    P4: { feasibility: 'not_allowed', alternativeSuggestion: 'static_report' },
  },
  static_report: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'Report must be shared only within UCSD authenticated channels' },
    P3: { feasibility: 'allowed_with_conditions', conditions: 'Report must be encrypted and access-controlled' },
    P4: { feasibility: 'not_allowed' },
  },
  interactive_app: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'Application must require UCSD SSO login' },
    P3: { feasibility: 'allowed_with_conditions', conditions: 'Requires API key authentication and data access audit trail' },
    P4: { feasibility: 'not_allowed', alternativeSuggestion: 'dashboard' },
  },
  email_digest: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'Must be sent to UCSD email addresses only' },
    P3: { feasibility: 'not_allowed', conditions: 'Email is not a secure channel for confidential data', alternativeSuggestion: 'dashboard' },
    P4: { feasibility: 'not_allowed', alternativeSuggestion: 'static_report' },
  },
  slide_deck: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'Slides should be shared within UCSD only' },
    P3: { feasibility: 'allowed_with_conditions', conditions: 'Slides must be encrypted and audience restricted' },
    P4: { feasibility: 'not_allowed', alternativeSuggestion: 'static_report' },
  },
  api_feed: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'API must require SSO token authentication' },
    P3: { feasibility: 'allowed_with_conditions', conditions: 'API must use encrypted transport and API key validation' },
    P4: { feasibility: 'not_allowed' },
  },
  smart_alerts: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'Alerts should not contain raw data — summaries only' },
    P3: { feasibility: 'allowed_with_conditions', conditions: 'Alerts must be delivered through secure, authenticated channels' },
    P4: { feasibility: 'not_allowed', alternativeSuggestion: 'dashboard' },
  },
  knowledge_base: {
    P1: { feasibility: 'allowed' },
    P2: { feasibility: 'allowed_with_conditions', conditions: 'Knowledge base must be behind UCSD SSO' },
    P3: { feasibility: 'allowed_with_conditions', conditions: 'Requires access controls and audit logging' },
    P4: { feasibility: 'not_allowed', alternativeSuggestion: 'static_report' },
  },
};

/**
 * Maps output formats to project type categories for analytics.
 * Spec 06 section 6e.
 */

const FORMAT_TO_TYPE: Record<string, string> = {
  chat: 'Chatbot / Q&A',
  knowledge_base: 'Chatbot / Q&A',
  dashboard: 'Report Generation',
  static_report: 'Report Generation',
  slide_deck: 'Report Generation',
  workflow_automation: 'Workflow Automation',
  system_integration: 'Workflow Automation',
  api_feed: 'Data Processing',
  email_digest: 'Data Processing',
  smart_alerts: 'Data Processing',
  interactive_app: 'Interactive App',
  embedded_widget: 'Interactive App',
};

export function classifyProjectType(outputFormats: string[]): string {
  if (!outputFormats.length) return 'Other';

  // Count votes per type
  const votes: Record<string, number> = {};
  for (const fmt of outputFormats) {
    const type = FORMAT_TO_TYPE[fmt] ?? 'Other';
    votes[type] = (votes[type] ?? 0) + 1;
  }

  // Return the type with the most votes
  let best = 'Other';
  let bestCount = 0;
  for (const [type, count] of Object.entries(votes)) {
    if (count > bestCount) {
      best = type;
      bestCount = count;
    }
  }
  return best;
}

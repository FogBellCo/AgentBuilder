import type { OutputFormatInfo } from '@/types/decision-tree';

export const outputFormats: OutputFormatInfo[] = [
  {
    format: 'chat',
    label: 'AI Chat Assistant',
    description: 'Have a conversation with an AI that knows your data. Great for exploratory questions and ad-hoc analysis.',
    icon: 'MessageCircle',
  },
  {
    format: 'dashboard',
    label: 'Visual Dashboard',
    description: 'See your data as charts, graphs, and live metrics. Ideal for KPI tracking and trend monitoring.',
    icon: 'LayoutDashboard',
  },
  {
    format: 'static_report',
    label: 'Report or Document',
    description: 'Get a polished report you can share, print, or archive. Perfect for compliance and presentations.',
    icon: 'FileText',
  },
  {
    format: 'interactive_app',
    label: 'Interactive Explorer',
    description: 'Build a filterable, searchable tool for your team. Best for data exploration and self-service analytics.',
    icon: 'MousePointerClick',
  },
  {
    format: 'email_digest',
    label: 'Email Summary',
    description: 'Receive automated AI-generated email summaries on a schedule. Good for recurring monitoring.',
    icon: 'Mail',
  },
  {
    format: 'slide_deck',
    label: 'Presentation Slides',
    description: 'Auto-generate slides ready for meetings. Suited for executive briefings and team presentations.',
    icon: 'Presentation',
  },
  {
    format: 'smart_alerts',
    label: 'Smart Alerts',
    description: 'Get notified when AI detects something important in your data — anomalies, thresholds, or trends.',
    icon: 'Bell',
  },
  {
    format: 'knowledge_base',
    label: 'Team Knowledge Base',
    description: 'AI organizes your data into a searchable knowledge base for your team to reference.',
    icon: 'BookOpen',
  },
  {
    format: 'api_feed',
    label: 'Data Feed / API',
    description: 'Connect AI output to other systems automatically. For system integration and automation pipelines.',
    icon: 'Plug',
    technicalOnly: true,
  },
];

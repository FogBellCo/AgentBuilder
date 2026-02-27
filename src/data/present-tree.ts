import type { DecisionNode } from '@/types/decision-tree';

export const presentTree: DecisionNode[] = [
  {
    id: 'present-format',
    stage: 'PRESENT',
    question: 'How do you want to see the results?',
    description: 'Choose the format that best fits how you and your audience will use the AI output.',
    inputType: 'single_choice',
    options: [
      {
        id: 'pick-chat',
        label: 'AI Chat Assistant',
        description: 'Have a conversation with an AI that knows your data',
        icon: 'MessageCircle',
        nextNodeId: 'present-confirm',
      },
      {
        id: 'pick-dashboard',
        label: 'Visual Dashboard',
        description: 'Charts, graphs, and live metrics',
        icon: 'LayoutDashboard',
        nextNodeId: 'present-confirm',
      },
      {
        id: 'pick-report',
        label: 'Report or Document',
        description: 'A polished report you can share or archive',
        icon: 'FileText',
        nextNodeId: 'present-confirm',
      },
      {
        id: 'pick-app',
        label: 'Interactive Explorer',
        description: 'A filterable, searchable tool for your team',
        icon: 'MousePointerClick',
        nextNodeId: 'present-confirm',
      },
    ],
  },
  {
    id: 'present-more-options',
    stage: 'PRESENT',
    question: 'Here are more output options:',
    description: 'These formats serve specialized needs.',
    inputType: 'single_choice',
    options: [
      {
        id: 'pick-email',
        label: 'Email Summary',
        description: 'Automated AI-generated email digests on a schedule',
        icon: 'Mail',
        nextNodeId: 'present-confirm',
      },
      {
        id: 'pick-slides',
        label: 'Presentation Slides',
        description: 'Auto-generated slides for meetings',
        icon: 'Presentation',
        nextNodeId: 'present-confirm',
      },
      {
        id: 'pick-alerts',
        label: 'Smart Alerts',
        description: 'Notifications when AI detects anomalies or thresholds',
        icon: 'Bell',
        nextNodeId: 'present-confirm',
      },
      {
        id: 'pick-kb',
        label: 'Team Knowledge Base',
        description: 'AI-organized, searchable knowledge base',
        icon: 'BookOpen',
        nextNodeId: 'present-confirm',
      },
    ],
  },
  {
    id: 'present-confirm',
    stage: 'PRESENT',
    question: 'Checking feasibility for your chosen format...',
    description: 'We\'ll verify this output format works with your data classification level.',
    inputType: 'confirmation',
    options: [
      {
        id: 'confirm-present',
        label: 'See my complete summary',
        icon: 'CheckCircle2',
        nextNodeId: null,
      },
      {
        id: 'change-format',
        label: 'Choose a different format',
        icon: 'ArrowLeft',
        nextNodeId: 'present-format',
      },
    ],
  },
];

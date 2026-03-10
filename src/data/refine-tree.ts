import type { DecisionNode } from '@/types/decision-tree';

export const refineTree: DecisionNode[] = [
  // Sub-step A: AI Task Selection
  {
    id: 'refine-task',
    stage: 'REFINE',
    question: 'What do you want AI to do with your data?',
    description: 'Choose the primary task. You can combine tasks later.',
    inputType: 'single_choice',
    options: [
      {
        id: 'summarize',
        label: 'Summarize or extract key points',
        description: 'Get the important parts from a large amount of information',
        icon: 'FileText',
        nextNodeId: 'refine-transform',
      },
      {
        id: 'analyze',
        label: 'Analyze trends and patterns',
        description: 'Spot what\u2019s changing, find connections, or detect outliers',
        icon: 'TrendingUp',
        nextNodeId: 'refine-transform',
      },
      {
        id: 'compare',
        label: 'Compare or cross-check',
        description: 'Check one thing against another \u2014 find matches, differences, or gaps',
        icon: 'GitCompare',
        nextNodeId: 'refine-transform',
      },
      {
        id: 'recommend',
        label: 'Give suggestions or guidance',
        description: 'Help people make decisions or find the right next step',
        icon: 'Sparkles',
        nextNodeId: 'refine-transform',
      },
      {
        id: 'classify',
        label: 'Sort, label, or score',
        description: 'Put things into categories, assign tags, or rate by priority',
        icon: 'Tags',
        nextNodeId: 'refine-transform',
      },
      {
        id: 'answer',
        label: 'Answer questions from documents',
        description: 'Let people ask questions and get answers based on your files and policies',
        icon: 'MessageSquareText',
        nextNodeId: 'refine-transform',
      },
      {
        id: 'generate',
        label: 'Draft or create content',
        description: 'Write descriptions, reports, emails, or other text based on your data',
        icon: 'PenLine',
        nextNodeId: 'refine-transform',
      },
      {
        id: 'extract',
        label: 'Pull data from files',
        description: 'Read documents, images, or forms and pull out specific information',
        icon: 'FileOutput',
        nextNodeId: 'refine-transform',
      },
    ],
  },
  // Sub-step B: Data Transformation
  {
    id: 'refine-transform',
    stage: 'REFINE',
    question: 'How should the data be prepared before AI processes it?',
    description: 'Think about whether the data needs any cleaning or filtering first.',
    inputType: 'single_choice',
    options: [
      {
        id: 'as-is',
        label: 'Use it as-is',
        description: 'The data is ready — no preparation needed',
        icon: 'CheckCircle2',
        nextNodeId: 'refine-audience',
      },
      {
        id: 'filter',
        label: 'Filter to a specific subset',
        description: 'Only use part of the data (e.g., last quarter, one department)',
        icon: 'Filter',
        nextNodeId: 'refine-audience',
      },
      {
        id: 'combine',
        label: 'Combine multiple data sources',
        description: 'Merge information from different places',
        icon: 'Merge',
        nextNodeId: 'refine-audience',
      },
      {
        id: 'deidentify',
        label: 'Clean or de-identify sensitive fields',
        description: 'Remove or mask personal identifiers before processing',
        icon: 'EyeOff',
        nextNodeId: 'refine-audience',
      },
    ],
  },
  // Sub-step C: Audience & Permissions Re-check
  {
    id: 'refine-audience',
    stage: 'REFINE',
    question: 'Who will see the AI output?',
    description: 'The intended audience affects what the AI can produce and how it should be delivered.',
    inputType: 'single_choice',
    classifiesProtectionLevel: true,
    options: [
      {
        id: 'just-me',
        label: 'Just me',
        description: 'I\'m the only one who will see the results',
        icon: 'User',
        nextNodeId: 'refine-confirm',
      },
      {
        id: 'my-team',
        label: 'My team or department',
        description: 'Shared within a group that has similar access',
        icon: 'Users',
        nextNodeId: 'refine-confirm',
      },
      {
        id: 'campus-wide',
        label: 'Campus-wide',
        description: 'Available to anyone at UCSD',
        icon: 'Building2',
        nextNodeId: 'refine-audience-warning',
      },
      {
        id: 'public-external',
        label: 'Public or external audience',
        description: 'Will be shared outside of UCSD',
        icon: 'Globe',
        nextNodeId: 'refine-audience-warning',
      },
    ],
  },
  {
    id: 'refine-audience-warning',
    stage: 'REFINE',
    question: 'Heads up: sharing with a wider audience may change your data requirements.',
    description: 'If your original data is Internal (P2) or higher, the AI output may still carry those restrictions. The output might need to be de-identified or access-controlled.',
    inputType: 'confirmation',
    options: [
      {
        id: 'understood',
        label: 'I understand — continue',
        icon: 'CheckCircle2',
        nextNodeId: 'refine-confirm',
      },
      {
        id: 'narrow-audience',
        label: 'Let me narrow my audience',
        icon: 'ArrowLeft',
        nextNodeId: 'refine-audience',
      },
    ],
  },
  {
    id: 'refine-confirm',
    stage: 'REFINE',
    question: 'Great — let\'s add some detail to your refinement plan.',
    description: 'You\'ve outlined the AI tasks, data preparation, and audience. Next, you can fine-tune each task with specific instructions.',
    inputType: 'confirmation',
    options: [
      {
        id: 'confirm-refine',
        label: 'Continue to add details',
        icon: 'ArrowRight',
        nextNodeId: null,
      },
      {
        id: 'redo-refine',
        label: 'Let me change my answers',
        icon: 'ArrowLeft',
        nextNodeId: 'refine-task',
      },
    ],
  },
];

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Stage,
  StageStatus,
  StageResult,
  ProtectionLevel,
  OutputFormat,
  ProjectIdea,
  GatherDetails,
  RefineDetails,
  PresentDetails,
  ConversationalAnswers,
} from '@/types/decision-tree';
import type {
  GapAnalysisState,
  AISummaryState,
  GapQuestion,
  Reclassification,
} from '@/types/gap-analysis';
import type { UserSummaryState, WorkloadDetails } from '@/types/summaries';
import { generateId } from '@/lib/utils';

const defaultUserSummary: UserSummaryState = {
  status: 'idle',
  sections: null,
  manualEdits: {},
};

const defaultGapAnalysis: GapAnalysisState = {
  status: 'idle',
  questions: [],
  overallAssessment: '',
  runCount: 0,
  completenessScore: 0,
  readinessLabel: 'needs_work',
  lastAnalyzedAt: null,
  staticGaps: [],
};

const defaultAISummary: AISummaryState = {
  status: 'idle',
  sections: null,
  manualEdits: {},
};

const defaultConversationalAnswers: ConversationalAnswers = {
  teamWho: '',
  whyNow: [],
  consequences: '',
  workloadFrequency: '',
  workloadDuration: '',
  workloadPeople: '',
  workloadPainPoint: '',
  currentTools: [],
  currentToolsOther: '',
  magicWand: '',
  onBehalf: '',
  onBehalfName: '',
  tritonGPT: '',
};

interface SessionState {
  sessionId: string;
  stages: Record<Stage, { status: StageStatus; result?: StageResult }>;
  currentStage: Stage | null;
  currentNodeId: string | null;
  history: Array<{ stage: Stage; nodeId: string }>;
  stageAnswers: Record<Stage, Record<string, string>>;

  // Enhanced intake fields
  projectIdea: ProjectIdea | null;
  gatherDetails: GatherDetails | null;
  refineDetails: RefineDetails | null;
  presentDetails: PresentDetails | null;

  // Gap Analysis
  gapAnalysis: GapAnalysisState;

  // AI Summary
  aiSummary: AISummaryState;

  // Conversational Answers
  conversationalAnswers: ConversationalAnswers;

  // User-Facing Summary (Spec 02)
  userSummary: UserSummaryState;
  workloadDetails: WorkloadDetails | null;
  userSummaryPromptDismissed: boolean;

  // Actions
  setCurrentStage: (stage: Stage) => void;
  setCurrentNode: (nodeId: string) => void;
  recordAnswer: (stage: Stage, nodeId: string, optionId: string) => void;
  completeStage: (stage: Stage, protectionLevel: ProtectionLevel, outputFormat?: OutputFormat) => void;
  pushHistory: (stage: Stage, nodeId: string) => void;
  popHistory: () => { stage: Stage; nodeId: string } | undefined;
  resetSession: () => void;
  getEffectiveProtectionLevel: () => ProtectionLevel;

  // Enhanced intake actions
  setProjectIdea: (idea: ProjectIdea) => void;
  setGatherDetails: (details: GatherDetails) => void;
  setRefineDetails: (details: RefineDetails) => void;
  setPresentDetails: (details: PresentDetails) => void;

  // Gap Analysis actions
  setGapAnalysisLoading: () => void;
  setGapAnalysisResult: (questions: GapQuestion[], assessment: string, reclassification?: Reclassification) => void;
  setGapAnalysisError: (message: string) => void;
  answerGapQuestion: (questionId: string, answer: string, selectedOptions?: string[]) => void;
  snoozeGapQuestion: (questionId: string) => void;
  unsnoozeGapQuestion: (questionId: string) => void;
  updateCompletenessScore: (score: number, label: GapAnalysisState['readinessLabel']) => void;
  setStaticGaps: (gaps: GapQuestion[]) => void;
  setGapAnalysisFallback: (staticGaps: GapQuestion[]) => void;

  // AI Summary actions
  setAISummaryLoading: () => void;
  setAISummaryResult: (sections: AISummaryState['sections']) => void;
  setAISummaryError: (message: string) => void;
  editSummarySection: (sectionKey: string, content: string) => void;
  clearManualEdit: (sectionKey: string) => void;

  // Conversational answer actions
  setConversationalAnswer: <K extends keyof ConversationalAnswers>(
    key: K,
    value: ConversationalAnswers[K]
  ) => void;
  setConversationalAnswers: (partial: Partial<ConversationalAnswers>) => void;

  // User Summary actions (Spec 02)
  setUserSummaryLoading: () => void;
  setUserSummaryResult: (sections: UserSummaryState['sections']) => void;
  setUserSummaryError: (message: string) => void;
  editUserSummarySection: (sectionKey: string, content: string) => void;
  clearUserSummaryEdit: (sectionKey: string) => void;
  setWorkloadDetails: (details: WorkloadDetails) => void;
  dismissUserSummaryPrompt: () => void;

  // Reclassification
  applyReclassification: (newLevel: ProtectionLevel) => void;

  // Session snapshot
  loadSession: (snapshot: Record<string, unknown>) => void;
  getSessionSnapshot: () => Record<string, unknown>;
}

const initialStages: Record<Stage, { status: StageStatus }> = {
  GATHER: { status: 'not_started' },
  REFINE: { status: 'not_started' },
  PRESENT: { status: 'not_started' },
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: generateId(),
      stages: { ...initialStages },
      currentStage: null,
      currentNodeId: null,
      history: [],
      stageAnswers: { GATHER: {}, REFINE: {}, PRESENT: {} },

      // Enhanced intake fields
      projectIdea: null,
      gatherDetails: null,
      refineDetails: null,
      presentDetails: null,

      // Gap Analysis
      gapAnalysis: { ...defaultGapAnalysis },

      // AI Summary
      aiSummary: { ...defaultAISummary },

      // Conversational Answers
      conversationalAnswers: { ...defaultConversationalAnswers },

      // User-Facing Summary (Spec 02)
      userSummary: { ...defaultUserSummary },
      workloadDetails: null,
      userSummaryPromptDismissed: false,

      setCurrentStage: (stage) =>
        set((state) => ({
          currentStage: stage,
          stages: {
            ...state.stages,
            [stage]: {
              ...state.stages[stage],
              status: state.stages[stage].status === 'not_started' ? 'in_progress' : state.stages[stage].status,
            },
          },
        })),

      setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),

      recordAnswer: (stage, nodeId, optionId) =>
        set((state) => ({
          stageAnswers: {
            ...state.stageAnswers,
            [stage]: { ...state.stageAnswers[stage], [nodeId]: optionId },
          },
        })),

      completeStage: (stage, protectionLevel, outputFormat) =>
        set((state) => ({
          stages: {
            ...state.stages,
            [stage]: {
              status: 'complete' as StageStatus,
              result: {
                stage,
                protectionLevel,
                answers: state.stageAnswers[stage],
                outputFormat,
              },
            },
          },
          currentStage: null,
          currentNodeId: null,
        })),

      pushHistory: (stage, nodeId) =>
        set((state) => ({
          history: [...state.history, { stage, nodeId }],
        })),

      popHistory: () => {
        const state = get();
        if (state.history.length === 0) return undefined;
        const last = state.history[state.history.length - 1];
        set({ history: state.history.slice(0, -1) });
        return last;
      },

      resetSession: () =>
        set({
          sessionId: generateId(),
          stages: {
            GATHER: { status: 'not_started' },
            REFINE: { status: 'not_started' },
            PRESENT: { status: 'not_started' },
          },
          currentStage: null,
          currentNodeId: null,
          history: [],
          stageAnswers: { GATHER: {}, REFINE: {}, PRESENT: {} },
          projectIdea: null,
          gatherDetails: null,
          refineDetails: null,
          presentDetails: null,
          gapAnalysis: { ...defaultGapAnalysis },
          aiSummary: { ...defaultAISummary },
          conversationalAnswers: { ...defaultConversationalAnswers },
          userSummary: { ...defaultUserSummary },
          workloadDetails: null,
          userSummaryPromptDismissed: false,
        }),

      getEffectiveProtectionLevel: () => {
        const state = get();
        const gatherResult = state.stages.GATHER.result;
        return gatherResult?.protectionLevel ?? 'P1';
      },

      // Enhanced intake actions
      setProjectIdea: (idea) => set({ projectIdea: idea }),
      setGatherDetails: (details) => set({ gatherDetails: details }),
      setRefineDetails: (details) => set({ refineDetails: details }),
      setPresentDetails: (details) => set({ presentDetails: details }),

      // Conversational answer actions
      setConversationalAnswer: (key, value) =>
        set((state) => ({
          conversationalAnswers: {
            ...state.conversationalAnswers,
            [key]: value,
          },
        })),

      setConversationalAnswers: (partial) =>
        set((state) => ({
          conversationalAnswers: {
            ...state.conversationalAnswers,
            ...partial,
          },
        })),

      // Gap Analysis actions
      setGapAnalysisLoading: () =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            status: 'loading',
            errorMessage: undefined,
          },
        })),

      setGapAnalysisResult: (questions, assessment, reclassification) =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            status: 'ready',
            questions: questions.map((q) => ({ ...q, status: q.status ?? 'pending' })),
            overallAssessment: assessment,
            reclassification,
            errorMessage: undefined,
            runCount: state.gapAnalysis.runCount + 1,
            lastAnalyzedAt: new Date().toISOString(),
          },
        })),

      setGapAnalysisError: (message) =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            status: 'error',
            errorMessage: message,
          },
        })),

      answerGapQuestion: (questionId, answer, selectedOptions) =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            questions: state.gapAnalysis.questions.map((q) =>
              q.id === questionId
                ? { ...q, status: 'answered' as const, answer, selectedOptions, answeredAt: new Date().toISOString() }
                : q,
            ),
          },
        })),

      snoozeGapQuestion: (questionId) =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            questions: state.gapAnalysis.questions.map((q) =>
              q.id === questionId ? { ...q, status: 'snoozed' as const, snoozedAt: new Date().toISOString() } : q,
            ),
          },
        })),

      unsnoozeGapQuestion: (questionId) =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            questions: state.gapAnalysis.questions.map((q) =>
              q.id === questionId ? { ...q, status: 'pending' as const, snoozedAt: undefined } : q,
            ),
          },
        })),

      updateCompletenessScore: (score, label) =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            completenessScore: score,
            readinessLabel: label,
          },
        })),

      setStaticGaps: (gaps) =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            staticGaps: gaps,
          },
        })),

      setGapAnalysisFallback: (staticGaps) =>
        set((state) => ({
          gapAnalysis: {
            ...state.gapAnalysis,
            status: 'ready',
            questions: staticGaps.map((q) => ({ ...q, status: q.status ?? ('pending' as const) })),
            overallAssessment: '',
            staticGaps,
            lastAnalyzedAt: new Date().toISOString(),
            runCount: state.gapAnalysis.runCount + 1,
          },
        })),

      // AI Summary actions
      setAISummaryLoading: () =>
        set((state) => ({
          aiSummary: {
            ...state.aiSummary,
            status: 'loading',
            errorMessage: undefined,
          },
        })),

      setAISummaryResult: (sections) =>
        set((state) => ({
          aiSummary: {
            ...state.aiSummary,
            status: 'ready',
            sections,
            errorMessage: undefined,
          },
        })),

      setAISummaryError: (message) =>
        set((state) => ({
          aiSummary: {
            ...state.aiSummary,
            status: 'error',
            errorMessage: message,
          },
        })),

      editSummarySection: (sectionKey, content) =>
        set((state) => ({
          aiSummary: {
            ...state.aiSummary,
            manualEdits: {
              ...state.aiSummary.manualEdits,
              [sectionKey]: content,
            },
          },
        })),

      clearManualEdit: (sectionKey) =>
        set((state) => {
          const { [sectionKey]: _, ...rest } = state.aiSummary.manualEdits;
          return {
            aiSummary: {
              ...state.aiSummary,
              manualEdits: rest,
            },
          };
        }),

      // User Summary actions (Spec 02)
      setUserSummaryLoading: () =>
        set((state) => ({
          userSummary: {
            ...state.userSummary,
            status: 'loading',
            errorMessage: undefined,
          },
        })),

      setUserSummaryResult: (sections) =>
        set((state) => ({
          userSummary: {
            ...state.userSummary,
            status: 'ready',
            sections,
            errorMessage: undefined,
          },
        })),

      setUserSummaryError: (message) =>
        set((state) => ({
          userSummary: {
            ...state.userSummary,
            status: 'error',
            errorMessage: message,
          },
        })),

      editUserSummarySection: (sectionKey, content) =>
        set((state) => ({
          userSummary: {
            ...state.userSummary,
            manualEdits: {
              ...state.userSummary.manualEdits,
              [sectionKey]: content,
            },
          },
          // Dismiss the "did we get this right" prompt on first edit
          userSummaryPromptDismissed: true,
        })),

      clearUserSummaryEdit: (sectionKey) =>
        set((state) => {
          const { [sectionKey]: _, ...rest } = state.userSummary.manualEdits;
          return {
            userSummary: {
              ...state.userSummary,
              manualEdits: rest,
            },
          };
        }),

      setWorkloadDetails: (details) => set({ workloadDetails: details }),

      dismissUserSummaryPrompt: () => set({ userSummaryPromptDismissed: true }),

      // Reclassification
      applyReclassification: (newLevel) =>
        set((state) => {
          const gatherResult = state.stages.GATHER.result;
          if (!gatherResult) return state;
          return {
            stages: {
              ...state.stages,
              GATHER: {
                ...state.stages.GATHER,
                result: {
                  ...gatherResult,
                  protectionLevel: newLevel,
                },
              },
            },
            gapAnalysis: {
              ...state.gapAnalysis,
              reclassification: undefined,
            },
          };
        }),

      // Session snapshot
      loadSession: (snapshot) =>
        set({
          sessionId: snapshot.sessionId as string,
          stages: snapshot.stages as SessionState['stages'],
          currentStage: snapshot.currentStage as Stage | null,
          currentNodeId: snapshot.currentNodeId as string | null,
          history: snapshot.history as SessionState['history'],
          stageAnswers: snapshot.stageAnswers as SessionState['stageAnswers'],
          projectIdea: snapshot.projectIdea as ProjectIdea | null,
          gatherDetails: snapshot.gatherDetails as GatherDetails | null,
          refineDetails: snapshot.refineDetails as RefineDetails | null,
          presentDetails: snapshot.presentDetails as PresentDetails | null,
          gapAnalysis: (snapshot.gapAnalysis as GapAnalysisState) ?? { ...defaultGapAnalysis },
          aiSummary: (snapshot.aiSummary as AISummaryState) ?? { ...defaultAISummary },
          conversationalAnswers: (snapshot.conversationalAnswers as ConversationalAnswers) ?? { ...defaultConversationalAnswers },
          userSummary: (snapshot.userSummary as UserSummaryState) ?? { ...defaultUserSummary },
          workloadDetails: (snapshot.workloadDetails as WorkloadDetails | null) ?? null,
          userSummaryPromptDismissed: (snapshot.userSummaryPromptDismissed as boolean) ?? false,
        }),

      getSessionSnapshot: () => {
        const state = get();
        return {
          sessionId: state.sessionId,
          stages: state.stages,
          currentStage: state.currentStage,
          currentNodeId: state.currentNodeId,
          history: state.history,
          stageAnswers: state.stageAnswers,
          projectIdea: state.projectIdea,
          gatherDetails: state.gatherDetails,
          refineDetails: state.refineDetails,
          presentDetails: state.presentDetails,
          gapAnalysis: state.gapAnalysis,
          aiSummary: state.aiSummary,
          conversationalAnswers: state.conversationalAnswers,
          userSummary: state.userSummary,
          workloadDetails: state.workloadDetails,
          userSummaryPromptDismissed: state.userSummaryPromptDismissed,
        };
      },
    }),
    {
      name: 'ucsd-agentbuilder-session',
      version: 7,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version < 2) {
          return {
            ...state,
            projectIdea: null,
            gatherDetails: null,
            refineDetails: null,
            presentDetails: null,
          };
        }
        if (version < 3) {
          // Migrate dataType from string to string[]
          const gatherDetails = state.gatherDetails as Record<string, unknown> | null;
          if (gatherDetails && typeof gatherDetails.dataType === 'string') {
            return {
              ...state,
              gatherDetails: {
                ...gatherDetails,
                dataType: gatherDetails.dataType ? [gatherDetails.dataType as string] : [],
              },
            };
          }
        }
        if (version < 4) {
          // Add new ProjectIdea fields and GatherDetails.regulatoryContext
          const projectIdea = state.projectIdea as Record<string, unknown> | null;
          const gatherDetails = state.gatherDetails as Record<string, unknown> | null;
          return {
            ...state,
            projectIdea: projectIdea
              ? {
                  ...projectIdea,
                  currentProcess: projectIdea.currentProcess ?? '',
                }
              : null,
            gatherDetails: gatherDetails
              ? {
                  ...gatherDetails,
                  regulatoryContext: gatherDetails.regulatoryContext ?? [],
                }
              : null,
          };
        }
        if (version < 5) {
          return {
            ...state,
            gapAnalysis: {
              status: 'idle',
              questions: [],
              overallAssessment: '',
              runCount: 0,
              completenessScore: 0,
              readinessLabel: 'needs_work',
              lastAnalyzedAt: null,
              staticGaps: [],
            },
            aiSummary: {
              status: 'idle',
              sections: null,
              manualEdits: {},
            },
          };
        }
        if (version < 6) {
          return {
            ...state,
            conversationalAnswers: { ...defaultConversationalAnswers },
          };
        }
        if (version < 7) {
          // Add user summary state + gap analysis new fields
          const gapAnalysis = state.gapAnalysis as Record<string, unknown> | undefined;
          return {
            ...state,
            gapAnalysis: {
              ...(gapAnalysis ?? {}),
              completenessScore: (gapAnalysis?.completenessScore as number) ?? 0,
              readinessLabel: (gapAnalysis?.readinessLabel as string) ?? 'needs_work',
              lastAnalyzedAt: (gapAnalysis?.lastAnalyzedAt as string | null) ?? null,
              staticGaps: (gapAnalysis?.staticGaps as unknown[]) ?? [],
            },
            userSummary: { ...defaultUserSummary },
            workloadDetails: null,
            userSummaryPromptDismissed: false,
          };
        }
        return state;
      },
    },
  ),
);

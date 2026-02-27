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
} from '@/types/decision-tree';
import { generateId } from '@/lib/utils';

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
    }),
    {
      name: 'ucsd-agentbuilder-session',
      version: 3,
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
        return state;
      },
    },
  ),
);

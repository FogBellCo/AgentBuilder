import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';
import { WizardMode } from '@/components/wizard/WizardMode';
import { OutputPicker } from '@/components/present/OutputPicker';
import { FeasibilityCheck } from '@/components/present/FeasibilityCheck';
import { MultiFeasibilityCheck } from '@/components/present/MultiFeasibilityCheck';
import { ClassificationResult } from '@/components/wizard/ClassificationResult';
import { GatherDetailForm } from '@/components/gather/GatherDetailForm';
import { RefineDetailForm } from '@/components/refine/RefineDetailForm';
import { checkFeasibility } from '@/lib/tree-engine';
import type {
  Stage as StageType,
  OutputFormatInfo,
  OutputFormat,
  OutputSelection,
} from '@/types/decision-tree';

// Guidance content imports
import p1Content from '@/data/guidance/p1-public.md?raw';
import p2Content from '@/data/guidance/p2-sso-setup.md?raw';
import p3Content from '@/data/guidance/p3-api-key.md?raw';
import p4Content from '@/data/guidance/p4-restricted.md?raw';
import { GuidancePage } from '@/components/guidance/GuidancePage';

const guidanceContent: Record<string, string> = {
  P1: p1Content,
  P2: p2Content,
  P3: p3Content,
  P4: p4Content,
};

export function Stage() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const {
    stages,
    setCurrentStage,
    completeStage,
    getEffectiveProtectionLevel,
    gatherDetails,
    refineDetails,
    stageAnswers,
    setPresentDetails,
  } = useSessionStore();

  const stage = (stageId?.toUpperCase() ?? 'GATHER') as StageType;

  const [showGuidance, setShowGuidance] = useState<string | null>(null);
  const [presentStep, setPresentStep] = useState<'pick' | 'feasibility'>('pick');
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat | null>(null);
  const [selectedOutputs, setSelectedOutputs] = useState<
    Array<{ format: OutputFormat; description: string }>
  >([]);

  const protectionLevel = getEffectiveProtectionLevel();

  const handleSelectFormat = (format: OutputFormatInfo) => {
    setSelectedFormat(format.format);
    setPresentStep('feasibility');
  };

  const handleConfirmPresent = () => {
    if (selectedFormat) {
      completeStage('PRESENT', protectionLevel, selectedFormat);
      navigate('/summary');
    }
  };

  const handleMultiSelectConfirm = (
    outputs: Array<{ format: OutputFormat; description: string }>,
  ) => {
    setSelectedOutputs(outputs);
    setPresentStep('feasibility');
  };

  const handleMultiFeasibilityConfirm = () => {
    if (selectedOutputs.length === 0) return;

    const outputSelections: OutputSelection[] = selectedOutputs.map((o) => ({
      format: o.format,
      description: o.description,
      feasibility: checkFeasibility(o.format, protectionLevel),
    }));

    setPresentDetails({ outputs: outputSelections });

    // Complete stage with the first format as the primary
    completeStage('PRESENT', protectionLevel, selectedOutputs[0].format);
    navigate('/summary');
  };

  // Initialize stage if needed
  if (!stages[stage] || stages[stage].status === 'not_started') {
    setCurrentStage(stage);
  }

  // If stage is already complete, check if detail forms are needed
  if (stages[stage].status === 'complete' && stages[stage].result) {
    const result = stages[stage].result!;

    // GATHER complete but no details yet → show detail form
    if (stage === 'GATHER' && !gatherDetails) {
      return (
        <div className="mx-auto max-w-5xl px-6">
          <GatherDetailForm protectionLevel={result.protectionLevel} />
        </div>
      );
    }

    // REFINE complete but no details yet → show detail form
    if (stage === 'REFINE' && !refineDetails) {
      const answers = stageAnswers.REFINE;
      return (
        <div className="mx-auto max-w-5xl px-6">
          <RefineDetailForm
            initialTask={answers['refine-task']}
            initialDataPrep={answers['refine-transform']}
          />
        </div>
      );
    }

    if (showGuidance) {
      return (
        <div className="mx-auto max-w-5xl px-6">
          <GuidancePage
            content={guidanceContent[showGuidance] ?? ''}
            onBack={() => setShowGuidance(null)}
          />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <ClassificationResult
          protectionLevel={result.protectionLevel}
          onContinue={() => navigate('/pipeline')}
          onGoBack={() => navigate('/pipeline')}
          onViewGuidance={() => setShowGuidance(result.protectionLevel)}
        />
      </div>
    );
  }

  // Show guidance page if user requested it
  if (showGuidance) {
    return (
      <div className="mx-auto max-w-5xl px-6">
        <GuidancePage
          content={guidanceContent[showGuidance] ?? ''}
          onBack={() => setShowGuidance(null)}
        />
      </div>
    );
  }

  // PRESENT stage: multi-select flow with output picker + feasibility
  if (stage === 'PRESENT') {
    if (presentStep === 'feasibility' && selectedOutputs.length > 0) {
      return (
        <div className="mx-auto max-w-5xl px-6 py-8">
          <MultiFeasibilityCheck
            outputs={selectedOutputs}
            protectionLevel={protectionLevel}
            onConfirm={handleMultiFeasibilityConfirm}
            onChangeFormats={() => setPresentStep('pick')}
          />
        </div>
      );
    }

    if (presentStep === 'feasibility' && selectedFormat) {
      return (
        <div className="mx-auto max-w-5xl px-6 py-8">
          <FeasibilityCheck
            outputFormat={selectedFormat}
            protectionLevel={protectionLevel}
            onContinue={handleConfirmPresent}
            onChangeFormat={() => setPresentStep('pick')}
          />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <OutputPicker
          onSelect={handleSelectFormat}
          onMultiSelect={handleMultiSelectConfirm}
        />
      </div>
    );
  }

  // Default: wizard mode for GATHER and REFINE
  return (
    <div className="mx-auto max-w-5xl px-6">
      <WizardMode stage={stage} />
    </div>
  );
}

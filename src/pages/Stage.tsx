import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';
import { WizardMode } from '@/components/wizard/WizardMode';
import { OutputPicker } from '@/components/present/OutputPicker';
import { FeasibilityCheck } from '@/components/present/FeasibilityCheck';
import { MultiFeasibilityCheck } from '@/components/present/MultiFeasibilityCheck';
import { ClassificationResult } from '@/components/wizard/ClassificationResult';
import { GatherDetailForm } from '@/components/gather/GatherDetailForm';
import { RefineDetailForm } from '@/components/refine/RefineDetailForm';
import { StageCompletionCelebration } from '@/components/wizard/StageCompletionCelebration';
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
    setCurrentNode,
    recordAnswer,
    getEffectiveProtectionLevel,
    gatherDetails,
    refineDetails,
    stageAnswers,
    setPresentDetails,
  } = useSessionStore();

  const stage = (stageId?.toUpperCase() ?? 'GATHER') as StageType;

  const [showGuidance, setShowGuidance] = useState<string | null>(null);
  const [presentStep, setPresentStep] = useState<'pick' | 'feasibility' | 'wizard'>('pick');
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat | null>(null);
  const [selectedOutputs, setSelectedOutputs] = useState<
    Array<{ format: OutputFormat; description: string }>
  >([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [wasInWizard, setWasInWizard] = useState(false);

  const protectionLevel = getEffectiveProtectionLevel();

  // Track when we are in wizard mode to detect completion
  const isInWizard = stages[stage]?.status === 'in_progress' && stage !== 'PRESENT';
  useEffect(() => {
    if (isInWizard) {
      setWasInWizard(true);
    }
  }, [isInWizard]);

  // Detect stage completion after being in wizard
  useEffect(() => {
    if (wasInWizard && stages[stage]?.status === 'complete') {
      setShowCelebration(true);
      setWasInWizard(false);
    }
  }, [wasInWizard, stages, stage]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const handleSelectFormat = (format: OutputFormatInfo) => {
    setSelectedFormat(format.format);
    setPresentStep('feasibility');
  };

  const handleConfirmPresent = () => {
    if (selectedFormat) {
      // Record the format selection answer before entering wizard
      recordAnswer('PRESENT', 'present-format', `pick-${selectedFormat === 'static_report' ? 'report' : selectedFormat === 'interactive_app' ? 'app' : selectedFormat === 'email_digest' ? 'email' : selectedFormat === 'slide_deck' ? 'slides' : selectedFormat === 'smart_alerts' ? 'alerts' : selectedFormat === 'knowledge_base' ? 'kb' : selectedFormat === 'api_feed' ? 'api' : selectedFormat === 'workflow_automation' ? 'automation' : selectedFormat === 'system_integration' ? 'integration' : selectedFormat === 'embedded_widget' ? 'widget' : selectedFormat}`);
      // Save present details now so they're available for derived calculations
      const outputSelections: OutputSelection[] = [{
        format: selectedFormat,
        description: '',
        feasibility: checkFeasibility(selectedFormat, protectionLevel),
      }];
      setPresentDetails({ outputs: outputSelections });
      // Enter wizard mode for the new present questions
      setCurrentStage('PRESENT');
      setCurrentNode('present-urgency');
      setPresentStep('wizard');
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

    // Record format selection for derived calculations
    const firstFormat = selectedOutputs[0].format;
    recordAnswer('PRESENT', 'present-format', `pick-${firstFormat === 'static_report' ? 'report' : firstFormat === 'interactive_app' ? 'app' : firstFormat === 'email_digest' ? 'email' : firstFormat === 'slide_deck' ? 'slides' : firstFormat === 'smart_alerts' ? 'alerts' : firstFormat === 'knowledge_base' ? 'kb' : firstFormat === 'api_feed' ? 'api' : firstFormat === 'workflow_automation' ? 'automation' : firstFormat === 'system_integration' ? 'integration' : firstFormat === 'embedded_widget' ? 'widget' : firstFormat}`);

    // Enter wizard mode for the new present questions
    setCurrentStage('PRESENT');
    setCurrentNode('present-urgency');
    setPresentStep('wizard');
  };

  // Initialize stage if needed
  if (!stages[stage] || stages[stage].status === 'not_started') {
    setCurrentStage(stage);
  }

  // If all stages are complete and details filled, redirect to gap-analysis
  const allComplete = stages.GATHER.status === 'complete'
    && stages.REFINE.status === 'complete'
    && stages.PRESENT.status === 'complete';

  useEffect(() => {
    if (allComplete && gatherDetails && refineDetails) {
      navigate('/gap-analysis', { replace: true });
    }
  }, [allComplete, gatherDetails, refineDetails, navigate]);

  // Show celebration overlay after wizard completes
  if (showCelebration) {
    return (
      <div className="wizard-overlay fixed inset-0 top-[57px] z-30 bg-white overflow-y-auto">
        <StageCompletionCelebration
          stage={stage}
          onComplete={handleCelebrationComplete}
        />
      </div>
    );
  }

  // If stage is already complete, check if detail forms are needed
  if (stages[stage].status === 'complete' && stages[stage].result) {
    const result = stages[stage].result!;

    // GATHER complete but no details yet -> show detail form
    if (stage === 'GATHER' && !gatherDetails) {
      return (
        <div className="mx-auto max-w-5xl px-6">
          <GatherDetailForm protectionLevel={result.protectionLevel} />
        </div>
      );
    }

    // REFINE complete but no details yet -> show detail form
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

  // PRESENT stage: multi-select flow with output picker + feasibility + wizard
  if (stage === 'PRESENT') {
    // Wizard mode for new present questions (after feasibility)
    if (presentStep === 'wizard') {
      return <WizardMode stage="PRESENT" />;
    }

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
          onBack={() => navigate('/pipeline')}
        />
      </div>
    );
  }

  // Default: wizard mode for GATHER and REFINE
  return <WizardMode stage={stage} />;
}

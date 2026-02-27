import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/session-store';
import { WizardMode } from '@/components/wizard/WizardMode';
import { OutputPicker } from '@/components/present/OutputPicker';
import { FeasibilityCheck } from '@/components/present/FeasibilityCheck';
import { ClassificationResult } from '@/components/wizard/ClassificationResult';
import type { Stage as StageType, OutputFormatInfo, OutputFormat } from '@/types/decision-tree';

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
  const { stages, setCurrentStage, completeStage, getEffectiveProtectionLevel } = useSessionStore();

  const stage = (stageId?.toUpperCase() ?? 'GATHER') as StageType;

  const [showGuidance, setShowGuidance] = useState<string | null>(null);
  const [presentStep, setPresentStep] = useState<'pick' | 'feasibility'>('pick');
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat | null>(null);

  // Initialize stage if needed
  if (!stages[stage] || stages[stage].status === 'not_started') {
    setCurrentStage(stage);
  }

  // If stage is already complete, show classification result
  if (stages[stage].status === 'complete' && stages[stage].result) {
    const result = stages[stage].result!;

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

  // PRESENT stage: special flow with output picker + feasibility
  if (stage === 'PRESENT') {
    const protectionLevel = getEffectiveProtectionLevel();

    const handleSelectFormat = useCallback(
      (format: OutputFormatInfo) => {
        setSelectedFormat(format.format);
        setPresentStep('feasibility');
      },
      [],
    );

    const handleConfirmPresent = useCallback(() => {
      if (selectedFormat) {
        completeStage('PRESENT', protectionLevel, selectedFormat);
        navigate('/summary');
      }
    }, [selectedFormat, protectionLevel, completeStage, navigate]);

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
        <OutputPicker onSelect={handleSelectFormat} />
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

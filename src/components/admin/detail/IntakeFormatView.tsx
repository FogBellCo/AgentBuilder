/**
 * UCSD intake format display — two-column layout for admin detail view.
 * Left: Process Overview + Context/Challenge/Request + Savings
 * Right: Desirability + Viability + Feasibility + Metadata
 */

interface IntakeFormatViewProps {
  sessionState: Record<string, unknown>;
}

interface OSIData {
  processOverview?: {
    purpose?: string;
    description?: string;
    keyPoints?: string[];
    potentialImpact?: string[];
    questionsAndConsiderations?: string[];
  };
  desirability?: { customerSize?: string; customerNeed?: string };
  viability?: { processVolume?: string; potentialSavingsPerCycle?: string; potentialSavingsPerMonth?: string };
  feasibility?: { alignmentWithExisting?: string; dataAvailability?: string; complexity?: string };
  metadata?: { vcArea?: string; submittedBy?: string; onBehalfOf?: string };
  context?: string;
  challenge?: string;
  request?: string;
  savings?: {
    expectedVolume?: string;
    timePerInstance?: string;
    savingsPercentage?: string;
    timeSavings?: string;
    impactBullets?: string[];
  };
}

function extractOSIData(sessionState: Record<string, unknown>): OSIData {
  const osi = (sessionState.osiSummary ?? {}) as OSIData;
  return osi;
}

function hasAnyScoreData(osi: OSIData, projectIdea?: Record<string, string>): boolean {
  return !!(
    osi.desirability?.customerSize ||
    osi.desirability?.customerNeed ||
    osi.viability?.processVolume ||
    osi.viability?.potentialSavingsPerCycle ||
    osi.viability?.potentialSavingsPerMonth ||
    osi.feasibility?.alignmentWithExisting ||
    osi.feasibility?.dataAvailability ||
    osi.feasibility?.complexity ||
    osi.metadata?.submittedBy ||
    osi.metadata?.onBehalfOf ||
    (osi.metadata?.vcArea && osi.metadata.vcArea !== (projectIdea?.domain || ''))
  );
}

export function IntakeFormatView({ sessionState }: IntakeFormatViewProps) {
  const osi = extractOSIData(sessionState);
  const projectIdea = sessionState.projectIdea as Record<string, string> | undefined;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[65%_35%]">
      {/* Left column */}
      <div className="space-y-6">
        {/* Process Overview */}
        <Section title="Process Overview">
          <Field label="Purpose">
            {osi.processOverview?.purpose || projectIdea?.description || 'Not generated yet'}
          </Field>
          <Field label="Description">
            {osi.processOverview?.description || projectIdea?.currentProcess || 'Not generated yet'}
          </Field>
          {osi.processOverview?.keyPoints?.length ? (
            <BulletList label="Key Points" items={osi.processOverview.keyPoints} />
          ) : null}
          {osi.processOverview?.potentialImpact?.length ? (
            <BulletList label="Potential Impact" items={osi.processOverview.potentialImpact} />
          ) : null}
          {osi.processOverview?.questionsAndConsiderations?.length ? (
            <BulletList label="Questions & Considerations" items={osi.processOverview.questionsAndConsiderations} />
          ) : null}
        </Section>

        {/* Context / Challenge / Request */}
        {(osi.context || osi.challenge || osi.request) && (
          <Section title="Context / Challenge / Request">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ThreeCol label="Context" text={osi.context || 'N/A'} />
              <ThreeCol label="Challenge" text={osi.challenge || 'N/A'} />
              <ThreeCol label="Request" text={osi.request || 'N/A'} />
            </div>
          </Section>
        )}

        {/* Savings */}
        {osi.savings && (
          <Section title="Savings">
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Expected Volume:</span> {osi.savings.expectedVolume || 'N/A'}</p>
              <p><span className="font-medium">Time per Instance:</span> {osi.savings.timePerInstance || 'N/A'}</p>
              <p><span className="font-medium">Potential Time Savings:</span> {osi.savings.savingsPercentage || '~80%'}</p>
              <p><span className="font-medium">Time Savings:</span> {osi.savings.timeSavings || 'N/A'}</p>
            </div>
            {osi.savings.impactBullets?.length ? (
              <BulletList label="Impact" items={osi.savings.impactBullets} />
            ) : null}
          </Section>
        )}

        {/* Fallback if no OSI data */}
        {!osi.processOverview && !osi.context && (
          <Section title="Project Information">
            <Field label="Title">{projectIdea?.title || 'Untitled'}</Field>
            <Field label="Description">{projectIdea?.description || 'No description provided'}</Field>
            <Field label="Domain">{projectIdea?.domain || 'Not specified'}</Field>
            <Field label="Current Process">{projectIdea?.currentProcess || 'Not specified'}</Field>
          </Section>
        )}
      </div>

      {/* Right column */}
      <div className="space-y-4">
        {hasAnyScoreData(osi, projectIdea) ? (
          <>
            <ScoreCard title="Desirability">
              <ScoreRow label="Customer Size" value={osi.desirability?.customerSize || 'N/A'} />
              <ScoreRow label="Customer Need" value={osi.desirability?.customerNeed || 'N/A'} />
            </ScoreCard>

            <ScoreCard title="Viability">
              <ScoreRow label="Process Volume" value={osi.viability?.processVolume || 'N/A'} />
              <ScoreRow label="Savings per Cycle" value={osi.viability?.potentialSavingsPerCycle || 'N/A'} />
              <ScoreRow label="Savings per Month" value={osi.viability?.potentialSavingsPerMonth || 'N/A'} />
            </ScoreCard>

            <ScoreCard title="Feasibility">
              <ScoreRow label="Alignment" value={osi.feasibility?.alignmentWithExisting || 'N/A'} />
              <ScoreRow label="Data Availability" value={osi.feasibility?.dataAvailability || 'N/A'} />
              <ScoreRow label="Complexity" value={osi.feasibility?.complexity || 'N/A'} />
            </ScoreCard>

            <ScoreCard title="Metadata">
              <ScoreRow label="VC Area" value={osi.metadata?.vcArea || projectIdea?.domain || 'N/A'} />
              <ScoreRow label="Submitted by" value={osi.metadata?.submittedBy || 'N/A'} />
              <ScoreRow label="On behalf of" value={osi.metadata?.onBehalfOf || 'N/A'} />
            </ScoreCard>
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-gray-400">Scoring data not yet available</p>
            <p className="mt-1 text-xs text-gray-400">
              OSI scoring will appear once the submission is further along.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-blue/5 px-4 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue">{title}</h3>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm text-gray-800">{children}</div>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <ul className="mt-1 space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-800">
            <span className="text-gray-400">&#8226;</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThreeCol({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded border border-gray-200">
      <div className="bg-blue px-3 py-1.5 text-xs font-bold text-white">{label}</div>
      <div className="p-3 text-sm text-gray-700">{text}</div>
    </div>
  );
}

function ScoreCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy">{title}</h4>
      </div>
      <div className="divide-y divide-gray-100 px-4">{children}</div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

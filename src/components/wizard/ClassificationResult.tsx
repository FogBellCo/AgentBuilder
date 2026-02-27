import { motion } from 'framer-motion';
import { Shield, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProtectionLevel } from '@/types/decision-tree';
import { protectionLevels } from '@/data/protection-levels';

interface ClassificationResultProps {
  protectionLevel: ProtectionLevel;
  onContinue: () => void;
  onGoBack: () => void;
  showGuidanceLink?: boolean;
  onViewGuidance?: () => void;
}

const levelColors: Record<ProtectionLevel, string> = {
  P1: 'border-p1 bg-p1/5',
  P2: 'border-p2 bg-p2/5',
  P3: 'border-p3 bg-p3/5',
  P4: 'border-p4 bg-p4/5',
};

export function ClassificationResult({
  protectionLevel,
  onContinue,
  onGoBack,
  onViewGuidance,
}: ClassificationResultProps) {
  const info = protectionLevels[protectionLevel];
  const isRestricted = protectionLevel === 'P4';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl"
    >
      <div
        className={cn(
          'rounded-lg border-2 p-8 text-center',
          levelColors[protectionLevel],
        )}
      >
        <div className="mb-4 flex justify-center">
          {isRestricted ? (
            <AlertTriangle className="h-12 w-12 text-p4" />
          ) : (
            <Shield className="h-12 w-12" style={{ color: info.color }} />
          )}
        </div>

        <div className="mb-2">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: info.color }}
          >
            {info.level} — {info.label}
          </span>
        </div>

        <h3 className="text-xl font-bold text-navy mb-2">{info.tagline}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{info.description}</p>

        <div className="text-left bg-white/60 rounded-lg p-4 mb-6">
          <p className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
            Requirement
          </p>
          <p className="text-sm text-gray-700">{info.requirement}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isRestricted && (
            <button
              onClick={onContinue}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue px-6 py-3 text-sm font-medium text-white hover:bg-navy transition-colors"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {onViewGuidance && (
            <button
              onClick={onViewGuidance}
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 px-6 py-3 text-sm font-medium text-navy hover:border-blue transition-colors"
            >
              {isRestricted ? 'See Alternatives' : 'Learn More'}
            </button>
          )}

          <button
            onClick={onGoBack}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </motion.div>
  );
}

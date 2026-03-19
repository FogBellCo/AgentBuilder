import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, HelpCircle, Info, SkipForward } from 'lucide-react';
import type { DecisionNode } from '@/types/decision-tree';
import { OptionButton } from './OptionButton';
import { questionHints } from './question-hints';
import { useWizardKeyboard } from '@/hooks/use-wizard-keyboard';

interface QuestionCardProps {
  node: DecisionNode;
  onSelectOption: (optionId: string) => void;
  onSelectMultiple?: (optionIds: string[]) => void;
  onBack?: (() => void) | null;
}

/**
 * Split description at "For example" or "e.g.," boundary to render example
 * text with distinct styling.
 */
function splitDescription(desc: string): { main: string; example: string | null } {
  const markers = ['For example', 'for example', 'e.g.,', 'E.g.,'];
  for (const marker of markers) {
    const idx = desc.indexOf(marker);
    if (idx !== -1) {
      return {
        main: desc.slice(0, idx).trim().replace(/[—–-]+\s*$/, '').trim(),
        example: desc.slice(idx).trim(),
      };
    }
  }
  return { main: desc, example: null };
}

export function QuestionCard({
  node,
  onSelectOption,
  onSelectMultiple,
  onBack,
}: QuestionCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const isResult = node.inputType === 'confirmation';
  const isMulti = node.inputType === 'multi_choice';
  const isFreeText = node.inputType === 'free_text';
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedSingleId, setSelectedSingleId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [freeTextValue, setFreeTextValue] = useState('');
  const firstOptionRef = useRef<HTMLDivElement>(null);

  const hint = questionHints[node.id];

  // Reset state when node changes
  useEffect(() => {
    setSelected(new Set());
    setSelectedSingleId(null);
    setIsTransitioning(false);
    setHintOpen(false);
    setFreeTextValue('');
  }, [node.id]);

  // Focus first option after mount (with delay for animation)
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstButton = firstOptionRef.current?.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [node.id]);

  // Check if description is guidance/hint text
  const isGuidanceDescription =
    node.description && node.description.toLowerCase().includes('you can combine');

  const { main: descMain, example: descExample } = node.description
    ? splitDescription(node.description)
    : { main: '', example: null };

  const handleToggle = useCallback(
    (optionId: string) => {
      if (isTransitioning) return;

      if (!isMulti) {
        // Single select: show selection feedback, then advance after dwell
        setSelectedSingleId(optionId);
        setIsTransitioning(true);

        const dwellTime = isResult ? 200 : 400;
        setTimeout(() => {
          onSelectOption(optionId);
          setSelectedSingleId(null);
          setIsTransitioning(false);
        }, dwellTime);
        return;
      }

      // Multi-select toggle
      const isExclusive = optionId === 'dont-know';
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(optionId)) {
          next.delete(optionId);
        } else {
          if (isExclusive) {
            next.clear();
            next.add(optionId);
          } else {
            next.delete('dont-know');
            next.add(optionId);
          }
        }
        return next;
      });
    },
    [isMulti, isResult, isTransitioning, onSelectOption],
  );

  const handleContinue = useCallback(() => {
    if (isMulti && selected.size > 0 && onSelectMultiple) {
      onSelectMultiple(Array.from(selected));
    }
  }, [isMulti, selected, onSelectMultiple]);

  // Keyboard navigation
  const handleKeySelectOption = useCallback(
    (index: number) => {
      if (index < node.options.length) {
        handleToggle(node.options[index].id);
      }
    },
    [node.options, handleToggle],
  );

  useWizardKeyboard({
    optionCount: node.options.length,
    onSelectOption: handleKeySelectOption,
    onConfirm: (isMulti && selected.size > 0) || isResult ? handleContinue : null,
    onBack: onBack ?? null,
    enabled: !isTransitioning,
  });

  // Separate "dont-know" option for multi-choice visual separation
  const regularOptions = isMulti
    ? node.options.filter((o) => o.id !== 'dont-know')
    : node.options;
  const exclusiveOption = isMulti
    ? node.options.find((o) => o.id === 'dont-know')
    : null;

  return (
    <div className={isResult ? 'text-center' : ''}>
      {/* Question */}
      <h2
        id="wizard-question"
        className="text-2xl md:text-3xl lg:text-4xl font-bold text-navy leading-snug"
      >
        {node.question}
      </h2>

      {/* Description */}
      {node.description && (
        isGuidanceDescription ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border-2 border-blue/20 bg-blue/5 px-4 py-3">
            <Info className="h-4 w-4 text-blue shrink-0 mt-0.5" />
            <p className="text-sm text-blue font-medium leading-relaxed">
              {node.description}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            {descMain && (
              <p
                id="wizard-description"
                className="text-base text-gray-500 leading-relaxed"
              >
                {descMain}
              </p>
            )}
            {descExample && (
              <div className="mt-2 pl-4 border-l-2 border-gray-200">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
                  Example
                </p>
                <p className="text-sm text-gray-500 italic">{descExample}</p>
              </div>
            )}
          </div>
        )
      )}

      {/* "Why we ask this" hint */}
      {hint && (
        <div className="mt-3">
          <button
            onClick={() => setHintOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            aria-expanded={hintOpen}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Why do we ask this?
          </button>
          <AnimatePresence>
            {hintOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.1 : 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 leading-relaxed">
                  {hint}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Spacing before options */}
      <div className="mb-10" />

      {/* Free text input for free_text nodes */}
      {isFreeText ? (
        <div className="flex flex-col gap-4">
          <textarea
            value={freeTextValue}
            onChange={(e) => setFreeTextValue(e.target.value)}
            placeholder={node.placeholder ?? ''}
            maxLength={node.maxLength ?? 1500}
            rows={5}
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors resize-none"
            autoFocus
          />
          <p className="text-xs text-gray-400">
            {freeTextValue.length}/{node.maxLength ?? 1500} characters
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onSelectOption(freeTextValue.trim())}
              disabled={!freeTextValue.trim() && !node.skippable}
              className="group flex items-center gap-3 rounded-lg bg-blue px-8 py-3 text-white font-medium tracking-wide uppercase text-sm hover:bg-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
            >
              Continue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            {node.skippable && (
              <button
                onClick={() => onSelectOption('')}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Options */}
          <div
            ref={firstOptionRef}
            role={isMulti ? 'group' : 'radiogroup'}
            aria-labelledby="wizard-question"
            aria-describedby={node.description ? 'wizard-description' : undefined}
            className={
              isResult
                ? 'flex flex-col sm:flex-row gap-3 justify-center'
                : 'flex flex-col gap-3'
            }
          >
            {regularOptions.map((option, i) => (
              <OptionButton
                key={option.id}
                option={option}
                index={i}
                onSelect={handleToggle}
                isSelected={
                  isMulti
                    ? selected.has(option.id)
                    : selectedSingleId === option.id
                }
                isMultiMode={isMulti}
                isDimmed={
                  !isMulti && selectedSingleId !== null && selectedSingleId !== option.id
                }
                showKeyboardBadge={!isResult}
                isConfirmation={isResult}
              />
            ))}

            {/* Exclusive "I'm not sure" option, visually separated */}
            {exclusiveOption && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <OptionButton
                  option={exclusiveOption}
                  index={regularOptions.length}
                  onSelect={handleToggle}
                  isSelected={selected.has(exclusiveOption.id)}
                  isMultiMode={isMulti}
                  isDimmed={false}
                  showKeyboardBadge
                />
              </div>
            )}
          </div>

          {/* Multi-select Continue button (desktop) */}
          {isMulti && selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex justify-center"
            >
              <button
                onClick={handleContinue}
                className="group flex items-center gap-3 rounded-lg bg-blue px-8 py-3 text-white font-medium tracking-wide uppercase text-sm hover:bg-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Continue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

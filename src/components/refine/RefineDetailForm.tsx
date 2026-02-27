import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { generateId } from '@/lib/utils';
import type { Refinement, RefineDetails } from '@/types/decision-tree';

const taskTypeOptions = [
  { value: 'summarize', label: 'Summarize or extract key points' },
  { value: 'analyze', label: 'Analyze trends and patterns' },
  { value: 'compare', label: 'Compare data sets' },
  { value: 'recommend', label: 'Generate recommendations' },
  { value: 'classify', label: 'Classify or categorize' },
];

const dataPrepOptions = [
  { value: 'as-is', label: 'Use as-is' },
  { value: 'filter', label: 'Filter to a subset' },
  { value: 'combine', label: 'Combine sources' },
  { value: 'deidentify', label: 'De-identify' },
];

interface RefineDetailFormProps {
  initialTask?: string;
  initialDataPrep?: string;
}

export function RefineDetailForm({ initialTask, initialDataPrep }: RefineDetailFormProps) {
  const navigate = useNavigate();
  const { refineDetails, setRefineDetails } = useSessionStore();

  const defaultRefinement: Refinement = {
    id: generateId(),
    taskType: initialTask ?? '',
    description: '',
    dataPrep: initialDataPrep ?? '',
  };

  const [refinements, setRefinements] = useState<Refinement[]>(
    refineDetails?.refinements ?? [defaultRefinement],
  );
  const [additionalContext, setAdditionalContext] = useState(
    refineDetails?.additionalContext ?? '',
  );

  const updateRefinement = (id: string, field: keyof Refinement, value: string) => {
    setRefinements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const addRefinement = () => {
    setRefinements((prev) => [
      ...prev,
      { id: generateId(), taskType: '', description: '', dataPrep: '' },
    ]);
  };

  const removeRefinement = (id: string) => {
    setRefinements((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = () => {
    const details: RefineDetails = {
      refinements,
      additionalContext: additionalContext.trim(),
    };
    setRefineDetails(details);
    navigate('/pipeline');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl py-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy mb-2">
          Detail Your Refinements
        </h2>
        <p className="text-sm text-gray-500">
          Add details for each AI task you want to perform. You can add multiple
          refinement passes if needed.
        </p>
      </div>

      <div className="space-y-6">
        {refinements.map((refinement, index) => (
          <div
            key={refinement.id}
            className="rounded-lg border-2 border-gray-200 bg-white p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                Refinement {index + 1}
              </h3>
              {refinements.length > 1 && (
                <button
                  onClick={() => removeRefinement(refinement.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Task Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  AI Task
                </label>
                <select
                  value={refinement.taskType}
                  onChange={(e) =>
                    updateRefinement(refinement.id, 'taskType', e.target.value)
                  }
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-blue focus:outline-none transition-colors bg-white"
                >
                  <option value="">Select a task</option>
                  {taskTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  What specifically should AI do?
                </label>
                <input
                  type="text"
                  value={refinement.description}
                  onChange={(e) =>
                    updateRefinement(refinement.id, 'description', e.target.value)
                  }
                  placeholder="e.g., Summarize student feedback by theme for each quarter"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors"
                />
              </div>

              {/* Data Prep */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Data Preparation
                </label>
                <div className="flex flex-wrap gap-2">
                  {dataPrepOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        updateRefinement(
                          refinement.id,
                          'dataPrep',
                          refinement.dataPrep === opt.value ? '' : opt.value,
                        )
                      }
                      className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                        refinement.dataPrep === opt.value
                          ? 'border-blue bg-blue/5 text-blue'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Another */}
        <button
          onClick={addRefinement}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-xs font-medium text-gray-500 hover:border-blue hover:text-blue transition-colors uppercase tracking-wider"
        >
          <Plus className="h-3 w-3" />
          Add Another Refinement
        </button>

        {/* Additional Context */}
        <div>
          <label
            htmlFor="refine-context"
            className="block text-xs font-bold text-navy uppercase tracking-wider mb-2"
          >
            Additional Context <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="refine-context"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any other details about how you want the data processed..."
            maxLength={500}
            rows={3}
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSubmit}
          className="group flex items-center gap-3 rounded-lg bg-blue px-8 py-3 text-white font-medium tracking-wide uppercase text-sm hover:bg-navy transition-colors"
        >
          Continue
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}

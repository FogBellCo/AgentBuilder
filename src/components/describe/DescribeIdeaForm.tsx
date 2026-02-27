import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import type { ProjectIdea } from '@/types/decision-tree';

const domainOptions = [
  'Research',
  'Student Services',
  'Finance',
  'IT',
  'Administration',
  'Academic',
  'Other',
];

const timelineOptions = [
  { value: 'exploring', label: 'Just exploring' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'this_month', label: 'This month' },
  { value: 'immediate', label: 'Immediate need' },
];

export function DescribeIdeaForm() {
  const navigate = useNavigate();
  const { projectIdea, setProjectIdea } = useSessionStore();

  const [title, setTitle] = useState(projectIdea?.title ?? '');
  const [description, setDescription] = useState(projectIdea?.description ?? '');
  const [domain, setDomain] = useState(projectIdea?.domain ?? '');
  const [timeline, setTimeline] = useState(projectIdea?.timeline ?? '');

  const canContinue = title.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = () => {
    if (!canContinue) return;

    const idea: ProjectIdea = {
      title: title.trim(),
      description: description.trim(),
      domain,
      timeline,
    };

    setProjectIdea(idea);
    navigate('/pipeline');
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sand text-navy">
            <Lightbulb className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-3">
            Describe Your Idea
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            Tell us what you want to build or accomplish with AI. This helps us
            assess feasibility and guide you through the right steps.
          </p>
        </div>

        <div className="space-y-6">
          {/* Project Title */}
          <div>
            <label
              htmlFor="project-title"
              className="block text-xs font-bold text-navy uppercase tracking-wider mb-2"
            >
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Student feedback analyzer, Research data dashboard"
              maxLength={100}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors"
            />
          </div>

          {/* Idea Description */}
          <div>
            <label
              htmlFor="project-description"
              className="block text-xs font-bold text-navy uppercase tracking-wider mb-2"
            >
              What do you want to build? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="In a few sentences, describe what you want to accomplish with AI. For example: 'I want to analyze student course evaluations to identify common themes and generate quarterly summary reports for department heads.'"
              maxLength={1000}
              rows={4}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Domain / Department */}
          <div>
            <label
              htmlFor="project-domain"
              className="block text-xs font-bold text-navy uppercase tracking-wider mb-2"
            >
              Domain / Department
            </label>
            <select
              id="project-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue focus:outline-none transition-colors bg-white"
            >
              <option value="">Select a domain (optional)</option>
              {domainOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              Timeline
            </label>
            <div className="flex flex-wrap gap-2">
              {timelineOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setTimeline(timeline === opt.value ? '' : opt.value)
                  }
                  className={`rounded-lg border-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    timeline === opt.value
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

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex justify-center"
        >
          <button
            onClick={handleSubmit}
            disabled={!canContinue}
            className="group flex items-center gap-3 rounded-lg bg-blue px-8 py-4 text-white font-medium tracking-wide uppercase text-sm hover:bg-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue to Workflow
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

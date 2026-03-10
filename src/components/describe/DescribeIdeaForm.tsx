import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import type { ProjectIdea } from '@/types/decision-tree';

const domainOptions = [
  'Academic Affairs',
  'Admissions & Enrollment',
  'Alumni & Advancement',
  'Facilities & Planning',
  'Finance & Business Services',
  'Health Sciences',
  'Housing & Hospitality',
  'Human Resources',
  'Information Technology',
  'Legal & Compliance',
  'Research & Innovation',
  'Student Affairs & Services',
  'Supply Chain & Logistics',
  'Other',
];

const timelineOptions = [
  { value: 'exploring', label: 'Just exploring' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'this_month', label: 'This month' },
  { value: 'immediate', label: 'Immediate need' },
];

const projectGoalOptions = [
  { value: 'plan_new', label: 'Plan something new' },
  { value: 'add_to_tritongpt', label: 'Add data or features to TritonGPT' },
  { value: 'support_existing', label: 'Get support for something I\'ve already built' },
];

const existingStatusOptions = [
  { value: 'fresh', label: 'Starting fresh' },
  { value: 'prototype', label: 'I have a prototype or pilot' },
  { value: 'running', label: 'This is already running and I want to improve it' },
];

const projectComplexityOptions = [
  { value: 'simple', label: 'One straightforward task' },
  { value: 'multiple', label: 'A few connected steps' },
  { value: 'unsure', label: 'Not sure yet' },
];

export function DescribeIdeaForm() {
  const navigate = useNavigate();
  const { projectIdea, setProjectIdea } = useSessionStore();

  const [title, setTitle] = useState(projectIdea?.title ?? '');
  const [description, setDescription] = useState(projectIdea?.description ?? '');
  const [domain, setDomain] = useState(projectIdea?.domain ?? '');
  const [timeline, setTimeline] = useState(projectIdea?.timeline ?? '');
  const [projectGoal, setProjectGoal] = useState(projectIdea?.projectGoal ?? '');
  const [existingStatus, setExistingStatus] = useState(projectIdea?.existingStatus ?? '');
  const [currentProcess, setCurrentProcess] = useState(projectIdea?.currentProcess ?? '');
  const [projectComplexity, setProjectComplexity] = useState(projectIdea?.projectComplexity ?? '');
  const [preferredTool, setPreferredTool] = useState(projectIdea?.preferredTool ?? '');

  const canContinue = title.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = () => {
    if (!canContinue) return;

    const idea: ProjectIdea = {
      title: title.trim(),
      description: description.trim(),
      domain,
      timeline,
      projectGoal,
      existingStatus,
      currentProcess: currentProcess.trim(),
      projectComplexity,
      preferredTool: preferredTool.trim(),
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
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sand text-navy">
            <Lightbulb className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-3">
            Describe Your Idea
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            Tell us what you'd like AI to help with. We'll figure out
            what's possible and what you'll need.
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
              maxLength={2000}
              rows={4}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              {description.length}/2000 characters
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

          {/* Project Goal */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              What best describes your goal?
            </label>
            <div className="flex flex-wrap gap-2">
              {projectGoalOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setProjectGoal(projectGoal === opt.value ? '' : opt.value)
                  }
                  className={`rounded-lg border-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    projectGoal === opt.value
                      ? 'border-blue bg-blue/5 text-blue'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Status */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              Have you already started working on this?
            </label>
            <div className="flex flex-wrap gap-2">
              {existingStatusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setExistingStatus(existingStatus === opt.value ? '' : opt.value)
                  }
                  className={`rounded-lg border-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    existingStatus === opt.value
                      ? 'border-blue bg-blue/5 text-blue'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Process */}
          <div>
            <label
              htmlFor="current-process"
              className="block text-xs font-bold text-navy uppercase tracking-wider mb-2"
            >
              How is this done today?
            </label>
            <textarea
              id="current-process"
              value={currentProcess}
              onChange={(e) => setCurrentProcess(e.target.value)}
              placeholder="Briefly describe the current process, if any. For example: 'We manually review 200 contracts per quarter, taking about 2 hours each.'"
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              {currentProcess.length}/500 characters
            </p>
          </div>

          {/* Project Complexity */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              How complex is this project?
            </label>
            <div className="flex flex-wrap gap-2">
              {projectComplexityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setProjectComplexity(projectComplexity === opt.value ? '' : opt.value)
                  }
                  className={`rounded-lg border-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    projectComplexity === opt.value
                      ? 'border-blue bg-blue/5 text-blue'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Tool */}
          <div>
            <label
              htmlFor="preferred-tool"
              className="block text-xs font-bold text-navy uppercase tracking-wider mb-2"
            >
              Any specific tools in mind?
            </label>
            <input
              id="preferred-tool"
              type="text"
              value={preferredTool}
              onChange={(e) => setPreferredTool(e.target.value)}
              placeholder="e.g., TritonGPT, ChatGPT, a specific product..."
              maxLength={100}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors"
            />
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
            Next: Tell Us About Your Data
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

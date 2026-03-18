import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Lightbulb, Calculator } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import type { ProjectIdea } from '@/types/decision-tree';
import { calculateSavings } from '@/lib/intake-calculations';

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

// Q-D2 options
const whyNowOptions = [
  { value: 'volume_up', label: 'Volume is going up' },
  { value: 'losing_staff', label: 'We\'re losing staff or bandwidth' },
  { value: 'new_policy', label: 'New policy or mandate requires it' },
  { value: 'leadership', label: 'Leadership asked us to look into it' },
  { value: 'improve', label: 'Just want to improve how we work' },
];

// Q-W1 options
const frequencyOptions = [
  { value: 'few_monthly', label: 'A few times a month' },
  { value: 'few_weekly', label: 'A few times a week' },
  { value: 'daily', label: 'Daily' },
  { value: 'multiple_daily', label: 'Multiple times a day' },
];

// Q-W2 options
const durationOptions = [
  { value: 'few_minutes', label: 'A few minutes' },
  { value: 'half_hour', label: 'About half an hour' },
  { value: 'couple_hours', label: 'A couple hours' },
  { value: 'half_day', label: 'Half a day or more' },
];

// Q-W3 options
const peopleOptions = [
  { value: 'just_me', label: 'Just me' },
  { value: 'two_three', label: '2-3 people' },
  { value: 'small_team', label: 'A small team (4-10)' },
  { value: 'large_group', label: 'A large group (10+)' },
];

// Q-C1 options
const currentToolOptions = [
  { value: 'canvas', label: 'Canvas' },
  { value: 'servicenow', label: 'ServiceNow' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'concur', label: 'Concur' },
  { value: 'box', label: 'Box' },
  { value: 'excel', label: 'Excel / Google Sheets' },
  { value: 'email', label: 'Email' },
  { value: 'paper', label: 'Paper forms' },
  { value: 'other', label: 'Other' },
];

export function DescribeIdeaForm() {
  const navigate = useNavigate();
  const { projectIdea, setProjectIdea, conversationalAnswers, setConversationalAnswers } = useSessionStore();

  // Existing fields
  const [title, setTitle] = useState(projectIdea?.title ?? '');
  const [description, setDescription] = useState(projectIdea?.description ?? '');
  const [domain, setDomain] = useState(projectIdea?.domain ?? '');
  const [currentProcess, setCurrentProcess] = useState(projectIdea?.currentProcess ?? '');

  // Q-D1, Q-D2, Q-D3
  const [teamWho, setTeamWho] = useState(conversationalAnswers.teamWho);
  const [whyNow, setWhyNow] = useState<string[]>(conversationalAnswers.whyNow);
  const [consequences, setConsequences] = useState(conversationalAnswers.consequences);

  // Q-W1 through Q-W4
  const [workloadFrequency, setWorkloadFrequency] = useState(conversationalAnswers.workloadFrequency);
  const [workloadDuration, setWorkloadDuration] = useState(conversationalAnswers.workloadDuration);
  const [workloadPeople, setWorkloadPeople] = useState(conversationalAnswers.workloadPeople);
  const [workloadPainPoint, setWorkloadPainPoint] = useState(conversationalAnswers.workloadPainPoint);

  // Q-C1 through Q-C3
  const [currentTools, setCurrentTools] = useState<string[]>(conversationalAnswers.currentTools);
  const [currentToolsOther, setCurrentToolsOther] = useState(conversationalAnswers.currentToolsOther);
  const [magicWand, setMagicWand] = useState(conversationalAnswers.magicWand);

  const canContinue = title.trim().length > 0 && description.trim().length > 0;

  // Savings calculation
  const hasSavingsData = workloadFrequency && workloadDuration && workloadPeople;
  const savings = hasSavingsData
    ? calculateSavings(workloadFrequency, workloadDuration, workloadPeople)
    : null;
  const showSavingsCallout = savings && savings.monthlyHoursTotal > 0;

  // Helpers for multi-select
  const toggleWhyNow = (value: string) => {
    setWhyNow((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const toggleCurrentTool = (value: string) => {
    setCurrentTools((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleSubmit = () => {
    if (!canContinue) return;

    const idea: ProjectIdea = {
      title: title.trim(),
      description: description.trim(),
      domain,
      currentProcess: currentProcess.trim(),
    };

    setProjectIdea(idea);

    // Save all conversational answers
    setConversationalAnswers({
      teamWho: teamWho.trim(),
      whyNow,
      consequences: consequences.trim(),
      workloadFrequency,
      workloadDuration,
      workloadPeople,
      workloadPainPoint: workloadPainPoint.trim(),
      currentTools,
      currentToolsOther: currentToolsOther.trim(),
      magicWand: magicWand.trim(),
    });

    navigate('/pipeline');
  };

  // Reusable classes
  const labelClass = 'block text-xs font-bold text-navy uppercase tracking-wider mb-2';
  const inputClass = 'w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors';
  const textareaClass = `${inputClass} resize-none`;
  const hintClass = 'mt-1 text-xs text-gray-400';
  const chipClass = (active: boolean) =>
    `rounded-lg border-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
      active
        ? 'border-blue bg-blue/5 text-blue'
        : 'border-gray-200 text-gray-500 hover:border-gray-300'
    }`;

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
            <label htmlFor="project-title" className={labelClass}>
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Course evaluation summaries, Travel reimbursement sorting"
              maxLength={100}
              className={inputClass}
            />
          </div>

          {/* Idea Description */}
          <div>
            <label htmlFor="project-description" className={labelClass}>
              What do you want to build? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="In a few sentences, describe what you want to accomplish with AI. For example: 'I want to analyze student course evaluations to identify common themes and generate quarterly summary reports for department heads.'"
              maxLength={2000}
              rows={4}
              className={textareaClass}
            />
            <p className={hintClass}>{description.length}/2000 characters</p>
          </div>

          {/* Domain / Department */}
          <div>
            <label htmlFor="project-domain" className={labelClass}>
              Domain / Department
            </label>
            <select
              id="project-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className={`${inputClass} bg-white`}
            >
              <option value="">Select a domain (optional)</option>
              {domainOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Current Process */}
          <div>
            <label htmlFor="current-process" className={labelClass}>
              How is this done today?
            </label>
            <textarea
              id="current-process"
              value={currentProcess}
              onChange={(e) => setCurrentProcess(e.target.value)}
              placeholder="Briefly describe the current process, if any. For example: 'We manually review 200 contracts per quarter, taking about 2 hours each.'"
              maxLength={500}
              rows={3}
              className={textareaClass}
            />
            <p className={hintClass}>{currentProcess.length}/500 characters</p>
          </div>

          {/* ============================================ */}
          {/* Q-D1: Who on your team does this work today? */}
          {/* ============================================ */}
          <div>
            <label htmlFor="team-who" className={labelClass}>
              Who on your team does this work today?
            </label>
            <input
              id="team-who"
              type="text"
              value={teamWho}
              onChange={(e) => setTeamWho(e.target.value)}
              placeholder="e.g., 2 analysts in our office, or the entire advising team"
              maxLength={300}
              className={inputClass}
            />
            <p className={hintClass}>This helps us understand the scope and who would benefit.</p>
          </div>

          {/* ============================================ */}
          {/* Q-D2: Why is now the right time to explore this? */}
          {/* ============================================ */}
          <div>
            <label className={labelClass}>Why is now the right time to explore this?</label>
            <p className="text-xs text-gray-400 mb-2">Select all that apply. Understanding your timing helps us prioritize and plan.</p>
            <div className="flex flex-wrap gap-2">
              {whyNowOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleWhyNow(opt.value)}
                  className={chipClass(whyNow.includes(opt.value))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ============================================ */}
          {/* Q-D3: If this doesn't get built, what happens? */}
          {/* ============================================ */}
          <div>
            <label htmlFor="consequences" className={labelClass}>
              If this doesn't get built, what happens?
            </label>
            <textarea
              id="consequences"
              value={consequences}
              onChange={(e) => setConsequences(e.target.value)}
              placeholder="e.g., Reports keep being late, or we just keep doing it by hand"
              maxLength={500}
              rows={3}
              className={textareaClass}
            />
            <p className={hintClass}>This helps us understand the urgency and make a stronger case for your request.</p>
          </div>

          {/* ============================================ */}
          {/* Workload Section */}
          {/* ============================================ */}
          <div className="mt-10 pt-8 border-t-2 border-gray-100">
            <h2 className="text-lg font-bold text-navy mb-1">Help us understand the workload</h2>
            <p className="text-sm text-gray-500 mb-6">Just rough estimates -- we'll do the math.</p>

            <div className="space-y-6">
              {/* Q-W1: Frequency */}
              <div>
                <label className={labelClass}>Roughly how often do you do this task?</label>
                <p className={hintClass + ' mb-2'}>This helps us estimate how much time AI could save.</p>
                <div className="flex flex-wrap gap-2">
                  {frequencyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setWorkloadFrequency(workloadFrequency === opt.value ? '' : opt.value)}
                      className={chipClass(workloadFrequency === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q-W2: Duration */}
              <div>
                <label className={labelClass}>How long does it take each time?</label>
                <p className={hintClass + ' mb-2'}>Even rough guesses help -- we're looking for the ballpark.</p>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setWorkloadDuration(workloadDuration === opt.value ? '' : opt.value)}
                      className={chipClass(workloadDuration === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q-W3: People */}
              <div>
                <label className={labelClass}>How many people spend time on this?</label>
                <p className={hintClass + ' mb-2'}>This helps us understand how widely the time savings would spread.</p>
                <div className="flex flex-wrap gap-2">
                  {peopleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setWorkloadPeople(workloadPeople === opt.value ? '' : opt.value)}
                      className={chipClass(workloadPeople === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Savings Callout */}
              {showSavingsCallout && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border-2 border-blue/20 bg-blue/5 p-4 flex items-start gap-3"
                >
                  <Calculator className="h-5 w-5 text-blue shrink-0 mt-0.5" />
                  <p className="text-sm text-navy leading-relaxed">
                    It sounds like your team spends about{' '}
                    <span className="font-bold">{savings!.monthlyHoursTotal} hours/month</span>{' '}
                    on this. AI could help get a lot of that time back.
                  </p>
                </motion.div>
              )}

              {/* Q-W4: Pain point */}
              <div>
                <label htmlFor="pain-point" className={labelClass}>
                  What's the most annoying part?
                </label>
                <textarea
                  id="pain-point"
                  value={workloadPainPoint}
                  onChange={(e) => setWorkloadPainPoint(e.target.value)}
                  placeholder="e.g., We have to copy-paste between two systems, or it takes 3 people to review one form"
                  maxLength={500}
                  rows={3}
                  className={textareaClass}
                />
                <p className={hintClass}>The specific pain points help us figure out what AI should focus on.</p>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* Context Section */}
          {/* ============================================ */}
          <div className="mt-10 pt-8 border-t-2 border-gray-100">
            <h2 className="text-lg font-bold text-navy mb-1">A little more context</h2>
            <p className="text-sm text-gray-500 mb-6">Almost done -- just a few more so we can tell your story.</p>

            <div className="space-y-6">
              {/* Q-C1: Current tools */}
              <div>
                <label className={labelClass}>What tools or systems do you use for this right now?</label>
                <p className={hintClass + ' mb-2'}>Knowing your current tools helps us plan the integration.</p>
                <div className="flex flex-wrap gap-2">
                  {currentToolOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleCurrentTool(opt.value)}
                      className={chipClass(currentTools.includes(opt.value))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {currentTools.includes('other') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={currentToolsOther}
                      onChange={(e) => setCurrentToolsOther(e.target.value)}
                      placeholder="What else?"
                      maxLength={100}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* Q-C2: Magic wand */}
              <div>
                <label htmlFor="magic-wand" className={labelClass}>
                  If you could wave a magic wand, what would the AI do?
                </label>
                <textarea
                  id="magic-wand"
                  value={magicWand}
                  onChange={(e) => setMagicWand(e.target.value)}
                  placeholder="Dream big -- there's no wrong answer here"
                  maxLength={1000}
                  rows={4}
                  className={textareaClass}
                />
                <p className={hintClass}>This helps us understand your ideal outcome, even if we start smaller.</p>
              </div>

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
            Next: Tell Us About Your Data
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

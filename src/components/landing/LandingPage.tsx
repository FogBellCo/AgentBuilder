import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lightbulb, Search, Sliders, Monitor } from 'lucide-react';

const steps = [
  {
    icon: Lightbulb,
    label: 'Describe',
    desc: 'Tell us what you want to build or accomplish with AI',
  },
  {
    icon: Search,
    label: 'Gather',
    desc: 'Identify where your data lives and what access level it requires',
  },
  {
    icon: Sliders,
    label: 'Refine',
    desc: 'Define what AI should do with your data and who will see the results',
  },
  {
    icon: Monitor,
    label: 'Present',
    desc: 'Choose how you want to see and share the AI-powered output',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl text-center"
      >
        <h1 className="text-4xl font-bold text-navy leading-tight mb-4">
          AI Workflow Builder
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-4">
          Describe what you want to build with UCSD AI tools, and we'll help you
          assess the feasibility and complexity of your idea — step by step.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-12">
          No technical expertise required. You'll get a summary you can share
          and a structured intake file for the AI team.
        </p>
      </motion.div>

      {/* Four step preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12 flex flex-col md:flex-row items-center gap-4 md:gap-0"
      >
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center text-center w-40">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-navy mb-3">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-1">
                {step.label}
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed px-1">
                {step.desc}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block mx-2">
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        onClick={() => navigate('/describe')}
        className="group flex items-center gap-3 rounded-lg bg-blue px-8 py-4 text-white font-medium tracking-wide uppercase text-sm hover:bg-navy transition-colors"
      >
        Get Started
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-8 text-xs text-gray-400 max-w-md text-center"
      >
        This is a guidance tool only. It does not access, store, or process your actual data.
        All recommendations follow UC data classification policy.
      </motion.p>
    </div>
  );
}

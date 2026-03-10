import { Lightbulb } from 'lucide-react';
import type { ProjectIdea } from '@/types/decision-tree';

const timelineLabels: Record<string, string> = {
  exploring: 'Just exploring',
  this_quarter: 'This quarter',
  this_month: 'This month',
  immediate: 'Immediate need',
};

interface ProjectIdeaSummaryProps {
  idea: ProjectIdea;
}

export function ProjectIdeaSummary({ idea }: ProjectIdeaSummaryProps) {
  return (
    <div className="rounded-lg border-2 border-blue/20 bg-blue/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-white">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
            Your Idea
          </h3>
          <p className="text-xs text-gray-500">Here's what you're building</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-base font-bold text-navy">{idea.title}</h4>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            {idea.description}
          </p>
        </div>

        {idea.projectGoal && (
          <div className="text-xs">
            <span className="font-medium text-navy">Goal:</span>{' '}
            <span className="text-gray-600">{idea.projectGoal}</span>
          </div>
        )}
        {idea.existingStatus && (
          <div className="text-xs">
            <span className="font-medium text-navy">Current Status:</span>{' '}
            <span className="text-gray-600">{idea.existingStatus}</span>
          </div>
        )}
        {idea.currentProcess && (
          <div className="text-xs">
            <span className="font-medium text-navy">How It's Done Today:</span>{' '}
            <span className="text-gray-600">{idea.currentProcess}</span>
          </div>
        )}
        {idea.projectComplexity && (
          <div className="text-xs">
            <span className="font-medium text-navy">Complexity:</span>{' '}
            <span className="text-gray-600">{idea.projectComplexity}</span>
          </div>
        )}
        {idea.preferredTool && (
          <div className="text-xs">
            <span className="font-medium text-navy">Preferred Tool:</span>{' '}
            <span className="text-gray-600">{idea.preferredTool}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {idea.domain && (
            <span className="inline-block rounded-full bg-sand px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-navy">
              {idea.domain}
            </span>
          )}
          {idea.timeline && (
            <span className="inline-block rounded-full bg-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue">
              {timelineLabels[idea.timeline] ?? idea.timeline}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

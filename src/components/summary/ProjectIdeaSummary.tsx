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
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="h-5 w-5 text-blue" />
        <div>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
            Project Idea
          </h3>
          <p className="text-xs text-gray-500">Your project description</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-base font-bold text-navy">{idea.title}</h4>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            {idea.description}
          </p>
        </div>

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

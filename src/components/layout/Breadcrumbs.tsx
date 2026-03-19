import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

export function Breadcrumbs() {
  const crumbs = useBreadcrumbs();
  const navigate = useNavigate();

  if (crumbs.length <= 1) return null;

  return (
    <nav data-breadcrumbs aria-label="Breadcrumb" className="border-b border-gray-100 bg-gray-50">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-6 py-2">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
            {crumb.path ? (
              <button
                onClick={() => navigate(crumb.path!)}
                className="text-xs text-blue hover:underline uppercase tracking-wider"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-xs text-gray-600 uppercase tracking-wider">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}

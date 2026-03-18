import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useSubmissions } from '@/hooks/use-submissions';
import { useSessionStore } from '@/store/session-store';
import { loadSubmission } from '@/lib/submission-loader';
import { SubmissionCard } from '@/components/landing/SubmissionCard';

export function SubmissionsList() {
  const { isAuthenticated } = useAuth();
  const { submissions, isLoading } = useSubmissions(isAuthenticated);
  const navigate = useNavigate();

  const handleSelect = async (id: string) => {
    try {
      const { status } = await loadSubmission(id);

      if (status === 'submitted' || status === 'in_review' || status === 'approved' || status === 'complete') {
        navigate('/summary');
      } else {
        const state = useSessionStore.getState();
        const stages = state.stages;
        if (stages?.PRESENT?.status === 'complete') {
          navigate('/summary');
        } else if (stages?.REFINE?.status === 'complete') {
          navigate('/stage/PRESENT');
        } else if (stages?.GATHER?.status === 'complete') {
          navigate('/stage/REFINE');
        } else if (state.projectIdea) {
          navigate('/pipeline');
        } else {
          navigate('/describe');
        }
      }
    } catch (err) {
      console.error('[SubmissionsList] Failed to load submission:', err);
    }
  };

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-6">
        <div className="mb-4 h-5 w-36 rounded bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border-2 border-gray-200 bg-white p-5 h-24 animate-pulse" />
          <div className="rounded-lg border-2 border-gray-200 bg-white p-5 h-24 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto mt-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
          My Submissions
        </h2>
        {submissions.length > 0 && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
            {submissions.length}
          </span>
        )}
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-gray-400">
          No submissions yet — start your first one above!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.map((sub, i) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              onSelect={handleSelect}
              index={i}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

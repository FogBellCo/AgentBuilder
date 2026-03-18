import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';

export function EmailPrompt() {
  const { user, isAuthenticated, sendMagicLink, logout, magicLinkSent, clearMagicLinkSent, error } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.includes('@')) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setIsSending(true);
    try {
      await sendMagicLink(inputValue.trim());
    } catch {
      // Error is set in auth state
    } finally {
      setIsSending(false);
    }
  };

  if (magicLinkSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg mx-auto rounded-lg border-2 border-blue/30 bg-blue/5 p-5"
      >
        <p className="text-sm font-medium text-navy mb-2">Check your email</p>
        <p className="text-sm text-gray-600">
          We sent a sign-in link to <span className="font-medium">{inputValue || 'your email'}</span>.
          Click the link in the email to continue.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          The link expires in 15 minutes.
        </p>
        <button
          onClick={() => {
            clearMagicLinkSent();
            setInputValue('');
          }}
          className="mt-3 text-xs text-blue underline hover:text-navy transition-colors"
        >
          Use a different email
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto rounded-lg border-2 border-gray-200 bg-white p-5"
    >
      {isAuthenticated && user ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Signed in as{' '}
            <span className="font-medium text-navy">{user.email}</span>
          </p>
          <button
            onClick={logout}
            className="text-xs text-blue underline hover:text-navy transition-colors"
          >
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600 mb-3">
            Enter your email to save progress and view past submissions.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (showError) setShowError(false);
              }}
              placeholder="you@ucsd.edu"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
            />
            <button
              type="submit"
              disabled={isSending}
              className="rounded-md bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-navy transition-colors disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Continue'}
            </button>
          </div>
          {showError && (
            <p className="mt-2 text-xs text-red-500">
              Please enter a valid email address.
            </p>
          )}
          {error && (
            <p className="mt-2 text-xs text-red-500">
              {error}
            </p>
          )}
        </form>
      )}
    </motion.div>
  );
}

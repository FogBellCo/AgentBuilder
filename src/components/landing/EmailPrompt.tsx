import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserEmail } from '@/hooks/use-user-email';

export function EmailPrompt() {
  const { email, setEmail, clearEmail, isIdentified } = useUserEmail();
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.includes('@')) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setEmail(inputValue.trim());
    setInputValue('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto rounded-lg border-2 border-gray-200 bg-white p-5"
    >
      {isIdentified ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Continuing as{' '}
            <span className="font-medium text-navy">{email}</span>
          </p>
          <button
            onClick={clearEmail}
            className="text-xs text-blue underline hover:text-navy transition-colors"
          >
            Change
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
              className="rounded-md bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-navy transition-colors"
            >
              Continue
            </button>
          </div>
          {showError && (
            <p className="mt-2 text-xs text-red-500">
              Please enter a valid email address.
            </p>
          )}
        </form>
      )}
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GuidancePageProps {
  content: string;
  onBack: () => void;
}

export function GuidancePage({ content, onBack }: GuidancePageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl py-8"
    >
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-xs text-blue hover:text-navy transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Wizard
      </button>

      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-navy mb-4">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold text-navy mt-8 mb-3 uppercase tracking-wider">
                {children}
              </h2>
            ),
            p: ({ children }) => (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{children}</p>
            ),
            li: ({ children }) => (
              <li className="text-sm text-gray-600 leading-relaxed mb-2">{children}</li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue hover:text-navy inline-flex items-center gap-1"
              >
                {children}
                <ExternalLink className="h-3 w-3" />
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-navy">{children}</strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}

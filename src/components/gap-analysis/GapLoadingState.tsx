import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function GapLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="h-10 w-10 text-blue" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-4 text-sm font-medium text-navy"
      >
        Analyzing your submission...
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-1 text-xs text-gray-500"
      >
        We're checking for any gaps in your responses.
      </motion.p>
    </div>
  );
}

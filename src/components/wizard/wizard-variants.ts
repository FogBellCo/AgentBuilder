export type TransitionDirection = 'forward' | 'backward';

export const questionVariants = {
  enter: (direction: TransitionDirection) => ({
    opacity: 0,
    y: direction === 'forward' ? 60 : -60,
  }),
  center: {
    opacity: 1,
    y: 0,
  },
  exit: (direction: TransitionDirection) => ({
    opacity: 0,
    y: direction === 'forward' ? -60 : 60,
  }),
};

export const questionTransition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

// Reduced motion variants — simple opacity fade, no y-axis movement
export const questionVariantsReduced = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export const questionTransitionReduced = {
  duration: 0.15,
};

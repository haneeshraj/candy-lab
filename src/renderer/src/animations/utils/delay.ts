import type { Transition } from 'motion/react'

/** Return a copy of a transition with an added delay (seconds). */
export const withDelay = (transition: Transition, delay: number): Transition => ({
  ...transition,
  delay
})

/**
 * Compute a per-item delay for manual index-based sequencing (when you can't
 * use a stagger container). `staggerDelay(2)` → 0.12s with the default step.
 */
export const staggerDelay = (index: number, step = 0.06, base = 0): number => base + index * step

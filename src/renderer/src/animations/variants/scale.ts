import type { Variants } from 'motion/react'

// Scale + fade. `transform: scale` is GPU-composited, so it's cheap and smooth.
// Good for elements that "pop" in (modals, popovers, tooltips).

export const scale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 }
}

/** Stronger entrance for emphasis (dialogs). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
}

import type { Variants } from 'motion/react'

// Opacity-only — the cheapest, most reusable state change. No timing here;
// pair with a transition (via a preset or the `transition` prop).

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

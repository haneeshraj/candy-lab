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

/**
 * Unfurls vertically from the top edge — pair with `transform-origin: top` in
 * CSS so it grows downward out of its trigger. Scale-only (no fade): good for
 * menus / popovers whose contents animate in separately.
 */
export const scaleYTop: Variants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1 },
  exit: { scaleY: 0 }
}

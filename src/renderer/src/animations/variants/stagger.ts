import type { Variants } from 'motion/react'

// Orchestration variants for a container that reveals its children in sequence.
// Put this on the parent and a child variant (e.g. `fade`, `slideUp`) on each
// item; the parent's `animate="visible"` cascades to the children.
//
// NOTE: `staggerChildren`/`delayChildren` are orchestration timing (the ONE
// place timing legitimately lives in a variant) — they describe sequencing, not
// the visual easing/duration of any single element.

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 }
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 }
  }
}

/** Factory for custom stagger timing. */
export const createStaggerContainer = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
  exit: { transition: { staggerChildren: staggerChildren / 1.5, staggerDirection: -1 } }
})

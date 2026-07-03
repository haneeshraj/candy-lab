import type { Transition } from 'motion/react'

// Physics-based transitions. Great for scale/translate on interactive elements
// (modals, popovers). Springs ignore `duration` and settle naturally.

/** Balanced spring — the default physical feel. */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
}

/** Softer, slower settle — good for large surfaces. */
export const springSoft: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 26
}

/** Bouncier, more playful — use sparingly. */
export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 18
}

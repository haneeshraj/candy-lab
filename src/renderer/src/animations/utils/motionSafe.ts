import type { Transition } from 'motion/react'
import type { MotionPreset } from './types'

/** An instant transition — used to disable motion for reduced-motion users. */
export const instantTransition: Transition = { duration: 0 }

/**
 * Collapse a transition to instant when the user prefers reduced motion.
 * Opacity still changes (allowed and expected); only movement/duration is cut.
 */
export const motionSafeTransition = (transition: Transition, reduced: boolean): Transition =>
  reduced ? instantTransition : transition

/**
 * Make a preset reduced-motion safe: keeps its variants/states but swaps in an
 * instant transition so nothing visibly moves. Spread the result onto a motion
 * component. See `useReducedMotionSafe` for the `reduced` flag.
 */
export const motionSafePreset = (preset: MotionPreset, reduced: boolean): MotionPreset =>
  reduced ? { ...preset, transition: instantTransition } : preset

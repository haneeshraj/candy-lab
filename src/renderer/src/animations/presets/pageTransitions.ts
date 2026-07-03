import type { MotionPreset } from '../utils/types'
import { fade } from '../variants/fade'
import { slideUp } from '../variants/slide'
import { defaultTransition } from '../transitions/default'

// Route / page-level transitions. Use with <AnimatePresence mode="wait"> and a
// unique `key` per route so the outgoing page animates out before the next in.

/** Plain crossfade between pages. */
export const pageFade: MotionPreset = {
  variants: fade,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: defaultTransition
}

/** Subtle upward slide + fade — the default page transition. */
export const pageSlide: MotionPreset = {
  variants: slideUp,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: defaultTransition
}

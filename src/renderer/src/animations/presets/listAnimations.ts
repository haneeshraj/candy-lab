import type { MotionPreset } from '../utils/types'
import { staggerContainer } from '../variants/stagger'
import { slideUp } from '../variants/slide'
import { defaultTransition } from '../transitions/default'

// Reveal a list so items cascade in. Put `listContainer` on the <ul>/wrapper
// and `listItem` on each child; the container orchestrates the sequence.

/** Parent wrapper — orchestrates the stagger (timing lives in the variant). */
export const listContainer: MotionPreset = {
  variants: staggerContainer,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit'
}

/** Each list item — inherits the container's play state. */
export const listItem: MotionPreset = {
  variants: slideUp,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: defaultTransition
}

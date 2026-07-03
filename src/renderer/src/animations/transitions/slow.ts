import type { Transition } from 'motion/react'
import { duration, easeStandard } from './default'

/** Deliberate transition for large surfaces (page/route changes, big panels). */
export const slowTransition: Transition = {
  duration: duration.slow,
  ease: easeStandard
}

import type { Transition } from 'motion/react'
import { duration, easeEmphasized } from './default'

/** Slow, decelerating emphasis — draws the eye as content settles into place. */
export const emphasizedTransition: Transition = {
  duration: duration.slower,
  ease: easeEmphasized
}

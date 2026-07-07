import type { Transition } from 'motion/react'
import { duration, easeEmphasized } from './default'

/** Snappy transition for small, frequent UI (hovers, dropdowns, toggles). */
export const fastTransition: Transition = {
  duration: duration.slow,
  ease: easeEmphasized
}

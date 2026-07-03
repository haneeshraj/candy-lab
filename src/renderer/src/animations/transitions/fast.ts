import type { Transition } from 'motion/react'
import { duration, easeOut } from './default'

/** Snappy transition for small, frequent UI (hovers, dropdowns, toggles). */
export const fastTransition: Transition = {
  duration: duration.fast,
  ease: easeOut
}

import type { Variants } from 'motion/react'
import type { MotionPreset } from '../utils/types'
import { fastTransition } from '../transitions/fast'

// Sidebar motion. The rail is a fixed icon-only column, so the only animation
// is the hover tooltip — cheap, compositor-friendly opacity/x work.

// Tooltip shown to the right of an icon on hover. A short nudge from the icon,
// quick in and out.
const tooltipVariants: Variants = {
  hidden: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -4 }
}

export const sidebarTooltip: MotionPreset = {
  variants: tooltipVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: fastTransition
}

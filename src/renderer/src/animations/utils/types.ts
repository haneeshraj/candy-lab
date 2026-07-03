import type { Transition, Variants } from 'motion/react'

/**
 * A ready-to-spread animation pattern for a motion component:
 *
 *   <motion.div {...pageFade} />
 *
 * Presets combine a set of `variants` with a `transition` and the standard
 * `initial` / `animate` / `exit` state labels used across the app.
 */
export interface MotionPreset {
  variants: Variants
  initial: string | boolean
  animate: string
  exit?: string
  transition?: Transition
}

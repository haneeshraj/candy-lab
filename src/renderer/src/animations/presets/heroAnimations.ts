import type { MotionPreset } from '../utils/types'
import { createStaggerContainer } from '../variants/stagger'
import { slideUp } from '../variants/slide'
import { emphasizedTransition } from '../transitions/emphasized'

// Entrance for a centered hero (e.g. the Coming Soon page): children rise and
// fade in one after another with a slow, emphasized settle.

/** Wrapper — orchestrates the stagger. Put on the content container. */
export const heroContainer: MotionPreset = {
  variants: createStaggerContainer(0.12, 0.1),
  initial: 'hidden',
  animate: 'visible'
}

/**
 * Each hero element. Pass only `variants`/`transition` to children so the
 * container's stagger drives them (see the animations README).
 */
export const heroItem: MotionPreset = {
  variants: slideUp,
  initial: 'hidden',
  animate: 'visible',
  transition: emphasizedTransition
}

import type { MotionPreset } from '../utils/types'
import { slideDown } from '../variants/slide'
import { fastTransition } from '../transitions/fast'

// Menus / popovers that open from a trigger. Fast + short-travel so they feel
// instant. `slideDown` starts slightly above and drops into place.

export const dropdown: MotionPreset = {
  variants: slideDown,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: fastTransition
}

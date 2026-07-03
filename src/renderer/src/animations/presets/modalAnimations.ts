import type { MotionPreset } from '../utils/types'
import { fade } from '../variants/fade'
import { scaleIn } from '../variants/scale'
import { fastTransition } from '../transitions/fast'
import { springTransition } from '../transitions/spring'

// A modal is two coordinated pieces: a backdrop that fades, and a dialog that
// scales in. Apply each preset to the respective element inside <AnimatePresence>.

/** Dimmed backdrop / scrim behind the dialog. */
export const modalBackdrop: MotionPreset = {
  variants: fade,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: fastTransition
}

/** The dialog surface — springs in for a tactile feel. */
export const modalContent: MotionPreset = {
  variants: scaleIn,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: springTransition
}

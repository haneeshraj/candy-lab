import type { Variants } from 'motion/react'
import type { MotionPreset } from '../utils/types'
import { slideDown, slideUp, slideUpSm } from '../variants/slide'
import { scaleYTop } from '../variants/scale'
import { fastTransition } from '../transitions/fast'
import { emphasizedTransition } from '../transitions/emphasized'
import { easeOut } from '../transitions/default'

// Menus / popovers that open from a trigger. Fast + short-travel so they feel
// instant. `slideDown` starts slightly above and drops into place.

export const dropdown: MotionPreset = {
  variants: slideDown,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: fastTransition
}

// A menu that unfurls from its trigger: the panel scales open from its top edge
// (pair with `transform-origin: top`) while its items cascade in just after.
// Orchestration timing lives on the container variant — the one place timing
// legitimately belongs in a variant (see `variants/stagger.ts`).

/** Seconds between each item, and before the first item starts. */
const itemStagger = 0.2
const itemsDelay = 0.1

const menuPanelVariants: Variants = {
  ...scaleYTop,
  visible: {
    ...scaleYTop.visible,
    transition: { staggerChildren: itemStagger, delayChildren: itemsDelay }
  },
  exit: {
    ...scaleYTop.exit,
    // Items just fade out (see `menuItemVariants`); the panel then waits
    // `itemsDelay` before scaling away. `delay` targets the panel's own scaleY.
    transition: { delay: itemsDelay }
  }
}

// Item enter keeps the emphasized slide+fade; exit is a quick, movement-free
// fade — the panel's scale-down handles the visual close, so items don't move.
const menuItemVariants: Variants = {
  ...slideUpSm,
  exit: { opacity: 0, transition: { duration: 0.2, ease: easeOut } }
}

/** The dropdown panel — scales open from the top and orchestrates its items. */
export const menuPanel: MotionPreset = {
  variants: menuPanelVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: fastTransition // drives the panel's own scaleY timing
}

/** Each menu item — a small upward nudge + fade, sequenced by `menuPanel`. */
export const menuItem: MotionPreset = {
  variants: menuItemVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: emphasizedTransition
}

// A panel that rises from a bar anchored to the bottom (e.g. the floating user
// bar). It slides UP + fades while its items cascade in just after. Pair with
// `transform-origin: bottom`. Same shape as `menuPanel`, but a slide instead of
// a scale, with a quicker cascade — reuse `menuItem` for the items.

/** Seconds between each item, and before the first item starts. */
const userItemStagger = 0.05
const userItemsDelay = 0.05

const userMenuPanelVariants: Variants = {
  ...slideUp,
  visible: {
    ...slideUp.visible,
    transition: { staggerChildren: userItemStagger, delayChildren: userItemsDelay }
  },
  exit: {
    ...slideUp.exit,
    // Items fade out first (see `menuItemVariants`); the panel then slides away
    // after a beat. `delay` targets the panel's own slide/opacity.
    transition: { delay: userItemsDelay, staggerChildren: userItemStagger, staggerDirection: -1 }
  }
}

/** The user-bar menu panel — slides up from the bar and orchestrates its items. */
export const userMenuPanel: MotionPreset = {
  variants: userMenuPanelVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: fastTransition // drives the panel's own slide/opacity timing
}

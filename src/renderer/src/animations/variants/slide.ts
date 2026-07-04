import type { Variants } from 'motion/react'

// Translate + fade. Uses `x`/`y` (compositor-friendly transforms), never
// top/left, to avoid layout thrash. Direction names describe the ENTER motion,
// e.g. `slideUp` enters by moving upward (starts below its final position).

/** Distance the element travels, in pixels. */
const offset = 16

/** Short-travel distance for tight staggers (menu items, dense list rows). */
const offsetSm = 6

export const slideUp: Variants = {
  hidden: { opacity: 0, y: offset },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: offset }
}

/** Like `slideUp`, but a small nudge — for cascading items inside menus/lists. */
export const slideUpSm: Variants = {
  hidden: { opacity: 0, y: offsetSm },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: offsetSm }
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -offset },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -offset }
}

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: offset },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: offset }
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -offset },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -offset }
}

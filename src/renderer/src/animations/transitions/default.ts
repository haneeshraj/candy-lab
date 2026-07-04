import type { Transition } from 'motion/react'

// ---------------------------------------------------------------------------
// Timing tokens — the single source of truth for how long / how animations move.
// motion uses SECONDS for durations. Never hardcode these inside components.
// ---------------------------------------------------------------------------

/** Duration tokens, in seconds. */
export const duration = {
  fast: 0.12,
  normal: 0.22,
  slow: 0.36,
  slower: 0.6
} as const

/** Easing curves (cubic-bezier control points). */
export const easeStandard = [0.4, 0, 0.2, 1] as const
export const easeIn = [0.4, 0, 1, 1] as const
export const easeOut = [0, 0, 0.2, 1] as const
/** Strong, long-tailed deceleration — snaps in, settles slowly. For emphasis. */
export const easeEmphasized = [0.52, 0, 0, 1] as const

/** The default transition used by most presets. */
export const defaultTransition: Transition = {
  duration: duration.normal,
  ease: easeStandard
}

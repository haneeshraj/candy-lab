import { useReducedMotion } from 'motion/react'

/**
 * Like motion's `useReducedMotion`, but always returns a boolean (never `null`)
 * so call sites don't have to null-check. `true` = the user has asked the OS to
 * minimize motion; honor it by disabling movement (see `motionSafePreset`).
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false
}

import { useAnimationControls } from 'motion/react'
import { useReducedMotionSafe } from './useReducedMotionSafe'

type AnimationControls = ReturnType<typeof useAnimationControls>

export interface MotionControls {
  /** Imperative controls — call `controls.start(...)` to trigger animations. */
  controls: AnimationControls
  /** Whether the user prefers reduced motion (honor it in your `start` calls). */
  reducedMotion: boolean
}

/**
 * Imperative animation controls bundled with the reduced-motion flag, for the
 * cases where declarative variants aren't enough (e.g. animating in response to
 * an event). Keeps the `useAnimationControls` + `useReducedMotion` pairing in
 * one place instead of repeating it in components.
 */
export function useMotionControls(): MotionControls {
  const controls = useAnimationControls()
  const reducedMotion = useReducedMotionSafe()
  return { controls, reducedMotion }
}

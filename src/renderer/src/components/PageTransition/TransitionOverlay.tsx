import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { Target, Transition } from 'motion/react'

import type { TransitionPhase } from './TransitionContext'
import styles from './TransitionOverlay.module.scss'

interface TransitionOverlayProps {
  phase: TransitionPhase
  /** Text shown in the middle, revealed/clipped by the overlay rectangle. */
  label: string
  /** Fire when the cover (enter) animation lands — swaps the route. */
  onCovered: () => void
  /** Fire when the reveal (exit) animation finishes — ends the transition. */
  onRevealed: () => void
}

// ===========================================================================
// ANIMATION — this is the block to tune.
// ---------------------------------------------------------------------------
// We wipe with `clip-path` (an inset rectangle) rather than a transform, so the
// panel stays pinned to the viewport and never extends the scroll area — no
// overflow/scrollbar flash on the incoming page. Because `clip-path` clips the
// element AND its children, the centered label is revealed by the same wipe.
//
//   inset(top right bottom left) — how far the visible rectangle is inset from
//   each edge. 100% on an edge = clipped away against the opposite edge.
//
//   cover   = initial → animate   (rectangle wipes DOWN to fully cover)
//   reveal  = animate → exit      (rectangle keeps wiping DOWN, uncovering)
//
// `animate` MUST be the fully-covering state (that's when the route swaps).
// ===========================================================================

/** Off state it enters FROM — clipped to nothing against the top edge. */
const cover: Target = { clipPath: 'inset(0 0 100% 0)' }
/** Fully-covering state. */
const covered: Target = { clipPath: 'inset(0 0 0 0)' }
/** Off state it exits TO — clipped to nothing against the bottom edge. */
const reveal: Target = { clipPath: 'inset(100% 0 0 0)' }

const overlayTransition: Transition = {
  duration: 0.5,
  ease: [0.65, 0, 0, 1]
}

/**
 * The full-viewport solid that fronts every page transition, with a centered
 * label the wipe reveals. Rendered into `document.body` via a portal so it
 * paints above the entire shell (title bar included), and only mounted while a
 * transition is running.
 *
 * `onAnimationComplete` fires for the enter animation; we gate it on `phase` so
 * the exit's completion doesn't re-trigger the route swap. `onExitComplete`
 * (from `AnimatePresence`) reports the reveal finishing.
 */
export function TransitionOverlay({
  phase,
  label,
  onCovered,
  onRevealed
}: TransitionOverlayProps): React.ReactPortal {
  return createPortal(
    <AnimatePresence onExitComplete={onRevealed}>
      {phase === 'covering' && (
        <motion.div
          className={styles.overlay}
          aria-hidden
          initial={cover}
          animate={covered}
          exit={reveal}
          transition={overlayTransition}
          onAnimationComplete={() => {
            if (phase === 'covering') onCovered()
          }}
        >
          <span className={styles.label}>{label}</span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

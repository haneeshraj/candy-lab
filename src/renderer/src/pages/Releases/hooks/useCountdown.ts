import { useEffect, useState } from 'react'

/** The time remaining until a target instant, broken into display units. */
export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** True once the target has passed (or there is no target). */
  isComplete: boolean
}

const DONE: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true }

/** Snapshot the remaining time to `target` (epoch ms) as of now. */
function remaining(target: number | null): Countdown {
  if (target === null) return DONE
  const diff = target - Date.now()
  if (diff <= 0) return DONE

  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isComplete: false
  }
}

/**
 * A live countdown to `target` (epoch ms), re-computed once a second. Returns the
 * remaining days/hours/minutes/seconds and an `isComplete` flag that flips true
 * the moment the target passes — so the caller re-renders into its post-release
 * state without any data change or manual refresh. The interval clears itself on
 * completion. A `null` target is treated as already complete (nothing to count
 * down to), matching a release with no date.
 */
export function useCountdown(target: number | null): Countdown {
  const [value, setValue] = useState<Countdown>(() => remaining(target))

  // Re-sync during render when `target` changes (e.g. drilling into another
  // release's detail view without remounting) — React's supported pattern for
  // deriving state from a changed input, so the display is correct immediately
  // rather than after the first tick.
  const [prevTarget, setPrevTarget] = useState(target)
  if (target !== prevTarget) {
    setPrevTarget(target)
    setValue(remaining(target))
  }

  useEffect(() => {
    if (target === null) return undefined
    const id = window.setInterval(() => {
      const next = remaining(target)
      setValue(next)
      if (next.isComplete) window.clearInterval(id)
    }, 1000)
    return () => window.clearInterval(id)
  }, [target])

  return value
}

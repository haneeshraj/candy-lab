import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReducedMotionSafe } from '@renderer/animations/hooks/useReducedMotionSafe'

// Minimal hook sanity check. `matchMedia` is stubbed in the setup file to report
// no reduced-motion preference, so the result is deterministic.
describe('useReducedMotionSafe', () => {
  it('always returns a boolean (never null)', () => {
    const { result } = renderHook(() => useReducedMotionSafe())
    expect(typeof result.current).toBe('boolean')
    expect(result.current).toBe(false)
  })
})

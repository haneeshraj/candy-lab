import { describe, it, expect } from 'vitest'
import { staggerDelay, withDelay } from '@renderer/animations/utils/delay'
import { defaultTransition } from '@renderer/animations/transitions/default'

// Pure helper functions — the simplest possible pipeline validation.
describe('animation delay helpers', () => {
  it('staggerDelay computes an index-based delay', () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(3, 0.1)).toBeCloseTo(0.3)
    expect(staggerDelay(2, 0.05, 0.1)).toBeCloseTo(0.2)
  })

  it('withDelay adds a delay without mutating the source transition', () => {
    const delayed = withDelay(defaultTransition, 0.5)
    expect(delayed.delay).toBe(0.5)
    expect(defaultTransition).not.toHaveProperty('delay')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@renderer/store'

// Store logic is testable without React — drive it via the static `getState()`
// API. Reset before each test so cases stay isolated.
describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('has the expected default state', () => {
    const state = useAppStore.getState()
    expect(state.initialized).toBe(false)
    expect(state.bootError).toBeNull()
  })

  it('updates `initialized` via setInitialized', () => {
    useAppStore.getState().setInitialized(true)
    expect(useAppStore.getState().initialized).toBe(true)
  })

  it('sets and clears `bootError`, and reset restores defaults', () => {
    useAppStore.getState().setBootError('boom')
    expect(useAppStore.getState().bootError).toBe('boom')

    useAppStore.getState().reset()
    expect(useAppStore.getState().bootError).toBeNull()
    expect(useAppStore.getState().initialized).toBe(false)
  })
})

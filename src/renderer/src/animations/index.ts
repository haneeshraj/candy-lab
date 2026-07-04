// ===========================================================================
// Animation system — public API
// ---------------------------------------------------------------------------
// Import everything from here (or `@renderer/animations`):
//
//   import { pageSlide, fade, defaultTransition, useReducedMotionSafe } from '@renderer/animations'
//
// See ./README.md for the guide.
// ===========================================================================

// Variants (low level — what the animation does)
export * from './variants/fade'
export * from './variants/slide'
export * from './variants/scale'
export * from './variants/stagger'

// Transitions (low level — how it moves)
export * from './transitions/default'
export * from './transitions/fast'
export * from './transitions/slow'
export * from './transitions/spring'
export * from './transitions/emphasized'

// Presets (high level — reusable UI patterns)
export * from './presets/pageTransitions'
export * from './presets/modalAnimations'
export * from './presets/listAnimations'
export * from './presets/dropdownAnimations'
export * from './presets/sidebarAnimations'
export * from './presets/heroAnimations'

// Hooks
export * from './hooks'

// Utils (helpers + shared types)
export * from './utils'

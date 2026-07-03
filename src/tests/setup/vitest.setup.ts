import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement `matchMedia`; provide a minimal, deterministic stub so
// hooks that read it (e.g. prefers-reduced-motion) don't throw in tests.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    })
  })
}

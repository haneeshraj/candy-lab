import { join } from 'path'

// Static app + window configuration. Keep magic numbers and identifiers here,
// not scattered across window/lifecycle code.

export const APP_CONFIG = {
  appUserModelId: 'com.electron.candy-lab',

  /** Show a splash window while the main window loads. */
  enableSplash: false,

  window: {
    main: { width: 900, height: 670, minWidth: 640, minHeight: 480 },
    splash: { width: 420, height: 260 }
  }
} as const

/** Absolute path to the bundled preload script (resolved at runtime). */
export function getPreloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

/** Absolute path to the built renderer entry HTML (production). */
export function getRendererHtml(): string {
  return join(__dirname, '../renderer/index.html')
}

/** Dev server URL injected by electron-vite (undefined in production). */
export function getRendererDevUrl(): string | undefined {
  return process.env['ELECTRON_RENDERER_URL']
}

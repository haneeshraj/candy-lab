import { is } from '@electron-toolkit/utils'

/** True in development (electron-vite dev server running). */
export const isDev = is.dev

/** Promise-based delay (ms). Useful for splash timing, retries, etc. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Extract a clean, user-facing message from an error. IPC errors surfaced by
 * Electron are prefixed (e.g. `Error invoking remote method 'x': Error: real`),
 * so we peel that off to show just the underlying message.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof Error && error.message) {
    const match = error.message.match(/Error:\s(.*)$/)
    return match ? match[1] : error.message
  }
  return fallback
}

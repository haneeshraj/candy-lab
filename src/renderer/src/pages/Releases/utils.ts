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

/** Format an ISO date (`YYYY-MM-DD`) for display; empty string when absent. */
export function formatReleaseDate(date: string | null): string {
  if (!date) return ''
  // Parse Y-M-D as a LOCAL date. `new Date('2026-07-03')` parses as UTC
  // midnight, which renders as the previous day in negative-offset timezones.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  const parsed = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

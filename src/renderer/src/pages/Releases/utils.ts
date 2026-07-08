import type { Release } from './types'
import type { ReleaseFilters, SortKey } from './constants'

export const RELEASE_PUBLIC_BASE_URL = 'https://candyheist.vercel.app'

function slugifyReleaseName(name: string): string {
  const normalized = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const slug = normalized
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'release'
}

/** Build the public release page URL for a release. */
export function buildReleaseUrl(release: Pick<Release, 'projectName'>): string {
  return `${RELEASE_PUBLIC_BASE_URL}/release/${slugifyReleaseName(release.projectName)}`
}

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

/**
 * Comparator for ordering releases by the chosen sort key. Releases without a
 * release date always sink below dated ones (mirroring the service-side
 * `nullsFirst: false`); ties fall back to newest-added first, matching the
 * server's secondary `created_at` ordering.
 */
export function compareReleases(a: Release, b: Release, sort: SortKey): number {
  switch (sort) {
    case 'name-asc':
      return a.projectName.localeCompare(b.projectName)
    case 'name-desc':
      return b.projectName.localeCompare(a.projectName)
    case 'added-desc':
      return b.createdAt.localeCompare(a.createdAt)
    case 'date-asc':
    case 'date-desc': {
      if (a.releaseDate !== b.releaseDate) {
        if (!a.releaseDate) return 1
        if (!b.releaseDate) return -1
        const cmp = a.releaseDate.localeCompare(b.releaseDate)
        return sort === 'date-asc' ? cmp : -cmp
      }
      return b.createdAt.localeCompare(a.createdAt)
    }
    default:
      return 0
  }
}

/**
 * Whether a release satisfies the active filter set (type, artists, platforms).
 * Facets are independent (AND across facets). The artist facet is also AND: a
 * release must be credited to *every* selected artist. The platform facet is OR:
 * a release matches if it's available on any selected platform. An empty facet
 * imposes no constraint. Search is handled separately in the page.
 */
export function matchesFilters(release: Release, filters: ReleaseFilters): boolean {
  if (filters.type !== 'all' && release.projectType !== filters.type) return false

  if (filters.artistIds.length > 0) {
    const creditedIds = new Set(release.artists.map((artist) => artist.id))
    const hasAll = filters.artistIds.every((id) => creditedIds.has(id))
    if (!hasAll) return false
  }

  if (filters.platforms.length > 0) {
    const available = filters.platforms.some((platform) =>
      Boolean(release.platformLinks[platform]?.trim())
    )
    if (!available) return false
  }

  return true
}

/**
 * Parse an ISO date (`YYYY-MM-DD`) as a LOCAL date at midnight. `new Date('2026-07-03')`
 * parses as UTC midnight, which lands on the previous day in negative-offset
 * timezones — so we build the date from its parts instead. Returns null when the
 * value can't be parsed.
 */
function parseLocalDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  const parsed = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Format an ISO date (`YYYY-MM-DD`) for display; empty string when absent. */
export function formatReleaseDate(date: string | null): string {
  if (!date) return ''
  const parsed = parseLocalDate(date)
  return parsed
    ? parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : date
}

/**
 * The instant a release goes live — local midnight at the start of its release
 * date, as epoch milliseconds. Null when the release has no date (nothing to
 * count down to). This is the single reference point the pre/post-release state
 * is derived from.
 */
export function releaseInstant(release: Pick<Release, 'releaseDate'>): number | null {
  if (!release.releaseDate) return null
  return parseLocalDate(release.releaseDate)?.getTime() ?? null
}

/**
 * Whether a release is still in its pre-release (pre-save) window: it has a
 * release date and the current time is before it. Derived from `releaseDate`
 * alone, so the app and the public website agree from the clock — no stored flag.
 * `now` is injectable for testing.
 */
export function isPreRelease(release: Pick<Release, 'releaseDate'>, now = Date.now()): boolean {
  const instant = releaseInstant(release)
  return instant !== null && now < instant
}

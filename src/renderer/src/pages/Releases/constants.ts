import type { ProjectType, ReleasePlatform } from './types'

/** Project-type options for the Add/Edit form (value → display label). */
export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'album', label: 'Album' },
  { value: 'remix', label: 'Remix' },
  { value: 'bootleg', label: 'Bootleg' },
  { value: 'compilation', label: 'Compilation' }
]

/** Human label for a project type (falls back to the raw value). */
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = Object.fromEntries(
  PROJECT_TYPES.map((option) => [option.value, option.label])
) as Record<ProjectType, string>

/** Whether a project type owns a tracklist (Album/EP) vs. being a standalone
 * release. Drives the conditional track section in the form and the two-column
 * detail layout. */
export function isMultiTrack(type: ProjectType | ''): boolean {
  return type === 'album' || type === 'ep'
}

/** How the catalog grid can be ordered (value → display label). */
export type SortKey = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'added-desc'

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Release date (newest)' },
  { value: 'date-asc', label: 'Release date (oldest)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'added-desc', label: 'Recently added' }
]

/** Type-filter options: "All types" plus each project type. */
export const TYPE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All types' },
  ...PROJECT_TYPES
]

/** The catalog's active sort + filters, edited through the filter modal. */
export interface ReleaseFilters {
  sort: SortKey
  /** `'all'` or a specific project type. */
  type: string
  /** Match releases credited to any of these artist IDs (empty = any). */
  artistIds: string[]
  /** Match releases available on any of these platforms (empty = any). */
  platforms: string[]
}

/** The default view: newest release date first, nothing filtered out. */
export const DEFAULT_FILTERS: ReleaseFilters = {
  sort: 'date-desc',
  type: 'all',
  artistIds: [],
  platforms: []
}

/** How many of a filter set's facets are narrowing the results — drives the
 * count badge on the toolbar's Filters button. Sort is excluded (it reorders,
 * it doesn't filter). */
export function activeFilterCount(filters: ReleaseFilters): number {
  let count = 0
  if (filters.type !== 'all') count += 1
  if (filters.artistIds.length > 0) count += 1
  if (filters.platforms.length > 0) count += 1
  return count
}

/** Supported distribution / streaming platforms. */
export const PLATFORMS: ReleasePlatform[] = [
  'Spotify',
  'Apple Music',
  'YouTube',
  'SoundCloud',
  'Amazon Music'
]

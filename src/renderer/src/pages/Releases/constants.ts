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

/** Supported distribution / streaming platforms. */
export const PLATFORMS: ReleasePlatform[] = [
  'Spotify',
  'Apple Music',
  'YouTube',
  'SoundCloud',
  'Amazon Music'
]

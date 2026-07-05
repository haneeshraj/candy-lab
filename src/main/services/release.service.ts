import { randomUUID } from 'crypto'
import { getSupabase, MEDIA_BUCKET } from './supabase.service'
import { logger } from '../utils/logger'
import type { Artist, Release, ReleaseInput, UploadAssetInput } from '../../preload/ipc/types'

// Business logic for the Releases CMS. All Supabase access is funneled through
// here (via `supabase.service`), keeping handlers thin and the renderer clear of
// any DB knowledge. DB columns are snake_case; we map to the camelCase domain
// types on the way out and back.

// Shape of a `releases` row as returned by PostgREST, including the nested
// artists joined through the `release_artists` junction table.
interface ReleaseRow {
  id: string
  project_name: string
  project_type: Release['projectType']
  release_date: string | null
  genres: string[] | null
  platform_links: Record<string, string> | null
  visual_link: string | null
  master_link: string | null
  cover_art_url: string | null
  canvas_url: string | null
  preview_enabled: boolean
  created_at: string
  release_artists?: { artists: Artist | null }[] | null
}

// Columns to select, including the nested artist credits in one round-trip.
const RELEASE_SELECT = '*, release_artists(artists(id, name))'

/** Keep only platform entries that have a non-empty (trimmed) URL. */
function cleanPlatformLinks(links: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [platform, url] of Object.entries(links ?? {})) {
    const trimmed = url?.trim()
    if (trimmed) out[platform] = trimmed
  }
  return out
}

function mapRelease(row: ReleaseRow): Release {
  return {
    id: row.id,
    projectName: row.project_name,
    projectType: row.project_type,
    releaseDate: row.release_date,
    genres: row.genres ?? [],
    platformLinks: row.platform_links ?? {},
    visualLink: row.visual_link,
    masterLink: row.master_link,
    coverArtUrl: row.cover_art_url,
    canvasUrl: row.canvas_url,
    previewEnabled: row.preview_enabled,
    createdAt: row.created_at,
    artists: (row.release_artists ?? [])
      .map((link) => link.artists)
      .filter((artist): artist is Artist => artist !== null)
  }
}

/** All releases, newest first, with artist credits. */
export async function listReleases(): Promise<Release[]> {
  const { data, error } = await getSupabase()
    .from('releases')
    .select(RELEASE_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('listReleases failed', error)
    throw new Error(error.message)
  }
  return (data as ReleaseRow[]).map(mapRelease)
}

async function getReleaseById(id: string): Promise<Release> {
  const { data, error } = await getSupabase()
    .from('releases')
    .select(RELEASE_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    logger.error('getReleaseById failed', error)
    throw new Error(error.message)
  }
  return mapRelease(data as ReleaseRow)
}

/** Create a release and its artist relations, then return the full row. */
export async function createRelease(input: ReleaseInput): Promise<Release> {
  const name = input.projectName?.trim()
  if (!name) throw new Error('Project name is required')

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('releases')
    .insert({
      project_name: name,
      project_type: input.projectType,
      release_date: input.releaseDate,
      genres: input.genres,
      platform_links: cleanPlatformLinks(input.platformLinks),
      visual_link: input.visualLink,
      master_link: input.masterLink,
      cover_art_url: input.coverArtUrl,
      canvas_url: input.canvasUrl,
      preview_enabled: input.previewEnabled
    })
    .select('id')
    .single()

  if (error) {
    logger.error('createRelease insert failed', error)
    throw new Error(error.message)
  }

  const releaseId = (data as { id: string }).id

  const artistIds = [...new Set(input.artistIds)]
  if (artistIds.length > 0) {
    const { error: linkError } = await supabase
      .from('release_artists')
      .insert(artistIds.map((artistId) => ({ release_id: releaseId, artist_id: artistId })))

    if (linkError) {
      // Best-effort rollback so we don't leave an artist-less orphan release.
      await supabase.from('releases').delete().eq('id', releaseId)
      logger.error('createRelease link failed — rolled back release', linkError)
      throw new Error(linkError.message)
    }
  }

  return getReleaseById(releaseId)
}

/** Update a release, resync its artist relations, and clean up replaced media. */
export async function updateRelease(id: string, input: ReleaseInput): Promise<Release> {
  const name = input.projectName?.trim()
  if (!name) throw new Error('Project name is required')

  const supabase = getSupabase()

  // Snapshot current media so we can delete anything being replaced/removed.
  const current = await getReleaseById(id)
  const staleAssets: string[] = []
  if (current.coverArtUrl && current.coverArtUrl !== input.coverArtUrl) {
    staleAssets.push(current.coverArtUrl)
  }
  if (current.canvasUrl && current.canvasUrl !== input.canvasUrl) {
    staleAssets.push(current.canvasUrl)
  }

  const { error } = await supabase
    .from('releases')
    .update({
      project_name: name,
      project_type: input.projectType,
      release_date: input.releaseDate,
      genres: input.genres,
      platform_links: cleanPlatformLinks(input.platformLinks),
      visual_link: input.visualLink,
      master_link: input.masterLink,
      cover_art_url: input.coverArtUrl,
      canvas_url: input.canvasUrl,
      preview_enabled: input.previewEnabled
    })
    .eq('id', id)

  if (error) {
    logger.error('updateRelease failed', error)
    throw new Error(error.message)
  }

  // Resync artist relations: clear then re-insert the current selection.
  const { error: clearError } = await supabase.from('release_artists').delete().eq('release_id', id)
  if (clearError) {
    logger.error('updateRelease clear relations failed', clearError)
    throw new Error(clearError.message)
  }

  const artistIds = [...new Set(input.artistIds)]
  if (artistIds.length > 0) {
    const { error: linkError } = await supabase
      .from('release_artists')
      .insert(artistIds.map((artistId) => ({ release_id: id, artist_id: artistId })))
    if (linkError) {
      logger.error('updateRelease link relations failed', linkError)
      throw new Error(linkError.message)
    }
  }

  await removeAssets(staleAssets)
  return getReleaseById(id)
}

/** Delete a release (relations cascade) and remove its media from storage. */
export async function deleteRelease(id: string): Promise<void> {
  const supabase = getSupabase()
  const current = await getReleaseById(id)

  const { error } = await supabase.from('releases').delete().eq('id', id)
  if (error) {
    logger.error('deleteRelease failed', error)
    throw new Error(error.message)
  }

  await removeAssets(
    [current.coverArtUrl, current.canvasUrl].filter((url): url is string => Boolean(url))
  )
}

/** Derive a bucket object path from a public storage URL (or null if it isn't
 * one of ours). */
function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`
  const index = url.indexOf(marker)
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length))
}

/** Best-effort removal of storage objects; failures are logged, not thrown, so
 * a stray file never blocks a DB write from succeeding. */
async function removeAssets(urls: string[]): Promise<void> {
  const paths = urls.map(storagePathFromUrl).filter((path): path is string => Boolean(path))
  if (paths.length === 0) return

  const { error } = await getSupabase().storage.from(MEDIA_BUCKET).remove(paths)
  if (error) logger.warn('Failed to remove storage assets', error)
}

/** All artists, alphabetical. */
export async function listArtists(): Promise<Artist[]> {
  const { data, error } = await getSupabase()
    .from('artists')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    logger.error('listArtists failed', error)
    throw new Error(error.message)
  }
  return data as Artist[]
}

/** Get-or-create an artist by name (case-insensitive), preventing duplicates. */
export async function createArtist(name: string): Promise<Artist> {
  const trimmed = name?.trim()
  if (!trimmed) throw new Error('Artist name is required')

  const supabase = getSupabase()

  // Return the existing artist if the name already exists (any casing).
  const { data: existing, error: findError } = await supabase
    .from('artists')
    .select('id, name')
    .ilike('name', trimmed)
    .maybeSingle()

  if (findError) {
    logger.error('createArtist lookup failed', findError)
    throw new Error(findError.message)
  }
  if (existing) return existing as Artist

  const { data, error } = await supabase
    .from('artists')
    .insert({ name: trimmed })
    .select('id, name')
    .single()

  if (error) {
    logger.error('createArtist insert failed', error)
    throw new Error(error.message)
  }
  return data as Artist
}

/** Upload a media file to the storage bucket; returns its public URL. */
export async function uploadAsset(input: UploadAssetInput): Promise<string> {
  const { fileName, contentType, data } = input
  if (!data || data.byteLength === 0) throw new Error('Empty file')

  const supabase = getSupabase()
  // Prefix a UUID so uploads never collide, keep the original name for clarity.
  const safeName = fileName.replace(/[^\w.-]+/g, '_')
  const objectPath = `${randomUUID()}-${safeName}`

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(objectPath, Buffer.from(data), {
      contentType,
      upsert: false,
      // Object paths are UUID-unique and never rewritten, so they're immutable —
      // cache for a year so the renderer (Chromium) serves them from disk cache
      // instead of re-fetching on every view.
      cacheControl: '31536000'
    })

  if (error) {
    logger.error('uploadAsset failed', error)
    throw new Error(error.message)
  }

  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath)
  return pub.publicUrl
}

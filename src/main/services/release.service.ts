import { randomUUID } from 'crypto'
import { getSupabase, MEDIA_BUCKET } from './supabase.service'
import { logger } from '../utils/logger'
import type {
  Artist,
  Release,
  ReleaseInput,
  ReleasePage,
  UploadAssetInput
} from '../../preload/ipc/types'

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
  is_album_track: boolean
  created_at: string
  release_artists?: { artists: Artist | null }[] | null
  // Child track links where this release is the album (see `release_tracks`).
  release_tracks?: { track_id: string; position: number }[] | null
}

// Columns to select, including the nested artist credits and (for albums/EPs)
// the child track links in one round-trip. `release_tracks!album_id` disambiguates
// the two FKs back to `releases` — we want the rows where this release is the album.
const RELEASE_SELECT =
  '*, release_artists(artists(id, name)), release_tracks!album_id(track_id, position)'

// Default page size for the paginated list; the renderer passes its own, this
// is just a safe fallback for callers that don't.
const DEFAULT_PAGE_SIZE = 24

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
    isAlbumTrack: row.is_album_track ?? false,
    createdAt: row.created_at,
    artists: (row.release_artists ?? [])
      .map((link) => link.artists)
      .filter((artist): artist is Artist => artist !== null),
    trackIds: (row.release_tracks ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((link) => link.track_id)
  }
}

/** Album/EP releases own tracks; every other type never does. */
function ownsTracks(type: Release['projectType']): boolean {
  return type === 'album' || type === 'ep'
}

/**
 * Of the given track ids, which are album-only tracks (created inside an album,
 * hidden from the catalog). These belong to exactly one album, so when an album
 * is deleted — or one of these tracks is unlinked from it — the track is orphaned
 * and should be deleted along with it.
 */
async function albumOnlyChildIds(
  supabase: ReturnType<typeof getSupabase>,
  trackIds: string[]
): Promise<string[]> {
  if (trackIds.length === 0) return []
  const { data, error } = await supabase
    .from('releases')
    .select('id')
    .in('id', trackIds)
    .eq('is_album_track', true)
  if (error) {
    logger.error('albumOnlyChildIds lookup failed', error)
    throw new Error(error.message)
  }
  return (data as { id: string }[]).map((row) => row.id)
}

/**
 * Resync an album's track links: clear then re-insert the current selection in
 * order (`position` = index). Non-album/EP releases are forced to an empty list,
 * so changing a release's type away from Album/EP drops any stale links.
 */
async function syncTrackLinks(
  supabase: ReturnType<typeof getSupabase>,
  albumId: string,
  input: ReleaseInput
): Promise<void> {
  const { error: clearError } = await supabase
    .from('release_tracks')
    .delete()
    .eq('album_id', albumId)
  if (clearError) {
    logger.error('syncTrackLinks clear failed', clearError)
    throw new Error(clearError.message)
  }

  if (!ownsTracks(input.projectType)) return

  // Dedupe, drop any self-reference, preserve the chosen order.
  const trackIds = [...new Set(input.trackIds)].filter((id) => id !== albumId)
  if (trackIds.length === 0) return

  const { error: linkError } = await supabase.from('release_tracks').insert(
    trackIds.map((trackId, index) => ({
      album_id: albumId,
      track_id: trackId,
      position: index
    }))
  )
  if (linkError) {
    logger.error('syncTrackLinks insert failed', linkError)
    throw new Error(linkError.message)
  }
}

/**
 * A page of releases, newest release date first, with artist credits. `offset`
 * rows are skipped and up to `limit` rows returned — the renderer walks these
 * for infinite scroll. The exact total is fetched alongside so we can report
 * the catalog size and know when the last page has been reached.
 */
export async function listReleases(offset = 0, limit = DEFAULT_PAGE_SIZE): Promise<ReleasePage> {
  const { data, error, count } = await getSupabase()
    .from('releases')
    .select(RELEASE_SELECT, { count: 'exact' })
    // Album-only tracks live inside their album, never in the standalone catalog.
    .eq('is_album_track', false)
    .order('release_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    logger.error('listReleases failed', error)
    throw new Error(error.message)
  }

  const rows = data as ReleaseRow[]
  const total = count ?? offset + rows.length
  return {
    releases: rows.map(mapRelease),
    total,
    hasMore: offset + rows.length < total
  }
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
      preview_enabled: input.previewEnabled,
      is_album_track: input.isAlbumTrack ?? false
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

  // Parent first, then its child tracks: the release now exists, so the junction
  // rows reference a real album alongside the (already-existing) track releases.
  try {
    await syncTrackLinks(supabase, releaseId, input)
  } catch (err) {
    await supabase.from('releases').delete().eq('id', releaseId)
    throw err
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
      preview_enabled: input.previewEnabled,
      is_album_track: input.isAlbumTrack ?? current.isAlbumTrack
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

  await syncTrackLinks(supabase, id, input)

  // Any album-only track dropped from the tracklist (or orphaned by switching the
  // release away from Album/EP) belongs to nothing now — delete it and its media.
  const newTrackIds = ownsTracks(input.projectType) ? input.trackIds : []
  const removedIds = current.trackIds.filter((trackId) => !newTrackIds.includes(trackId))
  for (const orphanId of await albumOnlyChildIds(supabase, removedIds)) {
    await deleteRelease(orphanId)
  }

  await removeAssets(staleAssets)
  return getReleaseById(id)
}

/**
 * Fill an album-only track's missing cover/canvas from its owning album, by
 * reference (resolved on every read): album-only tracks that were created without
 * their own artwork display the album's media, so a change to the album cover
 * flows through automatically. Standalone tracks (real singles linked into the
 * album) are returned untouched — they keep whatever media they already have.
 */
function inheritAlbumMedia(track: Release, album: Release): Release {
  if (!track.isAlbumTrack) return track
  if (track.coverArtUrl && track.canvasUrl) return track
  return {
    ...track,
    coverArtUrl: track.coverArtUrl ?? album.coverArtUrl,
    canvasUrl: track.canvasUrl ?? album.canvasUrl
  }
}

/**
 * The child track releases of an Album or EP, in tracklist order, each with its
 * own artist credits — the album/EP detail view's right-hand list. Resolved in
 * two round-trips (link ids, then the releases), reordered to match `position`
 * since `.in()` doesn't preserve order. Album-only tracks with no artwork of
 * their own inherit the album's cover/canvas (see `inheritAlbumMedia`).
 */
export async function listReleaseTracks(albumId: string): Promise<Release[]> {
  const supabase = getSupabase()

  const { data: links, error: linkError } = await supabase
    .from('release_tracks')
    .select('track_id, position')
    .eq('album_id', albumId)
    .order('position', { ascending: true })

  if (linkError) {
    logger.error('listReleaseTracks link fetch failed', linkError)
    throw new Error(linkError.message)
  }

  const orderedIds = (links as { track_id: string }[]).map((link) => link.track_id)
  if (orderedIds.length === 0) return []

  // The album, so album-only tracks can inherit its media (one extra round-trip).
  const album = await getReleaseById(albumId)

  const { data, error } = await supabase
    .from('releases')
    .select(RELEASE_SELECT)
    .in('id', orderedIds)

  if (error) {
    logger.error('listReleaseTracks releases fetch failed', error)
    throw new Error(error.message)
  }

  const byId = new Map((data as ReleaseRow[]).map((row) => [row.id, mapRelease(row)]))
  return orderedIds
    .map((trackId) => byId.get(trackId))
    .filter((release): release is Release => release !== undefined)
    .map((track) => inheritAlbumMedia(track, album))
}

/** Delete a release (relations cascade) and remove its media from storage. When
 * deleting an Album/EP, its album-only tracks are deleted too — they exist only
 * inside this album, so they'd otherwise be orphaned. */
export async function deleteRelease(id: string): Promise<void> {
  const supabase = getSupabase()
  const current = await getReleaseById(id)

  // Resolve album-only children before the delete (the junction rows cascade away
  // with the album, so we'd lose the link to find them afterwards).
  const orphanChildIds = ownsTracks(current.projectType)
    ? await albumOnlyChildIds(supabase, current.trackIds)
    : []

  const { error } = await supabase.from('releases').delete().eq('id', id)
  if (error) {
    logger.error('deleteRelease failed', error)
    throw new Error(error.message)
  }

  await removeAssets(
    [current.coverArtUrl, current.canvasUrl].filter((url): url is string => Boolean(url))
  )

  // Children are standalone-typed (never own tracks), so this recursion is one
  // level deep and terminates. Each removes its own (real) media, if any.
  for (const childId of orphanChildIds) {
    await deleteRelease(childId)
  }
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

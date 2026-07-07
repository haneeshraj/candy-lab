// Renderer-side mirror of the Releases contract. Kept independent of the preload
// types (like `store/electron/types`) so the renderer stays self-contained;
// structural typing keeps it compatible with the `window.api.releases` surface.

export type ProjectType = 'single' | 'ep' | 'album' | 'remix' | 'bootleg' | 'compilation'

export type ReleasePlatform = 'Spotify' | 'Apple Music' | 'YouTube' | 'SoundCloud' | 'Amazon Music'

export interface Artist {
  id: string
  name: string
}

export interface Release {
  id: string
  projectName: string
  projectType: ProjectType
  releaseDate: string | null
  genres: string[]
  platformLinks: Record<string, string>
  visualLink: string | null
  masterLink: string | null
  coverArtUrl: string | null
  canvasUrl: string | null
  previewEnabled: boolean
  /** True for an album-only track (hidden from the catalog). When resolved via
   * `releases.tracks`, a null cover/canvas is filled from the owning album. */
  isAlbumTrack: boolean
  createdAt: string
  artists: Artist[]
  /** Ordered IDs of the child track releases (Album/EP only; empty otherwise). */
  trackIds: string[]
}

export interface ReleasePage {
  releases: Release[]
  total: number
  hasMore: boolean
}

export interface ReleaseInput {
  projectName: string
  projectType: ProjectType
  releaseDate: string | null
  genres: string[]
  platformLinks: Record<string, string>
  visualLink: string | null
  masterLink: string | null
  coverArtUrl: string | null
  canvasUrl: string | null
  previewEnabled: boolean
  /** Mark as an album-only track (hidden from the catalog). Defaults to false. */
  isAlbumTrack?: boolean
  artistIds: string[]
  /** Ordered IDs of the child track releases for an Album/EP (empty otherwise). */
  trackIds: string[]
}

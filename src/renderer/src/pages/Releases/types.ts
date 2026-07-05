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
  createdAt: string
  artists: Artist[]
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
  artistIds: string[]
}

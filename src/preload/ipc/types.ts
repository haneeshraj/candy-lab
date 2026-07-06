// Public shape of the API exposed on `window.api`. This is the contract the
// renderer codes against — self-contained (no Electron/Node imports) so it can
// be consumed safely from the web context.

export type Platform =
  | 'aix'
  | 'android'
  | 'darwin'
  | 'freebsd'
  | 'haiku'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'cygwin'
  | 'netbsd'

/** Static application metadata, baked in at build time. */
export interface AppInfo {
  name: string
  version: string
  description: string
  author: string
  license: string
  homepage: string
  /** Short git commit hash, or `'unknown'` outside a git checkout. */
  commit: string
  /** ISO timestamp of when the bundle was built. */
  buildDate: string
}

export interface AppApi {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<Platform>
  getInfo: () => Promise<AppInfo>
}

export interface WindowApi {
  minimize: () => void
  /** Toggle maximize/restore. */
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  /** Subscribe to maximize-state changes; returns an unsubscribe function. */
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
}

export interface SystemApi {
  /** Open an http(s) URL in the OS default browser. */
  openExternal: (url: string) => Promise<void>
  getSetting: (key: string) => Promise<unknown>
  setSetting: (key: string, value: unknown) => Promise<void>
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'

/** Snapshot of the auto-updater, pushed to the renderer as things progress. */
export interface UpdaterStatus {
  status: UpdateStatus
  /** Version of the available/downloaded update. */
  version?: string | null
  /** Download progress, 0–100 (only during `downloading`). */
  percent?: number | null
  /** Message for the `error` status. */
  error?: string | null
}

/** Details of a GitHub release, for the "Release Notes" dialog. */
export interface ReleaseInfo {
  /** Tag, e.g. `v1.0.0`. */
  version: string
  /** Release title. */
  name: string
  /** Release body, in Markdown. */
  notes: string
  /** Link to the release on GitHub. */
  url: string
  /** ISO timestamp the release was published. */
  publishedAt: string
}

export interface UpdaterApi {
  /** Trigger a check now (no-op in unpackaged dev builds). */
  check: () => Promise<void>
  /** Quit and install a downloaded update immediately. */
  install: () => void
  /** Last known status (covers events emitted before the renderer subscribed). */
  getStatus: () => Promise<UpdaterStatus>
  /** Subscribe to status changes; returns an unsubscribe function. */
  onStatusChange: (callback: (status: UpdaterStatus) => void) => () => void
  /** Fetch the latest published release from GitHub (`null` if unavailable). */
  getLatestRelease: () => Promise<ReleaseInfo | null>
}

// ── Releases (music catalog CMS) ─────────────────────────────────────────────

/** The kind of release. Mirrors the DB `check` constraint. */
export type ProjectType = 'single' | 'ep' | 'album' | 'remix' | 'bootleg' | 'compilation'

/** A distributor / streaming platform a release is available on. */
export type ReleasePlatform = 'Spotify' | 'Apple Music' | 'YouTube' | 'SoundCloud' | 'Amazon Music'

/** An artist credited on releases. */
export interface Artist {
  id: string
  name: string
}

/** A release with its resolved artist credits. */
export interface Release {
  id: string
  projectName: string
  projectType: ProjectType
  /** ISO date (`YYYY-MM-DD`) or `null`. */
  releaseDate: string | null
  genres: string[]
  /** Map of platform name → track URL. Keys are the platforms it's released on. */
  platformLinks: Record<string, string>
  visualLink: string | null
  masterLink: string | null
  coverArtUrl: string | null
  canvasUrl: string | null
  previewEnabled: boolean
  /** ISO timestamp. */
  createdAt: string
  artists: Artist[]
  /**
   * IDs of the child track releases, ordered, when this is an Album or EP.
   * Empty for every other project type. Use `releases.tracks(id)` to resolve
   * the full track records for display.
   */
  trackIds: string[]
}

/** Payload for creating a release. Artists are referenced by id (create them
 * first via `createArtist` so inline-added names get an id). */
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
  /**
   * Ordered IDs of the child track releases for an Album or EP. Each must be an
   * existing release row. Ignored (treated as empty) for other project types.
   */
  trackIds: string[]
}

/** One page of releases plus the metadata infinite scroll needs. */
export interface ReleasePage {
  releases: Release[]
  /** Total number of releases in the catalog, across all pages. */
  total: number
  /** Whether more releases remain beyond this page. */
  hasMore: boolean
}

/** A media file to upload to Supabase Storage. */
export interface UploadAssetInput {
  fileName: string
  contentType: string
  /** Raw file bytes (transferred over IPC via structured clone). */
  data: Uint8Array
}

export interface ReleasesApi {
  /**
   * A page of releases, newest first, with their artist credits. Pass `offset`
   * (rows to skip) and `limit` (page size) for infinite scroll; both default to
   * the first page. The result carries the catalog `total` and a `hasMore` flag.
   */
  list: (offset?: number, limit?: number) => Promise<ReleasePage>
  /** Create a release (and its artist relations). Returns the created row. */
  create: (input: ReleaseInput) => Promise<Release>
  /** Update a release (and its artist relations). Returns the updated row. */
  update: (id: string, input: ReleaseInput) => Promise<Release>
  /** Delete a release, its relations, and its media. */
  remove: (id: string) => Promise<void>
  /**
   * The child track releases of an Album or EP, in tracklist order, each with
   * its own artist credits. Returns an empty array for non-album/EP releases.
   */
  tracks: (albumId: string) => Promise<Release[]>
  /** All artists, alphabetical — cache for the multi-select dropdown. */
  listArtists: () => Promise<Artist[]>
  /** Get-or-create an artist by name (case-insensitive, no duplicates). */
  createArtist: (name: string) => Promise<Artist>
  /** Upload a media file to storage; resolves to its public URL. */
  uploadAsset: (input: UploadAssetInput) => Promise<string>
}

// ── Auth & access control ────────────────────────────────────────────────────

/** Where a user sits in the approval lifecycle. */
export type AccessStatus = 'pending' | 'approved' | 'banned'

/** Whether a user can administer access. */
export type UserRole = 'user' | 'admin'

/** A user's profile / access record. */
export interface Profile {
  id: string
  email: string
  name: string | null
  notes: string | null
  role: UserRole
  status: AccessStatus
  /** ISO timestamp. */
  createdAt: string
}

/** The signed-in identity (from Supabase Auth). */
export interface AuthUser {
  id: string
  email: string | null
}

/** Snapshot of the auth/access state, pushed to the renderer on change. */
export interface AuthState {
  authenticated: boolean
  user: AuthUser | null
  /** Null until the profile row is read; carries role + approval status. */
  profile: Profile | null
}

export interface AuthApi {
  /** Start Google sign-in (opens the system browser); resolves to the new state. */
  signInWithGoogle: () => Promise<AuthState>
  /** Sign out and clear the persisted session. */
  signOut: () => Promise<void>
  /** Current auth/access state (restores a persisted session on first call). */
  getState: () => Promise<AuthState>
  /** Subscribe to auth-state changes; returns an unsubscribe function. */
  onStateChange: (callback: (state: AuthState) => void) => () => void
}

/** Admin-only access management. All calls require an approved admin. */
export interface AccessApi {
  /** Everyone (pending / approved / banned), newest first. */
  listUsers: () => Promise<Profile[]>
  /** Approve / ban / reset a user's access. */
  setStatus: (id: string, status: AccessStatus) => Promise<Profile>
  /** Promote/demote a user's admin role. */
  setRole: (id: string, role: UserRole) => Promise<Profile>
  /** Edit a user's profile (name / notes; email is immutable). */
  updateUser: (id: string, changes: { name?: string; notes?: string }) => Promise<Profile>
}

/** The complete API surface exposed to the renderer. */
export interface RendererApi {
  app: AppApi
  window: WindowApi
  system: SystemApi
  updater: UpdaterApi
  releases: ReleasesApi
  auth: AuthApi
  access: AccessApi
}

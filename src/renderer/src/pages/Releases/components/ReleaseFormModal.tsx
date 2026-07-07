import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Button, Checkbox, FileField, Select, TagInput, TextField } from '@renderer/components/ui'
import { useArtists } from '../hooks/useArtists'
import { useReleaseTracks } from '../hooks/useReleaseTracks'
import { useTrackOptions } from '../hooks/useTrackOptions'
import { isMultiTrack, PLATFORMS, PROJECT_TYPES } from '../constants'
import type { Artist, ProjectType, Release, ReleaseInput } from '../types'
import { errorMessage } from '../utils'
import { ArtistSelect } from './ArtistSelect'
import { TrackSelect } from './TrackSelect'
import { PlatformLinksField } from './PlatformLinksField'
import { prepareCanvas, prepareCoverArt } from '../media'
import styles from './ReleaseFormModal.module.scss'

interface ReleaseFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Called after a successful create/update so the list can refresh. */
  onSaved: () => void
  /** When provided, the modal edits this release instead of creating one. */
  release?: Release | null
}

interface FieldErrors {
  projectName?: string
  projectType?: string
}

function initialForm(release: Release | null): {
  projectName: string
  projectType: ProjectType | ''
  releaseDate: string
  artistIds: string[]
  trackIds: string[]
  genres: string[]
  platformLinks: Record<string, string>
  visualLink: string
  masterLink: string
  previewEnabled: boolean
} {
  return {
    projectName: release?.projectName ?? '',
    projectType: release?.projectType ?? '',
    releaseDate: release?.releaseDate ?? '',
    artistIds: release ? release.artists.map((artist) => artist.id) : [],
    trackIds: release?.trackIds ?? [],
    genres: release?.genres ?? [],
    platformLinks: release?.platformLinks ?? {},
    visualLink: release?.visualLink ?? '',
    masterLink: release?.masterLink ?? '',
    previewEnabled: release?.previewEnabled ?? false
  }
}

/** Upload a file's bytes to storage and return its public URL. */
async function uploadFile(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  return window.api.releases.uploadAsset({
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    data
  })
}

/**
 * Inline creator for an "album-only" track — a release that exists only inside
 * this album (hidden from the catalog). It has no artwork of its own: cover art
 * and canvas are inherited from the album at display time. Rendered inside the
 * parent release form's `<form>`, so it uses plain buttons (never `type=submit`)
 * and swallows Enter to avoid submitting the album while you're filling it in.
 * Full details (including its own artwork) can be edited later from its track row.
 */
function TrackCreateForm({
  artists,
  onCreateArtist,
  onCreated,
  onCancel
}: {
  artists: Artist[]
  onCreateArtist: (name: string) => Promise<Artist>
  onCreated: (track: Release) => void
  onCancel: () => void
}): React.JSX.Element {
  const [projectName, setProjectName] = useState('')
  const [artistIds, setArtistIds] = useState<string[]>([])
  const [releaseDate, setReleaseDate] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [platformLinks, setPlatformLinks] = useState<Record<string, string>>({})
  const [masterLink, setMasterLink] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (): Promise<void> => {
    const name = projectName.trim()
    if (!name) {
      setNameError('Track name is required.')
      return
    }
    setNameError(undefined)
    setSubmitError(null)
    setSubmitting(true)
    try {
      const created = await window.api.releases.create({
        projectName: name,
        projectType: 'single',
        releaseDate: releaseDate || null,
        genres,
        platformLinks,
        visualLink: null,
        masterLink: masterLink.trim() || null,
        coverArtUrl: null,
        canvasUrl: null,
        previewEnabled: false,
        isAlbumTrack: true,
        artistIds,
        trackIds: []
      })
      onCreated(created)
    } catch (err) {
      setSubmitError(errorMessage(err, 'Failed to create track.'))
    } finally {
      setSubmitting(false)
    }
  }

  // Keep Enter from submitting the parent album form. The sub-fields that use
  // Enter (artists, genres) call preventDefault themselves, so we only swallow it
  // for the plain inputs (name, master link, date) that would otherwise submit.
  const guardEnter = (event: React.KeyboardEvent): void => {
    const target = event.target as HTMLElement
    if (event.key === 'Enter' && !event.defaultPrevented && target.tagName === 'INPUT') {
      event.preventDefault()
    }
  }

  return (
    <div className={styles.trackCreate} onKeyDown={guardEnter}>
      <p className={styles.trackCreateHint}>
        New album-only track — hidden from the catalog. Its cover art and canvas are inherited from
        the album. You can fill in the rest (or give it its own artwork) later from its track row.
      </p>

      <TextField
        label="Track name"
        placeholder="e.g. Interlude"
        value={projectName}
        error={nameError}
        onChange={(event) => setProjectName(event.target.value)}
        autoFocus
      />

      <ArtistSelect
        label="Artists"
        artists={artists}
        selectedIds={artistIds}
        onChange={setArtistIds}
        onCreate={onCreateArtist}
      />

      <TagInput
        label="Genres"
        value={genres}
        onChange={setGenres}
        placeholder="Type a genre and press Enter"
      />

      <PlatformLinksField
        label="Platforms & track links"
        platforms={PLATFORMS}
        value={platformLinks}
        onChange={setPlatformLinks}
      />

      <div className={styles.grid}>
        <TextField
          label="Release date"
          type="date"
          value={releaseDate}
          onChange={(event) => setReleaseDate(event.target.value)}
        />
        <TextField
          label="Final master link"
          type="url"
          placeholder="https://…"
          value={masterLink}
          onChange={(event) => setMasterLink(event.target.value)}
        />
      </div>

      {submitError && <p className={styles.error}>{submitError}</p>}

      <div className={styles.trackCreateActions}>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add track'}
        </Button>
      </div>
    </div>
  )
}

/**
 * The form body. Mounted fresh each time the modal opens (Modal only renders its
 * children while open), so `useState` initializers seed it from `release` with
 * no prefill effect.
 */
function ReleaseForm({
  release,
  onClose,
  onSaved
}: {
  release: Release | null
  onClose: () => void
  onSaved: () => void
}): React.JSX.Element {
  const editing = Boolean(release)
  const { artists, addArtist } = useArtists()

  const [form, setForm] = useState(() => initialForm(release))

  // Track linking only applies to Albums/EPs — load the pickable pool lazily
  // (and exclude this release, so it can't be a track of itself).
  const showTracks = isMultiTrack(form.projectType)
  const { options: trackOptions, loading: trackOptionsLoading } = useTrackOptions(
    showTracks,
    release?.id
  )

  // When editing an existing Album/EP, load its current tracklist so already-linked
  // tracks render as chips even though album-only ones are hidden from the pool
  // (the pool comes from the catalog list, which excludes them). Without this they
  // couldn't be resolved by id and would silently drop on save.
  const { tracks: linkedTracks } = useReleaseTracks(release)

  // Album-only tracks created inline this session, so their chips resolve before
  // a save/reload round-trips them back through the pool.
  const [createdTracks, setCreatedTracks] = useState<Release[]>([])
  const [showTrackCreate, setShowTrackCreate] = useState(false)

  // Everything the picker can resolve by id: the catalog pool, this album's
  // existing tracks, and any created this session. De-duped, pool order first.
  const trackPool = useMemo(() => {
    const byId = new Map<string, Release>()
    for (const track of [...trackOptions, ...linkedTracks, ...createdTracks]) {
      byId.set(track.id, track)
    }
    return [...byId.values()]
  }, [trackOptions, linkedTracks, createdTracks])

  // Media: a newly-picked File replaces the existing URL on save. Track both so
  // "keep current", "replace", and "remove" are all expressible.
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(release?.coverArtUrl ?? null)
  const [coverPreview, setCoverPreview] = useState<string | null>(release?.coverArtUrl ?? null)
  const [canvasFile, setCanvasFile] = useState<File | null>(null)
  const [canvasUrl, setCanvasUrl] = useState<string | null>(release?.canvasUrl ?? null)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Media validation errors + a busy flag while compressing (video can take a
  // few seconds). Submit is blocked while busy or if either has an error.
  const [coverError, setCoverError] = useState<string | null>(null)
  const [canvasError, setCanvasError] = useState<string | null>(null)
  const [mediaBusy, setMediaBusy] = useState(false)

  // Track the object URL we create for the preview so we can revoke it (on
  // replace and on unmount). Mutated only in the picker handler / effect.
  const objectUrlRef = useRef<string | null>(null)
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    []
  )

  const patch = <K extends keyof typeof form>(key: K, value: (typeof form)[K]): void =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // An inline-created album-only track: remember it so its chip resolves, and
  // append it to the tracklist in order.
  const handleTrackCreated = (track: Release): void => {
    setCreatedTracks((prev) => [...prev, track])
    setForm((prev) => ({ ...prev, trackIds: [...prev.trackIds, track.id] }))
    setShowTrackCreate(false)
  }

  const pickCover = async (file: File | null): Promise<void> => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setCoverError(null)
    if (!file) {
      setCoverFile(null)
      setCoverUrl(null)
      setCoverPreview(null)
      return
    }

    setMediaBusy(true)
    try {
      const result = await prepareCoverArt(file)
      if ('error' in result) {
        setCoverError(result.error)
        setCoverFile(null)
        setCoverPreview(null)
        return
      }
      const url = URL.createObjectURL(result.file)
      objectUrlRef.current = url
      setCoverFile(result.file)
      setCoverPreview(url)
    } finally {
      setMediaBusy(false)
    }
  }

  const pickCanvas = async (file: File | null): Promise<void> => {
    setCanvasError(null)
    if (!file) {
      setCanvasFile(null)
      setCanvasUrl(null)
      return
    }

    setMediaBusy(true)
    try {
      const result = await prepareCanvas(file)
      if ('error' in result) {
        setCanvasError(result.error)
        setCanvasFile(null)
        return
      }
      setCanvasFile(result.file)
    } finally {
      setMediaBusy(false)
    }
  }

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (!form.projectName.trim()) next.projectName = 'Project name is required.'
    if (!form.projectType) next.projectType = 'Choose a project type.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const [coverArtUrl, finalCanvasUrl] = await Promise.all([
        coverFile ? uploadFile(coverFile) : Promise.resolve(coverUrl),
        canvasFile ? uploadFile(canvasFile) : Promise.resolve(canvasUrl)
      ])

      const payload: ReleaseInput = {
        projectName: form.projectName.trim(),
        projectType: form.projectType as ProjectType,
        releaseDate: form.releaseDate || null,
        genres: form.genres,
        platformLinks: form.platformLinks,
        visualLink: form.visualLink.trim() || null,
        masterLink: form.masterLink.trim() || null,
        coverArtUrl,
        canvasUrl: finalCanvasUrl,
        previewEnabled: form.previewEnabled,
        artistIds: form.artistIds,
        // Only Albums/EPs carry a tracklist; the service ignores it otherwise,
        // but keep the payload clean so a type change drops stale links.
        trackIds: isMultiTrack(form.projectType) ? form.trackIds : []
      }

      if (release) await window.api.releases.update(release.id, payload)
      else await window.api.releases.create(payload)

      onSaved()
      onClose()
    } catch (err) {
      setSubmitError(errorMessage(err, 'Failed to save release.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.grid}>
        <TextField
          label="Project name"
          placeholder="e.g. Midnight Bloom"
          value={form.projectName}
          error={errors.projectName}
          onChange={(event) => patch('projectName', event.target.value)}
          autoFocus
        />
        <Select
          label="Project type"
          placeholder="Select a type…"
          options={PROJECT_TYPES}
          value={form.projectType}
          error={errors.projectType}
          onChange={(event) => patch('projectType', event.target.value as ProjectType)}
        />
      </div>

      <ArtistSelect
        label="Artists"
        artists={artists}
        selectedIds={form.artistIds}
        onChange={(ids) => patch('artistIds', ids)}
        onCreate={addArtist}
      />

      {showTracks && (
        <div className={styles.tracksField}>
          <TrackSelect
            label="Tracks"
            options={trackPool}
            selectedIds={form.trackIds}
            onChange={(ids) => patch('trackIds', ids)}
            loading={trackOptionsLoading}
          />
          {showTrackCreate ? (
            <TrackCreateForm
              artists={artists}
              onCreateArtist={addArtist}
              onCreated={handleTrackCreated}
              onCancel={() => setShowTrackCreate(false)}
            />
          ) : (
            <button
              type="button"
              className={styles.addTrackButton}
              onClick={() => setShowTrackCreate(true)}
            >
              + New album-only track
            </button>
          )}
        </div>
      )}

      <TagInput
        label="Genres"
        value={form.genres}
        onChange={(genres) => patch('genres', genres)}
        placeholder="Type a genre and press Enter"
      />

      <PlatformLinksField
        label="Platforms & track links"
        platforms={PLATFORMS}
        value={form.platformLinks}
        onChange={(platformLinks) => patch('platformLinks', platformLinks)}
      />

      <div className={styles.grid}>
        <TextField
          label="Release date"
          type="date"
          value={form.releaseDate}
          onChange={(event) => patch('releaseDate', event.target.value)}
        />
        <TextField
          label="Graphics / visual link"
          type="url"
          placeholder="https://…"
          value={form.visualLink}
          onChange={(event) => patch('visualLink', event.target.value)}
        />
      </div>

      <TextField
        label="Final master link"
        type="url"
        placeholder="https://…"
        value={form.masterLink}
        onChange={(event) => patch('masterLink', event.target.value)}
      />

      <div className={styles.grid}>
        <FileField
          label="Cover art"
          accept="image/*"
          fileName={coverFile?.name ?? (coverUrl ? 'Current cover' : null)}
          previewUrl={coverPreview}
          hint="Square 500×500 to 3000×3000 — stored as 500×500 WebP"
          onSelect={(file) => void pickCover(file)}
        />
        <FileField
          label="Spotify canvas (video)"
          accept="video/*"
          fileName={canvasFile?.name ?? (canvasUrl ? 'Current canvas video' : null)}
          hint="1080×1920 — stored as 480p WebM"
          onSelect={(file) => void pickCanvas(file)}
        />
      </div>

      {coverError && <p className={styles.mediaError}>{coverError}</p>}
      {canvasError && <p className={styles.mediaError}>{canvasError}</p>}
      {mediaBusy && <p className={styles.mediaNote}>Processing media…</p>}

      <Checkbox
        label="Show on website"
        description="Make this release visible in the public preview."
        checked={form.previewEnabled}
        onChange={(event) => patch('previewEnabled', event.target.checked)}
      />

      {submitError && <p className={styles.error}>{submitError}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || mediaBusy || Boolean(coverError) || Boolean(canvasError)}
        >
          {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Release'}
        </Button>
      </div>
    </form>
  )
}

/** Modal for creating or editing a release. */
export function ReleaseFormModal({
  isOpen,
  onClose,
  onSaved,
  release
}: ReleaseFormModalProps): React.JSX.Element {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={release ? 'Edit Release' : 'Add Release'}
      size="lg"
    >
      <ReleaseForm release={release ?? null} onClose={onClose} onSaved={onSaved} />
    </Modal>
  )
}

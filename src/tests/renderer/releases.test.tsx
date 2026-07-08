import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TrackSelect } from '@renderer/pages/Releases/components/TrackSelect'
import { ReleaseDetailModal } from '@renderer/pages/Releases/components/ReleaseDetailModal'
import { ReleaseFormModal } from '@renderer/pages/Releases/components/ReleaseFormModal'
import type { Release } from '@renderer/pages/Releases/types'

// A fully-populated release with sensible defaults; override per test.
function makeRelease(overrides: Partial<Release> = {}): Release {
  return {
    id: 'r-1',
    projectName: 'Test Release',
    projectType: 'single',
    releaseDate: '2026-01-01',
    genres: [],
    platformLinks: {},
    visualLink: null,
    masterLink: null,
    preSaveLink: null,
    coverArtUrl: null,
    canvasUrl: null,
    previewEnabled: false,
    isAlbumTrack: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    artists: [],
    trackIds: [],
    ...overrides
  }
}

// Minimal `window.api` stub covering everything the Releases UI touches.
function stubApi(overrides: Partial<Record<string, unknown>> = {}): void {
  const releases = {
    list: vi.fn().mockResolvedValue({ releases: [], total: 0, hasMore: false }),
    create: vi.fn().mockResolvedValue(makeRelease()),
    update: vi.fn().mockResolvedValue(makeRelease()),
    remove: vi.fn().mockResolvedValue(undefined),
    tracks: vi.fn().mockResolvedValue([]),
    listArtists: vi.fn().mockResolvedValue([]),
    createArtist: vi.fn(),
    uploadAsset: vi.fn(),
    ...overrides
  }
  // Only `releases` + `system` are needed by these components.
  ;(window as unknown as { api: unknown }).api = {
    releases,
    system: { openExternal: vi.fn() }
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('TrackSelect', () => {
  const options: Release[] = [
    makeRelease({ id: 't-1', projectName: 'Alpha', projectType: 'single' }),
    makeRelease({ id: 't-2', projectName: 'Beta', projectType: 'remix' })
  ]

  it('adds a release as a track when picked from the dropdown', async () => {
    const onChange = vi.fn()
    render(<TrackSelect options={options} selectedIds={[]} onChange={onChange} />)

    const input = screen.getByPlaceholderText(/search releases to add as tracks/i)
    fireEvent.focus(input)

    await userEvent.click(screen.getByText('Alpha'))
    expect(onChange).toHaveBeenCalledWith(['t-1'])
  })

  it('renders selected tracks as ordered, removable chips', () => {
    const onChange = vi.fn()
    render(<TrackSelect options={options} selectedIds={['t-2', 't-1']} onChange={onChange} />)

    // Order follows selection order, not the options order.
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Remove Beta'))
    expect(onChange).toHaveBeenCalledWith(['t-1'])
  })
})

describe('ReleaseFormModal — conditional track section', () => {
  beforeEach(() => stubApi())

  it('shows the Tracks picker for an Album', async () => {
    render(
      <ReleaseFormModal
        isOpen
        release={makeRelease({ projectType: 'album' })}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )
    expect(await screen.findByText('Tracks')).toBeInTheDocument()
  })

  it('hides the Tracks picker for a Single', () => {
    render(
      <ReleaseFormModal
        isOpen
        release={makeRelease({ projectType: 'single' })}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )
    expect(screen.queryByText('Tracks')).not.toBeInTheDocument()
  })

  it('submits the album with its linked track ids', async () => {
    const update = vi.fn().mockResolvedValue(makeRelease())
    stubApi({ update })
    const onSaved = vi.fn()

    render(
      <ReleaseFormModal
        isOpen
        release={makeRelease({ id: 'album-1', projectType: 'ep', trackIds: ['t-1', 't-2'] })}
        onClose={vi.fn()}
        onSaved={onSaved}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(update).toHaveBeenCalled())
    const [, payload] = update.mock.calls[0]
    expect(payload.trackIds).toEqual(['t-1', 't-2'])
  })
})

describe('ReleaseDetailModal — album/EP two-column layout', () => {
  it('loads and lists linked tracks, and drills into one on click', async () => {
    const tracks = [
      makeRelease({ id: 't-1', projectName: 'First Track' }),
      makeRelease({ id: 't-2', projectName: 'Second Track' })
    ]
    const tracksFn = vi.fn().mockResolvedValue(tracks)
    stubApi({ tracks: tracksFn })
    const onOpenTrack = vi.fn()

    const album = makeRelease({ id: 'album-1', projectName: 'The Album', projectType: 'album' })
    render(
      <ReleaseDetailModal
        release={album}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenTrack={onOpenTrack}
      />
    )

    expect(screen.getByText('Tracks')).toBeInTheDocument()
    expect(await screen.findByText('First Track')).toBeInTheDocument()
    expect(tracksFn).toHaveBeenCalledWith('album-1')

    await userEvent.click(screen.getByText('Second Track'))
    expect(onOpenTrack).toHaveBeenCalledWith(tracks[1])
  })

  it('shows no tracklist for a standalone release', () => {
    const tracksFn = vi.fn().mockResolvedValue([])
    stubApi({ tracks: tracksFn })

    render(
      <ReleaseDetailModal
        release={makeRelease({ projectType: 'single' })}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenTrack={vi.fn()}
      />
    )

    expect(screen.queryByText('Tracks')).not.toBeInTheDocument()
    expect(tracksFn).not.toHaveBeenCalled()
  })
})

describe('ReleaseDetailModal — pre-save countdown', () => {
  beforeEach(() => stubApi())

  function renderDetail(release: Release): void {
    render(
      <ReleaseDetailModal
        release={release}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenTrack={vi.fn()}
      />
    )
  }

  it('before the release date: shows the countdown + pre-save link and hides platform links', () => {
    renderDetail(
      makeRelease({
        releaseDate: '2999-12-31',
        platformLinks: { Spotify: 'https://open.spotify.com/x' },
        preSaveLink: 'https://presave.example/x'
      })
    )

    expect(screen.getByRole('timer', { name: /time until release/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pre-save/i })).toBeInTheDocument()
    // The streaming link is hidden even though it exists on the release.
    expect(screen.queryByRole('button', { name: 'Spotify' })).not.toBeInTheDocument()
  })

  it('on/after the release date: shows platform links and no countdown', () => {
    renderDetail(
      makeRelease({
        releaseDate: '2000-01-01',
        platformLinks: { Spotify: 'https://open.spotify.com/x' },
        preSaveLink: 'https://presave.example/x'
      })
    )

    expect(screen.getByRole('button', { name: 'Spotify' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pre-save/i })).not.toBeInTheDocument()
  })

  it('opens the pre-save link externally when clicked', async () => {
    const openExternal = vi.fn()
    ;(window as unknown as { api: { system: { openExternal: unknown } } }).api.system.openExternal =
      openExternal

    renderDetail(
      makeRelease({ releaseDate: '2999-12-31', preSaveLink: 'https://presave.example/x' })
    )

    await userEvent.click(screen.getByRole('button', { name: /pre-save/i }))
    expect(openExternal).toHaveBeenCalledWith('https://presave.example/x')
  })
})

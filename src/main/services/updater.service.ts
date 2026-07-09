import { app, BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'
import { IPC_CHANNELS } from '../ipc/channels'
import { logger } from '../utils/logger'
import type { ReleaseInfo, UpdaterStatus } from '../../preload/ipc/types'

// `electron-updater` is CommonJS; grab the singleton off the default export.
const { autoUpdater } = electronUpdater

// Repository the app updates from — must match `publish` in electron-builder.yml.
const GITHUB_OWNER = 'haneeshraj'
const GITHUB_REPO = 'candy-lab'

// Last status is cached so a renderer that mounts after an event still gets it
// (via `getUpdaterStatus` / the `updater:get-status` channel).
let lastStatus: UpdaterStatus = { status: 'idle' }

function broadcast(status: UpdaterStatus): void {
  lastStatus = status
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC_CHANNELS.UPDATER_STATUS_CHANGED, status)
  }
}

export function getUpdaterStatus(): UpdaterStatus {
  return lastStatus
}

export async function checkForUpdates(): Promise<void> {
  // Auto-update only works in a packaged app; skip in dev to avoid noise/errors.
  if (!app.isPackaged) {
    logger.info('Skipping update check — app is not packaged (dev)')
    return
  }
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    logger.error('Update check failed', error)
    broadcast({ status: 'error', error: String(error) })
  }
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}

// Minimal shape of the GitHub release response we consume.
interface GithubReleaseResponse {
  tag_name?: string
  name?: string | null
  body?: string | null
  html_url?: string
  published_at?: string
}

/**
 * Fetch the release notes for the *currently running* version (not the newest
 * release) for the "Release Notes" dialog — a user should see what shipped in
 * the build they have installed. Looks up the release by its `v{version}` tag,
 * matching the tag electron-builder publishes. Public repositories do not need
 * an auth token. Returns `null` if the request fails (offline, no matching
 * release — e.g. an unpublished dev version — or a non-OK status).
 */
export async function getCurrentRelease(): Promise<ReleaseInfo | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'candy-lab'
  }

  const tag = `v${app.getVersion()}`

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/${tag}`,
      { headers }
    )
    if (!res.ok) {
      logger.warn(`Fetch release for ${tag} failed: HTTP ${res.status}`)
      return null
    }
    const data = (await res.json()) as GithubReleaseResponse
    return {
      version: data.tag_name ?? '',
      name: data.name ?? data.tag_name ?? '',
      notes: data.body ?? '',
      url: data.html_url ?? '',
      publishedAt: data.published_at ?? ''
    }
  } catch (error) {
    logger.error('Fetch current release errored', error)
    return null
  }
}

/**
 * Wire the auto-updater once, on app ready. Fully automatic: it downloads any
 * available update and installs it on the next quit. Progress is streamed to
 * the renderer so the UI can reflect it.
 */
export function initUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = logger

  autoUpdater.on('checking-for-update', () => broadcast({ status: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    broadcast({ status: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => broadcast({ status: 'idle' }))
  autoUpdater.on('download-progress', (progress) =>
    broadcast({ status: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    broadcast({ status: 'ready', version: info.version })
  )
  autoUpdater.on('error', (error) => broadcast({ status: 'error', error: String(error) }))

  void checkForUpdates()
}

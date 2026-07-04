import { app, BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'
import { IPC_CHANNELS } from '../ipc/channels'
import { logger } from '../utils/logger'
import type { UpdaterStatus } from '../../preload/ipc/types'

// `electron-updater` is CommonJS; grab the singleton off the default export.
const { autoUpdater } = electronUpdater

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

/**
 * Wire the auto-updater once, on app ready. Fully automatic: it downloads any
 * available update and installs it on the next quit. Progress is streamed to
 * the renderer so the UI can reflect it.
 */
export function initUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = logger

  // Private repo: authenticate every request with the baked-in read-only token
  // so the client can reach the release feed + assets without any user setup.
  if (__UPDATE_TOKEN__) {
    autoUpdater.requestHeaders = { authorization: `token ${__UPDATE_TOKEN__}` }
  }

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

import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { APP_CONFIG } from './config'
import { registerAppSecurity } from './events'
import { registerIpc } from '../ipc/registerIpc'
import { initUpdater } from '../services/updater.service'
import { createMainWindow } from '../windows/createMainWindow'
import { createSplashWindow } from '../windows/createSplashWindow'
import { logger } from '../utils/logger'

/**
 * Wire the Electron application lifecycle. This is the single entry point the
 * main `index.ts` calls — everything else hangs off it.
 */
export function bootstrap(): void {
  void app.whenReady().then(onReady)
  app.on('window-all-closed', onWindowAllClosed)
}

function onReady(): void {
  electronApp.setAppUserModelId(APP_CONFIG.appUserModelId)

  // F12 toggles devtools in dev; ignore reload shortcuts in production.
  app.on('browser-window-created', (_event, window) => optimizer.watchWindowShortcuts(window))

  registerAppSecurity()
  registerIpc()
  openWindows()
  initUpdater() // wires events + kicks off the automatic check (packaged builds only)

  // macOS: recreate a window when the dock icon is clicked and none are open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openWindows()
  })

  logger.info('Application ready')
}

function openWindows(): void {
  if (APP_CONFIG.enableSplash) {
    const splash = createSplashWindow()
    const main = createMainWindow({ autoShow: false })
    main.once('ready-to-show', () => {
      splash.close()
      main.show()
    })
    return
  }
  createMainWindow()
}

function onWindowAllClosed(): void {
  // Standard macOS behavior: stay alive until the user quits explicitly.
  if (process.platform !== 'darwin') app.quit()
}

import { BrowserWindow } from 'electron'
import icon from '../../../resources/icon.png?asset'
import { APP_CONFIG, getPreloadPath, getRendererDevUrl, getRendererHtml } from '../app/config'
import { IPC_CHANNELS } from '../ipc/channels'
import { windowManager } from './windowManager'
import { isDev } from '../utils/helpers'

interface CreateMainWindowOptions {
  /** Show the window automatically once it's ready to paint (default: true). */
  autoShow?: boolean
}

/**
 * Create the primary application window with a secure webPreferences profile:
 * context isolation on, node integration off, preload as the only bridge.
 */
export function createMainWindow({ autoShow = true }: CreateMainWindowOptions = {}): BrowserWindow {
  const window = new BrowserWindow({
    width: APP_CONFIG.window.main.width,
    height: APP_CONFIG.window.main.height,
    minWidth: APP_CONFIG.window.main.minWidth,
    minHeight: APP_CONFIG.window.main.minHeight,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: getPreloadPath(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.on('ready-to-show', () => {
    if (autoShow) window.show()
  })

  // Keep renderers informed of maximize state (for a custom title bar).
  const emitMaximizeState = (): void => {
    if (!window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, window.isMaximized())
    }
  }
  window.on('maximize', emitMaximizeState)
  window.on('unmaximize', emitMaximizeState)

  loadRenderer(window)
  windowManager.register('main', window)
  return window
}

/** Load the dev server in development, or the built HTML in production. */
function loadRenderer(window: BrowserWindow): void {
  const devUrl = getRendererDevUrl()
  if (isDev && devUrl) {
    void window.loadURL(devUrl)
  } else {
    void window.loadFile(getRendererHtml())
  }
}

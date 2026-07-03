import { app, shell } from 'electron'
import { getRendererDevUrl } from './config'
import { logger } from '../utils/logger'

// App-wide web-contents hardening. Applied to EVERY window/webContents, so
// security policy lives in one place instead of per-window setup.

export function registerAppSecurity(): void {
  app.on('web-contents-created', (_event, contents) => {
    // Never let the app open native child windows; route real links to the OS
    // browser and deny everything else.
    contents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:')) {
        void shell.openExternal(url)
      }
      return { action: 'deny' }
    })

    // Block in-app navigation away from our own renderer (dev server or file://).
    contents.on('will-navigate', (event, url) => {
      const devUrl = getRendererDevUrl()
      const isOwnDevServer = Boolean(devUrl) && url.startsWith(devUrl as string)
      const isOwnFile = url.startsWith('file://')
      if (!isOwnDevServer && !isOwnFile) {
        event.preventDefault()
        logger.warn('Blocked navigation to', url)
      }
    })
  })
}

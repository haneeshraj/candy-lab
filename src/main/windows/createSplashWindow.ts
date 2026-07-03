import { BrowserWindow } from 'electron'
import { APP_CONFIG } from '../app/config'
import { windowManager } from './windowManager'

// Frameless splash shown while the main window loads (enable via
// APP_CONFIG.enableSplash). Self-contained inline markup — no renderer/UI
// dependency, no Node exposure.

const SPLASH_MARKUP = `<!doctype html>
<html>
  <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#160a0b;color:#efe7d3;font-family:system-ui,sans-serif">
    <div style="font-size:18px;font-weight:600;letter-spacing:0.04em">candy-lab</div>
  </body>
</html>`

export function createSplashWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: APP_CONFIG.window.splash.width,
    height: APP_CONFIG.window.splash.height,
    frame: false,
    resizable: false,
    center: true,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  void window.loadURL(`data:text/html,${encodeURIComponent(SPLASH_MARKUP)}`)
  windowManager.register('splash', window)
  return window
}

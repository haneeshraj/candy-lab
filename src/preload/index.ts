import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { appBridge } from './bridge/app.bridge'
import { windowBridge } from './bridge/window.bridge'
import { systemBridge } from './bridge/system.bridge'
import { updaterBridge } from './bridge/updater.bridge'
import type { RendererApi } from './ipc/types'

// The single, curated API surface exposed to the renderer. Domain-grouped and
// typed — no raw ipcRenderer and no Node APIs leak through.
const api: RendererApi = {
  app: appBridge,
  window: windowBridge,
  system: systemBridge,
  updater: updaterBridge
}

// Only expose via contextBridge when context isolation is on (it always is in
// this app). `electron` is the toolkit's safe helper kept for convenience.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
